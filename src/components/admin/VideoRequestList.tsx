import React, { useState, useEffect } from 'react';
import { videoGenerationService } from '../../services/videoGenerations';
import { VideoGeneration } from '../../types';
import { Loader2, AlertCircle, CheckCircle, XCircle, Video } from 'lucide-react';
import toast from 'react-hot-toast';

export function VideoRequestList() {
  const [requests, setRequests] = useState<VideoGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('video_generations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data.map(record => ({
        id: record.id,
        userId: record.user_id,
        avatarId: record.avatar_id,
        contactId: record.contact_id,
        templateId: record.template_id,
        status: record.status,
        videoUrl: record.video_url,
        error: record.error,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      })));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load video requests';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: VideoGeneration['status']) => {
    try {
      const updates: Partial<VideoGeneration> = {
        status,
        videoUrl: status === 'completed' ? videoUrl : undefined,
      };

      await videoGenerationService.updateVideoRequest(requestId, updates);
      toast.success(`Request ${status} successfully`);
      setVideoUrl('');
      await loadRequests();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update request status';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Video Requests</h2>
        
        {requests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No video requests found</p>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Video Request #{request.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-medium ${
                      request.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : request.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {request.status}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  {request.videoUrl && (
                    <a
                      href={request.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      View Video
                    </a>
                  )}
                  
                  {request.status === 'pending' && (
                    <button
                      onClick={() => updateRequestStatus(request.id, 'processing')}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Start Processing
                    </button>
                  )}

                  {request.status === 'processing' && (
                    <div className="flex space-x-4">
                      <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="Video URL"
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        onClick={() => updateRequestStatus(request.id, 'completed')}
                        disabled={!videoUrl}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </button>
                      <button
                        onClick={() => updateRequestStatus(request.id, 'failed')}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Mark Failed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}