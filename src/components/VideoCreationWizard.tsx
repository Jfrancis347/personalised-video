import React, { useState } from 'react';
import { AvatarList } from './AvatarList';
import { ScriptEditor } from './ScriptEditor';
import { ChevronRight, ChevronLeft } from 'lucide-react';

type Step = 'avatar' | 'script' | 'preview';

export function VideoCreationWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('avatar');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [scriptTemplateId, setScriptTemplateId] = useState<string | null>(null);

  const steps: Step[] = ['avatar', 'script', 'preview'];

  const goToNextStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'avatar':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Select an avatar to use for your video:</p>
            <AvatarList onSelect={setSelectedAvatarId} selectedId={selectedAvatarId} />
          </div>
        );

      case 'script':
        return (
          <div className="space-y-4">
            <ScriptEditor 
              avatarId={selectedAvatarId!} 
              templateId={scriptTemplateId}
              onSaved={(id) => {
                setScriptTemplateId(id);
                goToNextStep();
              }}
            />
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Preview your video:</p>
            {/* Preview component will be added later */}
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              Preview functionality coming soon
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, index) => (
                <li key={step} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                  <div className="flex items-center">
                    <div
                      className={`${
                        steps.indexOf(currentStep) >= index
                          ? 'bg-indigo-600'
                          : 'bg-gray-200'
                      } h-8 w-8 rounded-full flex items-center justify-center`}
                    >
                      <span className="text-white text-sm">{index + 1}</span>
                    </div>
                    {index !== steps.length - 1 && (
                      <div className="hidden sm:block absolute top-4 left-8 -ml-px w-screen max-w-[8rem] h-0.5 bg-gray-200">
                        <div
                          className="h-0.5 bg-indigo-600 transition-all"
                          style={{
                            width: steps.indexOf(currentStep) > index ? '100%' : '0%',
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="absolute top-10 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-500">
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {renderStepContent()}

        <div className="mt-8 flex justify-between">
          {currentStep !== 'avatar' && (
            <button
              onClick={goToPreviousStep}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </button>
          )}
          {currentStep !== 'preview' && (
            <button
              onClick={goToNextStep}
              disabled={currentStep === 'avatar' && !selectedAvatarId}
              className="ml-auto inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}