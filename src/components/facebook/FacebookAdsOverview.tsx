import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, TrendingUp, Users, Loader2, AlertCircle } from 'lucide-react';
import { FacebookAuthButton } from './FacebookAuthButton';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

interface AdAccountMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
}

export function FacebookAdsOverview() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<AdAccountMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkConnection();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;

    try {
      setError(null);
      const { data, error: dbError } = await supabase
        .from('facebook_connections')
        .select('access_token')
        .eq('user_id', user.id)
        .single();

      if (dbError) throw dbError;
      setIsConnected(!!data);
      
      if (data?.access_token) {
        await fetchMetrics(data.access_token);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setError('Failed to check Facebook connection');
      toast.error('Failed to check Facebook connection');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (accessToken: string) => {
    if (!user) return;

    try {
      setError(null);
      const { error: dbError } = await supabase
        .from('facebook_connections')
        .upsert({
          user_id: user.id,
          access_token: accessToken,
          updated_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      setIsConnected(true);
      toast.success('Successfully connected to Facebook Ads');
      await fetchMetrics(accessToken);
    } catch (error) {
      console.error('Error saving connection:', error);
      setError('Failed to save Facebook connection');
      toast.error('Failed to save Facebook connection');
    }
  };

  const fetchMetrics = async (accessToken: string) => {
    try {
      setError(null);
      setRefreshing(true);

      const response = await fetch('/.netlify/functions/facebook-ads-metrics', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch metrics');
      }

      const data = await response.json();

      // Calculate additional metrics
      const metrics: AdAccountMetrics = {
        ...data,
        ctr: data.clicks > 0 ? (data.clicks / data.impressions) * 100 : 0,
        cpc: data.clicks > 0 ? data.spend / data.clicks : 0,
        cpm: data.impressions > 0 ? (data.spend / data.impressions) * 1000 : 0
      };

      setMetrics(metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ad metrics');
      toast.error('Failed to fetch ad metrics');
    } finally {
      setRefreshing(false);
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

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Facebook Ads Integration</h2>
        <p className="text-gray-600 mb-6">
          Connect your Facebook Ads account to view performance metrics and manage your campaigns.
        </p>
        <FacebookAuthButton onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Facebook Ads Overview</h2>
          <button
            onClick={() => checkConnection()}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh Data'
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spend</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${metrics?.spend.toFixed(2) || '0.00'}
                </p>
                {metrics?.cpm && (
                  <p className="text-sm text-gray-500">
                    CPM: ${metrics.cpm.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Impressions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metrics?.impressions.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clicks</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metrics?.clicks.toLocaleString() || '0'}
                </p>
                {metrics?.ctr && (
                  <p className="text-sm text-gray-500">
                    CTR: {metrics.ctr.toFixed(2)}%
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metrics?.conversions.toLocaleString() || '0'}
                </p>
                {metrics?.cpc && (
                  <p className="text-sm text-gray-500">
                    CPC: ${metrics.cpc.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}