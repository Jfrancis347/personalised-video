import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { templateRequestService } from '../services/templateRequests';
import { TemplateRequest } from '../types';
import { Loader2, AlertCircle, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

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

export function TemplateRequestsList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TemplateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userRequests = await templateRequestService.getUserRequests(user.id);
      setRequests(userRequests);
    } catch (err) {
      console.error('Error loading requests:', err);
      const message = err instanceof Error ? err.message : 'Failed to load template requests';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Template Requests</h2>
        
        {requests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No template requests found. Create one to get started!
          </p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const StatusIcon = statusIcons[request.status];
              const statusColor = statusColors[request.status];
              const isExpanded = expandedId === request.id;
              
              return (
                <div
                  key={request.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleExpand(request.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {request.name}
                        </h3>
                        <div className="mt-1 flex items-center space-x-2">
                          <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                          <span className={`text-sm ${statusColor}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            • {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t">
                      <div className="mt-4 prose prose-sm max-w-none">
                        <h4 className="text-sm font-medium text-gray-900">Script:</h4>
                        <p className="text-gray-600 whitespace-pre-wrap mt-2">
                          {request.script}
                        </p>
                      </div>

                      {request.error && (
                        <div className="mt-4 p-3 bg-red-50 rounded-md">
                          <p className="text-sm text-red-600">{request.error}</p>
                        </div>
                      )}

                      {request.status === 'completed' && request.heygenTemplateId && (
                        <div className="mt-4 p-3 bg-green-50 rounded-md">
                          <p className="text-sm text-green-600">
                            Template ID: {request.heygenTemplateId}
                          </p>
                        </div>
                      )}
                    </div>
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