// src/components/call/VideoChatGuide.tsx (File baru)

import React, { useState, useEffect } from 'react';
import { FiVideo, FiMic, FiWifi, FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface DeviceStatus {
  camera: boolean | null;
  microphone: boolean | null;
  network: boolean | null;
}

export function VideoChatGuide({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<DeviceStatus>({
    camera: null,
    microphone: null,
    network: null
  });
  const [checking, setChecking] = useState(false);
  
  // Check device compatibility
  useEffect(() => {
    // Check if getUserMedia is supported
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    // Check if WebRTC is supported
    const hasRTCPeerConnection = !!window.RTCPeerConnection;
    
    // Basic network check
    const isOnline = navigator.onLine;
    
    // Update network status
    setStatus(prev => ({
      ...prev,
      network: hasMediaDevices && hasRTCPeerConnection && isOnline
    }));
  }, []);
  
  const checkDevices = async () => {
    setChecking(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      // Check if we got both audio and video tracks
      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;
      
      setStatus({
        camera: hasVideo,
        microphone: hasAudio,
        network: status.network
      });
      
      // Stop tracks
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error checking devices:', error);
      
      // Try to determine which permission was denied
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('video')) {
          setStatus(prev => ({ ...prev, camera: false }));
        }
        
        if (errorMessage.includes('audio') || errorMessage.includes('microphone')) {
          setStatus(prev => ({ ...prev, microphone: false }));
        }
      } else {
        // Generic error
        setStatus(prev => ({ 
          ...prev, 
          camera: false,
          microphone: false
        }));
      }
    } finally {
      setChecking(false);
    }
  };
  
  const getStatusIcon = (isAvailable: boolean | null) => {
    if (isAvailable === null) return <FiAlertTriangle className="text-yellow-500" />;
    return isAvailable ? <FiCheck className="text-green-500" /> : <FiX className="text-red-500" />;
  };
  
  const canUseVideoChat = status.camera && status.microphone && status.network;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">Panduan Panggilan Video</h2>
        <p className="text-secondary-600 mt-2">
          Pastikan perangkat Anda siap untuk panggilan video
        </p>
      </div>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-md">
          <div className="flex items-center">
            <FiVideo className="mr-3 text-primary-600" />
            <span>Kamera</span>
          </div>
          {getStatusIcon(status.camera)}
        </div>
        
        <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-md">
          <div className="flex items-center">
            <FiMic className="mr-3 text-primary-600" />
            <span>Mikrofon</span>
          </div>
          {getStatusIcon(status.microphone)}
        </div>
        
        <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-md">
          <div className="flex items-center">
            <FiWifi className="mr-3 text-primary-600" />
            <span>Koneksi Internet</span>
          </div>
          {getStatusIcon(status.network)}
        </div>
      </div>
      
      <div className="space-y-4">
        {!canUseVideoChat && status.camera !== null && (
          <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
            <p>
              {!status.camera && 'Kamera tidak tersedia atau izin ditolak. '}
              {!status.microphone && 'Mikrofon tidak tersedia atau izin ditolak. '}
              {!status.network && 'Koneksi internet atau dukungan WebRTC bermasalah. '}
              Silakan periksa pengaturan browser Anda.
            </p>
          </div>
        )}
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={checkDevices}
            disabled={checking}
          >
            {checking ? 'Memeriksa...' : 'Periksa Perangkat'}
          </Button>
          
          <Button onClick={onClose}>
            {canUseVideoChat ? 'Mulai Panggilan Video' : 'Tutup'}
          </Button>
        </div>
      </div>
    </div>
  );
}