import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { AvatarRequest } from '../../services/avatarRequests';
import { Loader2, AlertCircle, CheckCircle, XCircle, Video } from 'lucide-react';
import toast from 'react-hot-toast';

export function AvatarRequestList() {
  const [requests, setRequests] = useState<AvatarRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heygenAvatarId, setHeygenAvatarId] = useState<string>('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('avatar_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data?.map(request => ({
        id: request.id,
        userId: request.user_id,
        status: request.status,
        name: request.name,
        videoUrl: request.video_url,
        heygenAvatarId: request.heygen_avatar_id,
        createdAt: request.created_at,
        updatedAt: request.updated_at
      })) || []);
    } catch (err) {
      console.error('Error loading avatar requests:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load avatar requests';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: AvatarRequest['status']) => {
    try {
      const updates: Record<string, any> = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed' && heygenAvatarId) {
        updates.heygen_avatar_id = heygenAvatarId;
      }

      const { error } = await supabase
        .from('avatar_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      toast.success(`Request ${status} successfully`);
      setHeygenAvatarId('');
      await loadRequests();
    } catch (err) {
      console.error('Error updating request:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update request status';
      toast.error(errorMessage);
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
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Avatar Requests</h2>
        
        {requests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No avatar requests found</p>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{request.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Requested: {new Date(request.createdAt).toLocaleDateString()}
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
                        value={heygenAvatarId}
                        onChange={(e) => setHeygenAvatarId(e.target.value)}
                        placeholder="HeyGen Avatar ID"
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        onClick={() => updateRequestStatus(request.id, 'completed')}
                        disabled={!heygenAvatarId}
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