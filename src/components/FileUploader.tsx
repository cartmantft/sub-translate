'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import toast from 'react-hot-toast'; // Import toast

interface FileUploaderProps {
  onUploadSuccess?: (url: string) => void;
}

export default function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first.');
      return;
    }

    setUploading(true);
    const loadingToastId = toast.loading('Uploading file...');

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      // Get public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL for the uploaded file.');
      }

      toast.success('File uploaded successfully!', { id: loadingToastId });
      if (onUploadSuccess) {
        onUploadSuccess(publicUrlData.publicUrl);
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(`Error uploading file: ${error.message}`, { id: loadingToastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg shadow-inner">
      <label
        htmlFor="file-upload"
        className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md"
      >
        Choose Video File
        <input
          id="file-upload"
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {file && (
        <p className="mt-4 text-gray-700">Selected file: <span className="font-medium">{file.name}</span></p>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`mt-6 px-6 py-3 rounded-lg font-semibold transition duration-300 ease-in-out
          ${!file || uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white shadow-md'}`}
      >
        {uploading ? 'Uploading...' : 'Upload Video'}
      </button>
    </div>
  );
}
