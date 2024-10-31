import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Video, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { avatarRequestService } from '../services/avatarRequests';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
}

export function AvatarCreation({ onClose }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'select' | 'record' | 'upload'>('select');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [avatarName, setAvatarName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 },
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = URL.createObjectURL(blob);
          videoRef.current.play();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check camera permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && streamRef.current) {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      if (videoRef.current) {
        videoRef.current.src = URL.createObjectURL(file);
      }
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to submit an avatar request');
      return;
    }

    if (!avatarName) {
      toast.error('Please enter a name for your avatar');
      return;
    }

    let videoFile: File | null = null;

    if (recordedBlob) {
      videoFile = new File([recordedBlob], `${avatarName}-recording.webm`, {
        type: 'video/webm'
      });
    } else if (uploadedFile) {
      videoFile = uploadedFile;
    }

    if (!videoFile) {
      toast.error('Please record or upload a video');
      return;
    }

    setIsSubmitting(true);
    try {
      await avatarRequestService.createRequest(user.id, avatarName, videoFile);
      toast.success('Avatar request submitted successfully');
      onClose();
    } catch (error) {
      console.error('Error submitting avatar request:', error);
      toast.error('Failed to submit avatar request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'select':
        return (
          <div className="space-y-4">
            <button
              onClick={() => setMode('record')}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Camera className="h-5 w-5 mr-2" />
              Record Video
            </button>
            <button
              onClick={() => setMode('upload')}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload Video
            </button>
          </div>
        );

      case 'record':
        return (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => {
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                  }
                  setMode('select');
                  setRecordedBlob(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeft className="h-5 w-5 mr-2 inline" />
                Back
              </button>
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Stop Recording
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  disabled={!!recordedBlob}
                >
                  <Video className="h-5 w-5 mr-2 inline" />
                  {recordedBlob ? 'Recording Complete' : 'Start Recording'}
                </button>
              )}
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
            </div>
            <label className="block">
              <span className="sr-only">Choose video file</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
            </label>
            <button
              onClick={() => {
                setMode('select');
                setUploadedFile(null);
                if (videoRef.current) {
                  videoRef.current.src = '';
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-5 w-5 mr-2 inline" />
              Back
            </button>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Request New Avatar</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {renderContent()}

      {(recordedBlob || uploadedFile) && (
        <div className="mt-4 space-y-4">
          <input
            type="text"
            placeholder="Enter avatar name"
            value={avatarName}
            onChange={(e) => setAvatarName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !avatarName}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Submitting Request...' : 'Submit Avatar Request'}
          </button>
        </div>
      )}
    </div>
  );
}