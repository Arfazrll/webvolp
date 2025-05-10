// src/components/call/VideoChatGuide.tsx (Perbaikan)

import React, { useState, useEffect } from 'react';
import { FiVideo, FiMic, FiWifi, FiCheck, FiX, FiAlertTriangle, FiCloudLightning } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface DeviceStatus {
  camera: boolean | null;
  microphone: boolean | null;
  network: boolean | null;
  webrtc: boolean | null;
}

// Definisikan props dengan benar
interface VideoChatGuideProps {
  onClose: () => void;
  onStartVideoCall?: (phoneNumber: string) => void; // Tambahkan prop ini dengan tipe yang sesuai
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
      network: isOnline,
      webrtc: hasMediaDevices && hasRTCPeerConnection
    }));
  }, []);
  
  const checkDevices = async () => {
    setChecking(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      // Check if we got both audio and video tracks
      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;
      
      // Logging device info
      if (hasVideo) {
        const videoTrack = stream.getVideoTracks()[0];
        console.log('Video device:', videoTrack.label);
        console.log('Video track settings:', videoTrack.getSettings());
      }
      
      if (hasAudio) {
        const audioTrack = stream.getAudioTracks()[0];
        console.log('Audio device:', audioTrack.label);
      }
      
      setStatus(prev => ({
        ...prev,
        camera: hasVideo,
        microphone: hasAudio
      }));
      
      // Additional WebRTC check
      try {
        // Create test peer connection
        const pc1 = new RTCPeerConnection();
        const pc2 = new RTCPeerConnection();
        
        // Add track to peer connection
        stream.getTracks().forEach(track => {
          pc1.addTrack(track, stream);
        });
        
        // Create data channel as additional test
        const dc = pc1.createDataChannel('test');
        
        // Handle ICE candidates
        pc1.onicecandidate = (e) => {
          if (e.candidate) {
            pc2.addIceCandidate(e.candidate);
          }
        };
        
        pc2.onicecandidate = (e) => {
          if (e.candidate) {
            pc1.addIceCandidate(e.candidate);
          }
        };
        
        // Create and set offer
        const offer = await pc1.createOffer();
        await pc1.setLocalDescription(offer);
        await pc2.setRemoteDescription(offer);
        
        // Create and set answer
        const answer = await pc2.createAnswer();
        await pc2.setLocalDescription(answer);
        await pc1.setRemoteDescription(answer);
        
        // Clean up
        setTimeout(() => {
          pc1.close();
          pc2.close();
          console.log('WebRTC test connection closed');
        }, 1000);
        
        setStatus(prev => ({
          ...prev,
          webrtc: true
        }));
      } catch (webrtcError) {
        console.error('WebRTC connection test failed:', webrtcError);
        setStatus(prev => ({
          ...prev,
          webrtc: false
        }));
      }
      
      // Stop tracks
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error checking devices:', error);
      
      // Try to determine which permission was denied
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('video')) {
          setStatus(prev => ({ ...prev, camera: false }));
          console.error('Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.');
        }
        
        if (errorMessage.includes('audio') || errorMessage.includes('microphone')) {
          setStatus(prev => ({ ...prev, microphone: false }));
          console.error('Izin mikrofon ditolak. Silakan izinkan akses mikrofon di pengaturan browser Anda.');
        }
      } else {
        // Generic error
        setStatus(prev => ({ 
          ...prev, 
          camera: false,
          microphone: false
        }));
        console.error('Gagal mengakses kamera dan mikrofon. Periksa pengaturan izin browser Anda.');
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
      console.error('Perangkat belum siap untuk panggilan video. Silakan periksa status perangkat.');
      return;
    }
    
    if (!phoneNumber.trim()) {
      console.error('Masukkan nomor telepon untuk melakukan panggilan.');
      return;
    }
    
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