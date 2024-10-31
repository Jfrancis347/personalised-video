import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { heygenApi } from '../../services/heygen';
import { Campaign } from '../../types';
import { Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  campaign: Campaign;
  onSuccess?: () => void;
}

interface TestContact {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
}

export function GenerateVideoForm({ campaign, onSuccess }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<TestContact>({
    firstName: '',
    lastName: '',
    email: '',
    company: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !campaign.heygenTemplateId) return;

    try {
      setLoading(true);

      // Replace variables in script
      let personalizedScript = campaign.script;
      Object.entries(contact).forEach(([key, value]) => {
        personalizedScript = personalizedScript.replace(
          new RegExp(`{{${key}}}`, 'g'),
          value || ''
        );
      });

      // Create video project in HeyGen
      const videoProject = await heygenApi.createVideoProject(
        campaign.avatarId,
        personalizedScript,
        contact
      );

      // Create video generation record
      const { error: dbError } = await supabase
        .from('video_generations')
        .insert({
          template_id: campaign.id,
          contact_id: `test_${Date.now()}`,
          status: 'pending',
          metadata: {
            contact,
            heygen_project_id: videoProject.id,
            personalized_script: personalizedScript,
            template: {
              id: campaign.id,
              name: campaign.name,
              heygen_template_id: campaign.heygenTemplateId
            }
          }
        });

      if (dbError) throw dbError;

      toast.success('Video generation started');
      onSuccess?.();

      // Reset form
      setContact({
        firstName: '',
        lastName: '',
        email: '',
        company: ''
      });
    } catch (err) {
      console.error('Error generating video:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate video';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
            disabled={loading}
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