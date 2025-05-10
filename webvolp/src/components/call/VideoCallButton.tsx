// src/components/call/VideoCallButton.tsx (Perbaikan)

import React, { useState } from 'react';
import { FiVideo } from 'react-icons/fi';
import { Button } from '../ui/Button';
import { VideoChatGuide } from './VideoChatGuide';
import { useCall } from '../../lib/hooks/useCall';

interface VideoCallButtonProps {
  variant?: 'default' | 'outline' | 'text';
  phoneNumber?: string;
  className?: string;
}

export function VideoCallButton({ 
  variant = 'default', 
  phoneNumber,
  className
}: VideoCallButtonProps) {
  const [showGuide, setShowGuide] = useState(false);
  const { makeCall } = useCall();

  const handleOpenGuide = () => {
    setShowGuide(true);
  };

  const handleCloseGuide = () => {
    setShowGuide(false);
  };

  // Definisikan fungsi untuk menangani permulaan panggilan video
  const handleStartVideoCall = (number: string) => {
    const targetNumber = phoneNumber || number;
    if (targetNumber) {
      makeCall(targetNumber, 'video');
    }
  };

  return (
    <>
      {variant === 'default' && (
        <Button
          onClick={handleOpenGuide}
          className={className}
        >
          <FiVideo className="mr-2" /> Mulai Video Call
        </Button>
      )}
      
      {variant === 'outline' && (
        <Button
          variant="outline"
          onClick={handleOpenGuide}
          className={className}
        >
          <FiVideo className="mr-2" /> Video Call
        </Button>
      )}
      
      {variant === 'text' && (
        <button
          onClick={handleOpenGuide}
          className={`flex items-center text-primary-600 hover:text-primary-800 ${className || ''}`}
        >
          <FiVideo className="mr-1" /> <span>Video Call</span>
        </button>
      )}
      
      {/* Gunakan prop onStartVideoCall dengan benar */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <VideoChatGuide 
            onClose={handleCloseGuide}
            onStartVideoCall={handleStartVideoCall}
          />
        </div>
      )}
    </>
  );
}