import React, { useState, useEffect } from 'react';
import { Save, Variable, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ScriptTemplate, ScriptVariable } from '../types';
import { templateStore } from '../services/templateStore';

const AVAILABLE_VARIABLES: ScriptVariable[] = [
  { name: 'firstName', type: 'contact', field: 'firstName' },
  { name: 'lastName', type: 'contact', field: 'lastName' },
  { name: 'company', type: 'contact', field: 'company' },
];

interface Props {
  avatarId: string;
  templateId?: string;
  onSaved?: () => void;
}

export function ScriptEditor({ avatarId, templateId, onSaved }: Props) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [selectedVariables, setSelectedVariables] = useState<ScriptVariable[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    if (!templateId) return;
    
    try {
      const template = await templateStore.getTemplate(templateId);
      if (template) {
        setName(template.name);
        setContent(template.content);
        setSelectedVariables(template.variables);
      }
    } catch (error) {
      toast.error('Failed to load template');
    }
  };

  const handleAddVariable = (variable: ScriptVariable) => {
    if (!selectedVariables.some(v => v.name === variable.name)) {
      setSelectedVariables([...selectedVariables, variable]);
      setContent(content + ` {{${variable.name}}}`);
    }
  };

  const handleSave = async () => {
    if (!name || !content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name,
        content,
        variables: selectedVariables,
        avatarId
      };

      if (templateId) {
        await templateStore.updateTemplate(templateId, templateData);
      } else {
        await templateStore.createTemplate(templateData);
      }

      toast.success('Script template saved successfully');
      onSaved?.();
    } catch (error) {
      toast.error('Failed to save script template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {templateId ? 'Edit Script Template' : 'Create Script Template'}
      </h2>

      <div className="space-y-6">
        <div>
          <label htmlFor="templateName" className="block text-sm font-medium text-gray-700">
            Template Name
          </label>
          <input
            type="text"
            id="templateName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Welcome Message"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Variables
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {AVAILABLE_VARIABLES.map((variable) => (
              <button
                key={variable.name}
                onClick={() => handleAddVariable(variable)}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Variable className="h-4 w-4 mr-1" />
                {variable.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="script" className="block text-sm font-medium text-gray-700">
            Script Content
          </label>
          <div className="mt-1 relative">
            <textarea
              id="script"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Hello {{firstName}}! Welcome to our platform..."
            />
            {selectedVariables.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                <p className="font-medium">Used variables:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedVariables.map((variable) => (
                    <span key={variable.name} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100">
                      {variable.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <div className="text-sm text-gray-500 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            Variables will be replaced with contact data
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !name || !content}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}