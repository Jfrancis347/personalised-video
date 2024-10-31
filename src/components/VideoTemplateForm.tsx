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

  // ... rest of the component implementation remains the same,
  // just update terminology in UI text and comments ...

  return (
    <div className="bg-white rounded-lg">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Rest of the JSX remains the same, just update terminology in labels and text */}
    </div>
  );
}