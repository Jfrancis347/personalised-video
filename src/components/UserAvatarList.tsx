import React, { useState, useEffect } from 'react';
import { avatarRequestService } from '../services/avatarRequests';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle, Video, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const statusIcons = {
  completed: CheckCircle,
  processing: Clock,
  failed: XCircle,
  pending: Clock,
};

const statusColors = {
  completed: 'text-green-500',
  processing: 'text-blue-500',
  failed: 'text-red-500',
  pending: 'text-yellow-500',
};

export function UserAvatarList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserRequests();
    }
  }, [user]);

  const loadUserRequests = async () => {
    try {
      setLoading(true);
      const userRequests = await avatarRequestService.getUserRequests(user.id);
      setRequests(userRequests);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load your avatar requests';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
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

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No avatar requests found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Avatars</h2>
        <div className="space-y-4">
          {requests.map((request) => {
            const StatusIcon = statusIcons[request.status];
            const statusColor = statusColors[request.status];

            return (
              <div
                key={request.id}
                className="border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{request.name}</h3>
                    <div className="mt-1 flex items-center">
                      <StatusIcon className={`h-4 w-4 mr-2 ${statusColor}`} />
                      <span className={`text-sm ${statusColor}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {request.status === 'completed' && request.videoUrl && (
                  <div className="mt-4">
                    <a
                      href={request.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      View Video
                    </a>
                  </div>
                )}

                {request.status === 'failed' && (
                  <p className="mt-2 text-sm text-red-600">
                    Failed to create avatar. Please try again or contact support.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}