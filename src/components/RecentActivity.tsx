import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { VideoGeneration } from '../types';
import { videoStore } from '../services/videoStore';
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

export function RecentActivity() {
  const [activities, setActivities] = useState<VideoGeneration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivities();
    // Poll for updates every 10 seconds
    const interval = setInterval(loadRecentActivities, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadRecentActivities = async () => {
    try {
      const recentVideos = await videoStore.getRecentVideos(5);
      setActivities(recentVideos);
    } catch (error) {
      console.error('Error loading recent activities:', error);
      toast.error('Failed to load recent activities');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activities</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const StatusIcon = statusIcons[activity.status];
              const statusColor = statusColors[activity.status];
              
              return (
                <div key={activity.contactId + activity.templateId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Video for Contact #{activity.contactId}
                      </p>
                      <p className="text-sm text-gray-500">
                        Template #{activity.templateId}
                      </p>
                      {activity.error && (
                        <p className="text-sm text-red-500 mt-1">
                          Error: {activity.error}
                        </p>
                      )}
                    </div>
                  </div>
                  {activity.status === 'completed' && activity.videoUrl && (
                    <a 
                      href={activity.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      View Video
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}