import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { VideoTemplate } from '../types';
import { Loader2, AlertCircle, Settings, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export function VideoTemplatesList() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  const loadTemplates = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('video_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(data?.map(template => ({
        id: template.id,
        userId: template.user_id,
        name: template.name,
        avatarId: template.avatar_id,
        script: template.script,
        isActive: template.is_active,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      })) || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      const message = err instanceof Error ? err.message : 'Failed to load templates';
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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Video Templates</h2>
        
        {templates.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No video templates found. Create one to get started!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {template.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {/* TODO: Add preview functionality */}}
                        className="p-2 text-gray-400 hover:text-gray-500"
                      >
                        <Play className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {/* TODO: Add edit functionality */}}
                        className="p-2 text-gray-400 hover:text-gray-500"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-600 line-clamp-3">
                      {template.script}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}