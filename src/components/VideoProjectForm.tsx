import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Upload, Save, X, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
}

export function VideoProjectForm({ onClose }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [script, setScript] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !videoFile) return;

    try {
      setLoading(true);

      // 1. Upload video file
      const fileExt = videoFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-videos')
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-videos')
        .getPublicUrl(filePath);

      // 3. Create project request
      const { error: insertError } = await supabase
        .from('project_requests')
        .insert({
          user_id: user.id,
          name: projectName,
          script: script,
          video_url: publicUrl,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast.success('Project submitted successfully');
      onClose();
    } catch (error) {
      console.error('Error submitting project:', error);
      toast.error('Failed to submit project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Create New Video Project</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="My Video Project"
            required
          />
        </div>

        <div>
          <label htmlFor="script" className="block text-sm font-medium text-gray-700">
            Script
          </label>
          <textarea
            id="script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter your script here..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Upload Video
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label htmlFor="video-upload" className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                  <span>Upload a video</span>
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">MP4, WebM, or MOV up to 100MB</p>
            </div>
          </div>
        </div>

        {previewUrl && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
            <video
              src={previewUrl}
              controls
              className="w-full rounded-lg"
              style={{ maxHeight: '200px' }}
            />
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !videoFile}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Submit Project
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}