import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { useCall } from '../../lib/hooks/useCall';
import { Call } from '../../app/types';
import { formatPhoneNumber } from '../../lib/utils/formatters';

interface CallScreenProps {
  call?: Call | null;
}

export function CallScreen({ call }: CallScreenProps) {
  const { 
    currentCall, 
    answerCall, 
    rejectCall, 
    endCall,
    toggleAudio,
    toggleVideo,
    toggleSpeaker,
    audioEnabled,
    videoEnabled,
    speakerEnabled,
    setVideoRefs
  } = useCall();
  
  const [callTimer, setCallTimer] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const activeCall = call || currentCall;

  // Memoize setVideoRefs callback to avoid re-rendering issues
  const updateVideoRefs = useCallback(() => {
    setVideoRefs(localVideoRef.current, remoteVideoRef.current);
  }, [setVideoRefs]);

  // Set video refs only once on mount
  useEffect(() => {
    updateVideoRefs();
  }, [updateVideoRefs]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Start timer when call is active
    if (activeCall?.status === 'active') {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      // Reset timer when call is not active
      setCallTimer(0);
    }
    
    // Clean up interval when component unmounts or call ends
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall?.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle handlers
  const handleToggleMute = () => {
    toggleAudio(!audioEnabled);
  };

  const handleToggleVideo = () => {
    toggleVideo(!videoEnabled);
  };

  const handleToggleSpeaker = () => {
    toggleSpeaker(!speakerEnabled);
  };

  // If no call, return empty
  if (!activeCall) return null;

  // Helper to get status text
  const getStatusText = () => {
    switch(activeCall.status) {
      case 'calling':
        return 'Memanggil...';
      case 'ringing':
        return activeCall.direction === 'incoming' ? 'Panggilan Masuk' : 'Berdering...';
      case 'active':
        return formatTime(callTimer);
      case 'ended':
        return 'Panggilan Berakhir';
      default:
        return '';
    }
  };

  // Render video call UI
  if (activeCall.type === 'video' && activeCall.status === 'active' && videoEnabled) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Remote Video (Full screen) */}
        <div className="flex-grow relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local Video (Picture-in-picture) */}
          <div className="absolute bottom-4 right-4 w-1/4 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Call Info */}
          <div className="absolute top-4 left-0 right-0 text-center text-white">
            <h2 className="text-xl font-bold">{formatPhoneNumber(activeCall.phoneNumber)}</h2>
            <p className="text-sm">{getStatusText()}</p>
          </div>
        </div>
        
        {/* Call Controls */}
        <div className="bg-gray-900 p-4 flex justify-center space-x-4">
          <Button
            variant="outline"
            size="icon-lg"
            roundness="full"
            className={!audioEnabled ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}
            onClick={handleToggleMute}
          >
            {!audioEnabled ? <FiMicOff size={24} /> : <FiMic size={24} />}
          </Button>
          
          <Button
            variant="outline"
            size="icon-lg"
            roundness="full"
            className="bg-gray-800 text-white"
            onClick={handleToggleVideo}
          >
            <FiVideoOff size={24} />
          </Button>
          
          <Button
            variant="outline"
            size="icon-lg"
            roundness="full"
            className={speakerEnabled ? 'bg-primary-500 text-white' : 'bg-gray-800 text-white'}
            onClick={handleToggleSpeaker}
          >
            {speakerEnabled ? <FiVolume2 size={24} /> : <FiVolumeX size={24} />}
          </Button>
          
          <Button
            variant="destructive"
            size="icon-xl"
            roundness="full"
            onClick={() => endCall()}
          >
            <FiPhoneOff size={32} />
          </Button>
        </div>
      </div>
    );
  }

  // Render regular audio call UI
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex flex-col items-center space-y-6">
        {/* Contact/Number Info */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-1">{formatPhoneNumber(activeCall.phoneNumber)}</h2>
          <p className="text-primary-600 font-medium">{getStatusText()}</p>
        </div>
        
        {/* Avatar/Video Placeholder */}
        <div className="h-40 w-40 rounded-full flex items-center justify-center bg-secondary-100">
          <div className="text-4xl font-bold text-secondary-400">
            {activeCall.phoneNumber.slice(0, 2).toUpperCase()}
          </div>
        </div>
        
        {/* Call Type Indicator */}
        <div className="bg-secondary-50 py-1 px-3 rounded-full">
          <span className="text-sm text-secondary-600 flex items-center">
            {activeCall.type === 'audio' ? (
              <><FiPhone className="mr-1" /> Panggilan Suara</>
            ) : (
              <><FiVideo className="mr-1" /> Panggilan Video</>
            )}
          </span>
        </div>
        
        {/* Call Controls */}
        <div className="flex flex-wrap justify-center gap-4">
          {activeCall.status === 'active' && (
            <>
              <Button
                variant="outline"
                size="icon-lg"
                roundness="full"
                className={!audioEnabled ? 'bg-secondary-200' : ''}
                onClick={handleToggleMute}
              >
                {!audioEnabled ? <FiMicOff size={24} /> : <FiMic size={24} />}
              </Button>
              
              {activeCall.type === 'video' && (
                <Button
                  variant="outline"
                  size="icon-lg"
                  roundness="full"
                  className={!videoEnabled ? 'bg-secondary-200' : ''}
                  onClick={handleToggleVideo}
                >
                  {!videoEnabled ? <FiVideoOff size={24} /> : <FiVideo size={24} />}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="icon-lg"
                roundness="full"
                className={speakerEnabled ? 'bg-secondary-200' : ''}
                onClick={handleToggleSpeaker}
              >
                {speakerEnabled ? <FiVolume2 size={24} /> : <FiVolumeX size={24} />}
              </Button>
            </>
          )}
          
          {/* Answer/Reject for incoming calls */}
          {activeCall.direction === 'incoming' && activeCall.status === 'ringing' && (
            <>
              <Button
                variant="default"
                size="icon-xl"
                roundness="full"
                className="bg-green-500 hover:bg-green-600"
                onClick={() => answerCall()}
              >
                <FiPhone size={32} />
              </Button>
              
              <Button
                variant="destructive"
                size="icon-xl"
                roundness="full"
                onClick={() => rejectCall()}
              >
                <FiPhoneOff size={32} />
              </Button>
            </>
          )}
          
          {/* End Call button (for active, calling or outgoing ringing) */}
          {(activeCall.status === 'active' || 
            (activeCall.status === 'ringing' && activeCall.direction === 'outgoing') || 
            activeCall.status === 'calling') && (
            <Button
              variant="destructive"
              size="icon-xl"
              roundness="full"
              onClick={() => endCall()}
            >
              <FiPhoneOff size={32} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}