import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { heygenApi } from '../services/heygen';
import { Loader2, AlertCircle, Video, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  projectId: string;
}

interface VideoGeneration {
  id: string;
  contact_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  error?: string;
  metadata: {
    contact: {
      firstName: string;
      lastName: string;
      email: string;
      company?: string;
    };
    heygen_video_id?: string;
  };
  created_at: string;
}

const statusIcons = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle,
  failed: XCircle
};

const statusColors = {
  pending: 'text-yellow-500',
  processing: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500'
};

export function VideoGenerationsList({ projectId }: Props) {
  const [generations, setGenerations] = useState<VideoGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGenerations();
    // Poll for updates every 10 seconds
    const interval = setInterval(updateVideoStatuses, 10000);
    return () => clearInterval(interval);
  }, [projectId]);

  const loadGenerations = async () => {
    try {
      setError(null);
      const { data, error: dbError } = await supabase
        .from('video_generations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      setGenerations(data || []);
    } catch (err) {
      console.error('Error loading video generations:', err);
      const message = err instanceof Error ? err.message : 'Failed to load video generations';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateVideoStatuses = async () => {
    try {
      const pendingGenerations = generations.filter(
        gen => gen.status !== 'completed' && gen.status !== 'failed' && gen.metadata?.heygen_video_id
      );

      for (const generation of pendingGenerations) {
        const videoId = generation.metadata.heygen_video_id;
        if (!videoId) continue;

        const status = await heygenApi.getVideoStatus(videoId);

        if (status.status !== generation.status || status.video_url !== generation.video_url) {
          const { error } = await supabase
            .from('video_generations')
            .update({
              status: status.status,
              video_url: status.video_url,
              error: status.error,
              updated_at: new Date().toISOString()
            })
            .eq('id', generation.id);

          if (error) throw error;
        }
      }

      // Reload generations to get updated statuses
      await loadGenerations();
    } catch (err) {
      console.error('Error updating video statuses:', err);
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
      <div className="p-4 bg-red-50 rounded-lg flex items-center">
        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">
        No videos have been generated yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {generations.map((generation) => {
            const StatusIcon = statusIcons[generation.status];
            const statusColor = statusColors[generation.status];
            const contact = generation.metadata?.contact;

            return (
              <tr key={generation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {contact?.email}
                  </div>
                  {contact?.company && (
                    <div className="text-sm text-gray-500">
                      {contact.company}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center ${statusColor}`}>
                    <StatusIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm capitalize">{generation.status}</span>
                  </div>
                  {generation.error && (
                    <div className="text-sm text-red-500 mt-1">
                      {generation.error}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(generation.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {generation.status === 'completed' && generation.video_url && (
                    <a
                      href={generation.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                    >
                      <Video className="h-4 w-4 mr-1" />
                      View
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}