// src/components/call/VideoChatGuide.tsx

import React, { useState, useEffect } from 'react';
import { FiVideo, FiMic, FiWifi, FiCheck, FiX, FiAlertTriangle, FiCloudLightning } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface DeviceStatus {
  camera: boolean | null;
  microphone: boolean | null;
  network: boolean | null;
  webrtc: boolean | null;
}

interface VideoChatGuideProps {
  onClose: () => void;
  onStartVideoCall?: (phoneNumber: string) => void;
}

export function VideoChatGuide({ onClose, onStartVideoCall }: VideoChatGuideProps) {
  const [status, setStatus] = useState<DeviceStatus>({
    camera: null,
    microphone: null,
    network: null,
    webrtc: null
  });
  const [checking, setChecking] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Check basic device compatibility
  useEffect(() => {
    // Check if getUserMedia is supported
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    // Check if WebRTC is supported
    const hasRTCPeerConnection = !!window.RTCPeerConnection;
    
    // Basic network check
    const isOnline = navigator.onLine;
    
    // Update status
    setStatus(prev => ({
      ...prev,
      network: isOnline,
      webrtc: hasMediaDevices && hasRTCPeerConnection
    }));
  }, []);
  
  // Check device permissions
  const checkDevices = async () => {
    setChecking(true);
    
    try {
      // Check camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      // Check if we got both audio and video tracks
      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;
      
      setStatus(prev => ({
        ...prev,
        camera: hasVideo,
        microphone: hasAudio
      }));
      
      // TODO: Dalam implementasi sebenarnya, sebaiknya kirim permintaan ke backend
      // untuk memvalidasi kapabilitas WebRTC secara keseluruhan
      
      // Ini hanya pengujian dasar bahwa browser mendukung WebRTC
      setStatus(prev => ({
        ...prev,
        webrtc: true
      }));
      
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
  
  const canUseVideoChat = status.camera && status.microphone && status.network && status.webrtc;

  const handleStartCall = () => {
    if (!canUseVideoChat) {
      console.error('Perangkat belum siap untuk panggilan video.');
      return;
    }
    
    if (!phoneNumber.trim()) {
      console.error('Masukkan nomor telepon untuk melakukan panggilan.');
      return;
    }
    
    // TODO: Dalam implementasi sebenarnya, sebaiknya validasi nomor telepon melalui backend
    if (onStartVideoCall) {
      onStartVideoCall(phoneNumber);
    }
    
    onClose();
  };
  
  const getDeviceInstructions = () => {
    const instructions = [];
    
    if (status.camera === false) {
      instructions.push('Izinkan akses kamera di pengaturan browser Anda');
    }
    
    if (status.microphone === false) {
      instructions.push('Izinkan akses mikrofon di pengaturan browser Anda');
    }
    
    if (status.network === false) {
      instructions.push('Periksa koneksi internet Anda');
    }
    
    if (status.webrtc === false) {
      instructions.push('Browser Anda mungkin tidak mendukung WebRTC. Gunakan browser modern seperti Chrome atau Firefox');
    }
    
    return instructions;
  };

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
        
        <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-md">
          <div className="flex items-center">
            <FiCloudLightning className="mr-3 text-primary-600" />
            <span>Dukungan WebRTC</span>
          </div>
          {getStatusIcon(status.webrtc)}
        </div>
      </div>
      
      {onStartVideoCall && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Nomor Telepon Tujuan
          </label>
          <input
            type="tel"
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Masukkan nomor telepon"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
      )}
      
      <div className="space-y-4">
        {!canUseVideoChat && status.camera !== null && (
          <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
            <p className="font-medium mb-1">Perangkat belum siap:</p>
            <ul className="list-disc pl-5">
              {getDeviceInstructions().map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
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
          
          {onStartVideoCall ? (
            <Button 
              onClick={handleStartCall}
              disabled={!canUseVideoChat || !phoneNumber.trim() || checking}
            >
              Mulai Panggilan Video
            </Button>
          ) : (
            <Button onClick={onClose}>
              {canUseVideoChat ? 'Perangkat Siap' : 'Tutup'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}