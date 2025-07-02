import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper function to extract file path from Supabase Storage URL
function extractStorageFilePath(url: string): string | null {
  try {
    // Supabase Storage URLs have the format: 
    // https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find the bucket name and path
    const objectIndex = pathParts.indexOf('object');
    const publicIndex = pathParts.indexOf('public');
    
    if (objectIndex !== -1 && publicIndex !== -1 && publicIndex > objectIndex) {
      // Get everything after the bucket name
      const bucketIndex = publicIndex + 1;
      if (bucketIndex < pathParts.length) {
        // Skip bucket name and get the file path
        return pathParts.slice(bucketIndex + 1).join('/');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing storage URL:', error);
    return null;
  }
}

// Helper function to delete file from Supabase Storage
async function deleteStorageFile(fileUrl: string, bucketName: string, supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  try {
    if (!fileUrl) return true; // Nothing to delete
    
    const filePath = extractStorageFilePath(fileUrl);
    if (!filePath) {
      console.warn('Could not extract file path from URL:', fileUrl);
      return false;
    }
    
    console.log(`Deleting file from storage: ${bucketName}/${filePath}`);
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      console.error(`Error deleting file from ${bucketName}:`, error);
      return false;
    }
    
    console.log(`Successfully deleted file: ${bucketName}/${filePath}`);
    return true;
  } catch (error) {
    console.error('Error in deleteStorageFile:', error);
    return false;
  }
}

// PUT method - Update project (edit project name)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { title } = await request.json();
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Project title is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Limit title length for security and UX
    if (title.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Project title must be less than 200 characters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, verify the project exists and belongs to the user
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id, title')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Update the project title
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({ title: title.trim() })
      .eq('id', params.id)
      .eq('user_id', user.id) // Double-check ownership
      .select()
      .single();

    if (updateError) {
      console.error('Error updating project:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project: updatedProject
    });

  } catch (error) {
    console.error('Error in PUT /api/projects/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE method - Delete project and all related resources
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, fetch the project to verify ownership and get file URLs
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id, video_url, thumbnail_url, title')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    console.log(`Starting deletion process for project: ${project.title} (${project.id})`);

    // Track deletion results
    const deletionResults = {
      videoFile: true,
      thumbnailFile: true,
      databaseRecord: false
    };

    // Delete video file from storage
    if (project.video_url) {
      deletionResults.videoFile = await deleteStorageFile(
        project.video_url, 
        'videos', 
        supabase
      );
    }

    // Delete thumbnail file from storage
    if (project.thumbnail_url) {
      deletionResults.thumbnailFile = await deleteStorageFile(
        project.thumbnail_url, 
        'videos', // Thumbnails are also stored in videos bucket
        supabase
      );
    }

    // Delete project record from database
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id); // Double-check ownership

    if (deleteError) {
      console.error('Error deleting project from database:', deleteError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to delete project from database',
          details: deleteError.message,
          partialDeletion: {
            videoFileDeleted: deletionResults.videoFile,
            thumbnailFileDeleted: deletionResults.thumbnailFile,
            databaseRecordDeleted: false
          }
        },
        { status: 500 }
      );
    }

    deletionResults.databaseRecord = true;

    console.log(`Successfully deleted project: ${project.title} (${project.id})`);
    console.log('Deletion results:', deletionResults);

    // Return success with deletion summary
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
      deletionSummary: {
        projectId: project.id,
        projectTitle: project.title,
        videoFileDeleted: deletionResults.videoFile,
        thumbnailFileDeleted: deletionResults.thumbnailFile,
        databaseRecordDeleted: deletionResults.databaseRecord
      }
    });

  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}