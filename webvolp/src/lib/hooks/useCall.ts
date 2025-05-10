import { useEffect, useState } from 'react';
import { useCallStore } from '../../app/store/callStore';
import { useAuthStore } from '../../app/store/authStore';
import { kamailioService } from '../../lib/api/kamailioService';
import { CallType, CallStatus, CallDirection } from '../../app/types';

export function useCall() {
  const { user } = useAuthStore();
  const {
    currentCall,
    callHistory,
    isDialPadOpen,
    makeCall: storeStartCall,
    endCall: storeEndCall,
    answerCall: storeAnswerCall,
    rejectCall: storeRejectCall,
    toggleDialPad,
    updateCallStatus
  } = useCallStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(false);

  // Initialize Kamailio service when user is available
  useEffect(() => {
    if (user && !isInitialized) {
      // Setup Kamailio with user credentials
      kamailioService.initialize(
        { 
          phoneNumber: user.phoneNumber, 
          password: 'password' // In a real app, this would be securely stored
        },
        // Status callback
        (status) => {
          updateCallStatus(status as CallStatus);
        },
        // Incoming call callback
        (phoneNumber, type) => {
          // Create a new incoming call in the store
          const newCall = {
            id: Date.now().toString(),
            type,
            phoneNumber,
            direction: 'incoming' as CallDirection,
            status: 'ringing' as CallStatus,
            startTime: new Date()
          };
          
          useCallStore.setState({ 
            currentCall: newCall,
            callHistory: [newCall, ...callHistory]
          });
        }
      );
      
      setIsInitialized(true);
    }
    
    // Cleanup on unmount
    return () => {
      if (isInitialized) {
        kamailioService.shutdown();
      }
    };
  }, [user, isInitialized, callHistory, updateCallStatus]);

  // Enhanced call methods that use both store and Kamailio service
  const makeCall = (phoneNumber: string, type: CallType = 'audio') => {
    storeStartCall(phoneNumber, type);
    
    if (isInitialized) {
      try {
        kamailioService.makeCall(phoneNumber, type);
      } catch (error) {
        console.error('Failed to make call:', error);
        // Update status to failed
        updateCallStatus('ended');
      }
    }
  };

  const answerCall = () => {
    storeAnswerCall();
    
    if (isInitialized && currentCall) {
      try {
        kamailioService.answerCall(currentCall.type);
      } catch (error) {
        console.error('Failed to answer call:', error);
        updateCallStatus('ended');
      }
    }
  };

  const endCall = () => {
    storeEndCall();
    
    if (isInitialized) {
      try {
        kamailioService.endCall();
      } catch (error) {
        console.error('Failed to end call:', error);
      }
    }
  };

  const rejectCall = () => {
    storeRejectCall();
    
    if (isInitialized) {
      try {
        kamailioService.endCall();
      } catch (error) {
        console.error('Failed to reject call:', error);
      }
    }
  };

  // Media control functions
  const toggleAudio = (enabled: boolean) => {
    setAudioEnabled(enabled);
    if (isInitialized) {
      kamailioService.toggleAudio(enabled);
    }
  };

  const toggleVideo = (enabled: boolean) => {
    setVideoEnabled(enabled);
    if (isInitialized) {
      kamailioService.toggleVideo(enabled);
    }
  };

  const toggleSpeaker = (enabled: boolean) => {
    setSpeakerEnabled(enabled);
    if (isInitialized) {
      kamailioService.toggleSpeaker(enabled);
    }
  };

  // Function to set video elements
  const setVideoRefs = (localVideo: HTMLVideoElement | null, remoteVideo: HTMLVideoElement | null) => {
    if (isInitialized) {
      kamailioService.setVideoElements(localVideo, remoteVideo);
    }
  };

  return {
    currentCall,
    callHistory,
    isDialPadOpen,
    makeCall,
    endCall,
    answerCall,
    rejectCall,
    toggleDialPad,
    // Media controls
    audioEnabled,
    videoEnabled,
    speakerEnabled,
    toggleAudio,
    toggleVideo,
    toggleSpeaker,
    // Video refs
    setVideoRefs
  };
}