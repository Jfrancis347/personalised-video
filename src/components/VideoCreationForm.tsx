import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { avatarRequestService } from '../services/avatarRequests';
import { videoGenerationService } from '../services/videoGenerations';
import { AvatarRequest } from '../types';
import { Loader2, AlertCircle, Check, Variable, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AVAILABLE_FIELDS = [
  { 
    name: 'firstName',
    description: 'Contact\'s first name',
    example: 'John'
  },
  { 
    name: 'lastName',
    description: 'Contact\'s last name',
    example: 'Doe'
  },
  { 
    name: 'email',
    description: 'Contact\'s email address',
    example: 'john.doe@example.com'
  },
  { 
    name: 'company',
    description: 'Contact\'s company name',
    example: 'Acme Corp'
  }
];

interface Props {
  onClose: () => void;
}

export function VideoCreationForm({ onClose }: Props) {
  const { user } = useAuth();
  const [scriptContent, setScriptContent] = useState('');
  const [previewData, setPreviewData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    company: 'Acme Corp'
  });

  const insertVariable = (fieldName: string) => {
    const cursorPosition = (document.getElementById('scriptInput') as HTMLTextAreaElement)?.selectionStart || scriptContent.length;
    const newContent = scriptContent.slice(0, cursorPosition) + 
                      `{{${fieldName}}}` + 
                      scriptContent.slice(cursorPosition);
    setScriptContent(newContent);
  };

  const previewScript = () => {
    let preview = scriptContent;
    Object.entries(previewData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return preview;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to create a template');
      return;
    }

    if (!scriptContent.trim()) {
      toast.error('Please enter a script');
      return;
    }

    try {
      // Save the template
      await videoGenerationService.createTemplate({
        userId: user.id,
        script: scriptContent,
        isActive: true
      });

      toast.success('Video template created successfully');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create template';
      toast.error(message);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Create Video Template</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Contact Fields
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {AVAILABLE_FIELDS.map((field) => (
              <button
                key={field.name}
                type="button"
                onClick={() => insertVariable(field.name)}
                className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                title={`${field.description} (Example: ${field.example})`}
              >
                <Variable className="h-3 w-3 mr-1" />
                {field.name}
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
              <p className="text-sm text-gray-600">{previewScript()}</p>
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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Create Template
          </button>
        </div>
      </form>
    </div>
  );
}