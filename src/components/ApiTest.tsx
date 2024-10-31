import React, { useState, useEffect } from 'react';
import { hubspotApi } from '../services/api';
import type { Contact } from '../services/api';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function ApiTest() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const testHubSpotConnection = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const fetchedContacts = await hubspotApi.getContacts();
      setContacts(fetchedContacts);
      setSuccess(true);
      toast.success('Successfully connected to HubSpot');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to HubSpot API';
      setError(errorMessage);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testHubSpotConnection();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">API Connection Test</h2>
        <button
          onClick={testHubSpotConnection}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Test Connection
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-md flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 rounded-md flex items-center text-green-700">
          <CheckCircle className="h-5 w-5 mr-2" />
          Successfully connected to HubSpot API
        </div>
      )}

      {contacts.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Contacts</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.slice(0, 5).map((contact) => (
                  <tr key={contact.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.company || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}