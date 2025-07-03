import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

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
    logger.error('Error parsing storage URL', error, { action: 'extractStorageFilePath', url });
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
    
    console.log(`🗑️ Attempting to delete file: ${bucketName}/${filePath}`);
    console.log(`📁 Full file URL: ${fileUrl}`);
    
    // Step 1: Verify file exists before deletion
    console.log(`🔍 Step 1: Checking if file exists before deletion...`);
    const { data: preDeleteCheck, error: preDeleteError } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (preDeleteError) {
      console.log(`❌ File doesn't exist or can't be accessed: ${preDeleteError.message}`);
      return true; // File doesn't exist, consider it "deleted"
    }
    console.log(`✅ File exists and is accessible (size: ${preDeleteCheck?.size || 'unknown'} bytes)`);
    
    // Step 2: Attempt deletion
    console.log(`🗑️ Step 2: Attempting to delete file...`);
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    console.log(`🔄 Storage delete API response:`);
    console.log(`   - data:`, deleteData);
    console.log(`   - error:`, deleteError);
    
    if (deleteError) {
      logger.error('Delete API returned error', deleteError, { 
        action: 'deleteStorageFile',
        bucketName,
        filePath,
        errorDetails: logger.safeStringify(deleteError)
      });
      
      
      // Check for specific permission errors
      if (deleteError.message?.includes('access') || deleteError.message?.includes('permission')) {
        logger.error('PERMISSION ERROR: Likely missing RLS policy for DELETE on videos bucket', deleteError, {
          action: 'deleteStorageFile',
          bucketName,
          requiredPolicy: "bucket_id = 'videos' AND owner = auth.uid()::text"
        });
      }
      return false;
    }
    
    // Note: data: [] with error: null can actually mean successful deletion
    // The empty array doesn't necessarily indicate failure
    console.log(`📝 Note: Empty data array (${JSON.stringify(deleteData)}) with null error may indicate successful deletion`);
    console.log(`   This is a known behavior of Supabase Storage API`);
    console.log(`   Proceeding to verify actual deletion status...`);
    
    // Step 3: Verify deletion by attempting to download
    console.log(`🔍 Step 3: Verifying deletion by attempting to access file...`);
    const { data: postDeleteCheck, error: postDeleteError } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (postDeleteError) {
      // File is inaccessible, likely deleted successfully
      console.log(`✅ DELETION VERIFIED: File is no longer accessible`);
      console.log(`   Error when trying to access:`, postDeleteError.message);
      return true;
    } else {
      // File is still accessible, deletion failed
      console.warn(`⚠️ DELETION FAILED: File is still accessible after deletion attempt`);
      console.warn(`   File size:`, postDeleteCheck?.size || 'unknown');
      return false;
    }
  } catch (error) {
    logger.error('Unexpected error in deleteStorageFile', error, { action: 'deleteStorageFile', fileUrl });
    return false;
  }
}

// PUT method - Update project (edit project name)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .eq('id', id)
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
      .eq('id', id)
      .eq('user_id', user.id) // Double-check ownership
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating project', updateError, { 
        action: 'updateProject',
        projectId: id,
        userId: user.id
      });
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
    logger.error('Error in PUT /api/projects/[id]', error, { 
      action: 'updateProject',
      projectId: 'unknown'
    });
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .eq('id', id)
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
    console.log(`Attempting to delete project from database: ${project.title} (${id})`);
    
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Double-check ownership

    if (deleteError) {
      logger.error('Failed to delete project from database', deleteError, {
        action: 'deleteProject',
        projectId: id,
        userId: user.id
      });
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
    console.log(`✅ Successfully deleted project from database: ${project.title} (${id})`);

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
    logger.error('Error in DELETE /api/projects/[id]', error, { 
      action: 'deleteProject',
      projectId: 'unknown'
    });
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}