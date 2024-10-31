import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Variable, X, Save, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
}

export function ProjectRequestForm({ onClose }: Props) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('');
  const [approvedAvatars, setApprovedAvatars] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApprovedAvatars();
  }, []);

  const loadApprovedAvatars = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('avatar_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .not('heygen_avatar_id', 'is', null);

      if (error) throw error;

      setApprovedAvatars(data.map(avatar => ({
        id: avatar.id,
        userId: avatar.user_id,
        name: avatar.name,
        status: avatar.status,
        videoUrl: avatar.video_url,
        heygenAvatarId: avatar.heygen_avatar_id,
        createdAt: avatar.created_at,
        updatedAt: avatar.updated_at
      })));
    } catch (err) {
      console.error('Error loading avatars:', err);
      const message = err instanceof Error ? err.message : 'Failed to load avatars';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to create a project');
      return;
    }

    if (!selectedAvatarId) {
      toast.error('Please select an avatar');
      return;
    }

    if (!projectName.trim() || !scriptContent.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('project_requests')
        .insert({
          user_id: user.id,
          name: projectName,
          avatar_id: selectedAvatarId,
          script: scriptContent,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Project request submitted successfully');
      onClose();
    } catch (err) {
      console.error('Error submitting project:', err);
      const message = err instanceof Error ? err.message : 'Failed to submit project';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  if (approvedAvatars.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">No Approved Avatars</h2>
          <p className="text-gray-600 mb-6">
            You need at least one approved avatar to create a project. Please request an avatar first.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label htmlFor="avatarSelect" className="block text-sm font-medium text-gray-700 mb-2">
            Select Avatar
          </label>
          <select
            id="avatarSelect"
            value={selectedAvatarId}
            onChange={(e) => setSelectedAvatarId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="">Choose an avatar</option>
            {approvedAvatars.map((avatar) => (
              <option key={avatar.id} value={avatar.heygenAvatarId}>
                {avatar.name}
              </option>
            ))}
          </select>
        </div>

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
            placeholder="e.g., Welcome Message"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Variables
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {['firstName', 'lastName', 'email', 'company'].map((variable) => (
              <button
                key={variable}
                type="button"
                onClick={() => setScriptContent(prev => `${prev}{{${variable}}}`)}
                className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Variable className="h-3 w-3 mr-1" />
                {variable}
              </button>
            ))}
          </div>

          <textarea
            id="scriptInput"
            value={scriptContent}
            onChange={(e) => setScriptContent(e.target.value)}
            rows={6}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter your script here. Use variables like {{firstName}} to personalize the message."
            required
          />

          {scriptContent && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview with sample data:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {scriptContent
                  .replace(/{{firstName}}/g, 'John')
                  .replace(/{{lastName}}/g, 'Doe')
                  .replace(/{{email}}/g, 'john.doe@example.com')
                  .replace(/{{company}}/g, 'Acme Corp')}
              </p>
            </div>
          )}
        </div>

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
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Project
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}