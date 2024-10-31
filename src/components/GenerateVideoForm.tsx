import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { heygenApi } from '../services/heygen';
import { Project } from '../types';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  project: Project;
  onSuccess?: () => void;
}

interface TestContact {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
}

export function GenerateVideoForm({ project, onSuccess }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [contact, setContact] = useState<TestContact>({
    firstName: '',
    lastName: '',
    email: '',
    company: ''
  });

  useEffect(() => {
    if (!import.meta.env.DEV) {
      validateApiKey();
    } else {
      setApiKeyValid(true);
    }
  }, []);

  const validateApiKey = async () => {
    try {
      const isValid = await heygenApi.validateApiKey();
      setApiKeyValid(isValid);
      if (!isValid) {
        setApiError('HeyGen API key is invalid or not configured properly');
        toast.error('HeyGen API key validation failed');
      }
    } catch (error) {
      console.error('Error validating API key:', error);
      setApiKeyValid(false);
      setApiError('Failed to validate HeyGen API key');
      toast.error('Failed to validate HeyGen API key');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project.avatarId) {
      toast.error('Missing required project information');
      return;
    }

    if (!apiKeyValid && !import.meta.env.DEV) {
      toast.error('Cannot generate video: Invalid API configuration');
      return;
    }

    try {
      setLoading(true);

      let personalizedScript = project.script;
      Object.entries(contact).forEach(([key, value]) => {
        personalizedScript = personalizedScript.replace(
          new RegExp(`{{${key}}}`, 'g'),
          value || ''
        );
      });

      const videoResponse = await heygenApi.createVideoInProject(
        project.avatarId,
        personalizedScript,
        contact
      );

      const { error: dbError } = await supabase
        .from('video_generations')
        .insert({
          project_id: project.id,
          contact_id: `test_${Date.now()}`,
          status: 'pending',
          metadata: {
            contact,
            heygen_video_id: videoResponse.id,
            personalized_script: personalizedScript,
            project: {
              id: project.id,
              name: project.name,
              avatar_id: project.avatarId
            }
          }
        });

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      toast.success('Video generation started successfully');
      onSuccess?.();

      setContact({
        firstName: '',
        lastName: '',
        email: '',
        company: ''
      });
    } catch (err) {
      console.error('Error generating video:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (apiKeyValid === false && !import.meta.env.DEV) {
    return (
      <div className="bg-red-50 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-sm text-red-700">
            {apiError || 'HeyGen API is not properly configured. Please check your API key.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Test Video</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={contact.firstName}
              onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={contact.lastName}
              onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              Company
            </label>
            <input
              type="text"
              id="company"
              value={contact.company}
              onChange={(e) => setContact({ ...contact, company: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || (apiKeyValid === false && !import.meta.env.DEV)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Generate Video
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}