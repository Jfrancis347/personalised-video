import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { Campaign } from '../../types';
import { CampaignDetails } from './CampaignDetails';
import { Loader2, AlertCircle, Play, Calendar, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export function CampaignList() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: approvedTemplates, error: templateError } = await supabase
        .from('template_requests')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .not('heygen_template_id', 'is', null)
        .order('created_at', { ascending: false });

      if (templateError) throw templateError;

      const activeCampaigns = (approvedTemplates || []).map(template => ({
        id: template.id,
        userId: template.user_id,
        name: template.name,
        avatarId: template.avatar_id,
        script: template.script,
        isActive: true,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
        heygenTemplateId: template.heygen_template_id,
        emailsSent: 0,
        thumbnail: `https://images.unsplash.com/photo-1516387938699-a93567ec168e?auto=format&fit=crop&w=400&q=80`
      }));

      setCampaigns(activeCampaigns);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      const message = err instanceof Error ? err.message : 'Failed to load campaigns';
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

  if (selectedCampaign) {
    return (
      <CampaignDetails
        campaign={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
      />
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">No Active Campaigns</h2>
          <p className="text-gray-500">
            Create and get a video template approved to start your first campaign.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCampaign(campaign)}
            >
              <div className="aspect-video bg-gray-100 relative group">
                {campaign.thumbnail && (
                  <img
                    src={campaign.thumbnail}
                    alt={campaign.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {campaign.name}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {campaign.emailsSent || 0} Sent
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}