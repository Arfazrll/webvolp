// src/components/call/CallScreen.tsx - Perbaikan untuk video call

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

  // Memoize setVideoRefs callback untuk mencegah masalah rendering berulang
  const updateVideoRefs = useCallback(() => {
    if (localVideoRef.current && remoteVideoRef.current) {
      console.log('CallScreen: Updating video refs');
      setVideoRefs(localVideoRef.current, remoteVideoRef.current);
    }
  }, [setVideoRefs]);

  // Set video refs saat komponen mount dan refs berubah
  useEffect(() => {
    console.log('CallScreen: Setting up video refs');
    updateVideoRefs();
    
    // Request camera permission early if it's a video call
    if (activeCall?.type === 'video') {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          console.log('Camera and mic permission granted');
          stream.getTracks().forEach(track => track.stop()); // Release devices after check
        })
        .catch(err => {
          console.error('Camera/mic permission denied:', err);
        });
    }
    
    // Update video refs saat video elements berubah
    const localVideo = localVideoRef.current;
    const remoteVideo = remoteVideoRef.current;
    
    return () => {
      // Cleanup video refs saat unmount
      if (localVideo || remoteVideo) {
        console.log('CallScreen: Cleaning up video refs');
        setVideoRefs(null, null);
      }
    };
  }, [updateVideoRefs, setVideoRefs, activeCall?.type]);

  // Jalankan timer selama panggilan aktif
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Mulai timer saat panggilan aktif
    if (activeCall?.status === 'active') {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      // Reset timer saat panggilan tidak aktif
      setCallTimer(0);
    }
    
    // Clean up interval saat komponen unmount atau panggilan berakhir
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall?.status]);

  // Tambahkan video element monitoring
  useEffect(() => {
    const checkVideoElements = () => {
      if (localVideoRef.current) {
        console.log('Local video element properties:', {
          width: localVideoRef.current.videoWidth,
          height: localVideoRef.current.videoHeight,
          hasStream: !!localVideoRef.current.srcObject,
          playing: !localVideoRef.current.paused,
          readyState: localVideoRef.current.readyState
        });
      }
      
      if (remoteVideoRef.current) {
        console.log('Remote video element properties:', {
          width: remoteVideoRef.current.videoWidth,
          height: remoteVideoRef.current.videoHeight, 
          hasStream: !!remoteVideoRef.current.srcObject,
          playing: !remoteVideoRef.current.paused,
          readyState: remoteVideoRef.current.readyState
        });
      }
    };
    
    // Check awal
    checkVideoElements();
    
    // Check berkala
    const monitorInterval = setInterval(checkVideoElements, 5000);
    
    return () => {
      clearInterval(monitorInterval);
    };
  }, [activeCall?.status]);

  // Format waktu dari detik ke mm:ss
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

  // Jika tidak ada panggilan, kembalikan null
  if (!activeCall) return null;

  // Helper untuk mendapatkan teks status
  const getStatusText = () => {
    switch(activeCall.status) {
      case 'calling':
        return 'Memanggil...';
      case 'connecting':
        return 'Menghubungkan...';
      case 'ringing':
        return activeCall.direction === 'incoming' ? 'Panggilan Masuk' : 'Berdering...';
      case 'active':
        return formatTime(callTimer);
      case 'ended':
        return 'Panggilan Berakhir';
      case 'failed':
        return 'Panggilan Gagal';
      default:
        return '';
    }
  };

  // Render tampilan panggilan video
  if (activeCall.type === 'video' && activeCall.status === 'active') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Remote Video (Full screen) */}
        <div className="flex-grow relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            id="remote-video"
            controls={false}
            muted={speakerEnabled ? false : true}
          />
          
          {/* Local Video (Picture-in-picture) */}
          <div className="absolute bottom-4 right-4 w-1/4 md:w-1/5 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              id="local-video"
              controls={false}
            />
          </div>
          
          {/* Call Info - selalu tampilkan di atas video */}
          <div className="absolute top-4 left-0 right-0 text-center text-white bg-black bg-opacity-50 py-2">
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
            className={!videoEnabled ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}
            onClick={handleToggleVideo}
          >
            {!videoEnabled ? <FiVideoOff size={24} /> : <FiVideo size={24} />}
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

  // Render tampilan panggilan audio
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex flex-col items-center space-y-6">
        {/* Info Kontak/Nomor */}
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
        
        {/* Indikator Tipe Panggilan */}
        <div className="bg-secondary-50 py-1 px-3 rounded-full">
          <span className="text-sm text-secondary-600 flex items-center">
            {activeCall.type === 'audio' ? (
              <><FiPhone className="mr-1" /> Panggilan Suara</>
            ) : (
              <><FiVideo className="mr-1" /> Panggilan Video</>
            )}
          </span>
        </div>
        
        {/* Video elements masih dirender tapi hidden, untuk mempersiapkan switch ke video */}
        <div className="hidden">
          <video ref={localVideoRef} id="local-video-hidden" autoPlay playsInline muted />
          <video ref={remoteVideoRef} id="remote-video-hidden" autoPlay playsInline />
        </div>
        
        {/* Kontrol Panggilan */}
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
          
          {/* Tombol Jawab/Tolak untuk panggilan masuk */}
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
          
          {/* Tombol End Call (untuk panggilan aktif, outgoing, atau panggilan sedang berlangsung) */}
          {(activeCall.status === 'active' || 
            (activeCall.status === 'ringing' && activeCall.direction === 'outgoing') || 
            activeCall.status === 'calling' ||
            activeCall.status === 'connecting') && (
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