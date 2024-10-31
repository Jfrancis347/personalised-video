import React, { useState, useEffect } from 'react';
import { heygenApi } from '../services/heygen';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Avatar {
  id: string;
  name: string;
  status: string;
  thumbnail_url?: string;
  created_at: string;
}

interface Props {
  onSelect?: (avatarId: string) => void;
  selectedId?: string | null;
}

export function AvatarList({ onSelect, selectedId }: Props) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAvatars = await heygenApi.listAvatars();
      console.log('Fetched avatars:', fetchedAvatars);
      setAvatars(fetchedAvatars);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load avatars';
      console.error('Error loading avatars:', err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
          <button
            onClick={loadAvatars}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (avatars.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No avatars found. Please request a new avatar to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {avatars.map((avatar) => (
        <div
          key={avatar.id}
          className={`bg-white rounded-lg shadow overflow-hidden cursor-pointer transition-transform hover:scale-105 ${
            selectedId === avatar.id ? 'ring-2 ring-indigo-500' : ''
          }`}
          onClick={() => onSelect?.(avatar.id)}
        >
          {avatar.thumbnail_url ? (
            <img
              src={avatar.thumbnail_url}
              alt={avatar.name}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No thumbnail</span>
            </div>
          )}
          <div className="p-4">
            <h3 className="font-medium text-gray-900">{avatar.name}</h3>
            <div className="mt-2 flex items-center">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  avatar.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : avatar.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {avatar.status}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                Created: {new Date(avatar.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}