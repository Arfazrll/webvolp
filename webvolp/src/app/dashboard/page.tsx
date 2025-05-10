'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FiPhone, FiClock, FiInfo, FiPlus, FiVideo, FiCheck, FiX, FiAlertTriangle, FiMic, FiWifi } from 'react-icons/fi';
import { Navbar } from '../../components/ui/Navbar';
import { Footer } from '../../components/ui/Footer';
import { Button } from '../../components/ui/Button';
import { CallHistory } from '../../components/call/CallHistory';
import { useAuth } from '../../lib/hooks/useAuth';
import { useCall } from '../../lib/hooks/useCall';

// Komponen VideoChatGuide
function VideoChatGuide({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState({
    camera: null as boolean | null,
    microphone: null as boolean | null,
    network: null as boolean | null
  });
  const [checking, setChecking] = useState(false);
  
  // Check device compatibility
  React.useEffect(() => {
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

export default function DashboardPage() {
  const { user } = useAuth();
  const { callHistory, toggleDialPad } = useCall();
  const [showVideoGuide, setShowVideoGuide] = useState(false);

  // Mengambil 5 panggilan terakhir untuk quick view
  const recentCalls = callHistory.slice(0, 5);

  // Ekstrak 4 digit terakhir nomor telepon untuk tampilan user
  const userDisplay = user?.phoneNumber 
    ? `User ${user.phoneNumber.slice(-4)}` 
    : 'User';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">
              Selamat datang, {userDisplay}
            </h1>
            <p className="text-secondary-600">
              Kelola panggilan VoIP Anda dengan mudah
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/call" className="block">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow h-full">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                  <FiPhone className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-lg font-medium mb-2">Panggilan</h2>
                <p className="text-secondary-600 text-sm">
                  Mulai panggilan suara atau video baru
                </p>
              </div>
            </Link>
            
            <Link href="/history" className="block">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow h-full">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                  <FiClock className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-lg font-medium mb-2">Riwayat</h2>
                <p className="text-secondary-600 text-sm">
                  Lihat semua riwayat panggilan Anda
                </p>
              </div>
            </Link>
            
            <Link href="/about" className="block">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow h-full">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                  <FiInfo className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-lg font-medium mb-2">Tentang</h2>
                <p className="text-secondary-600 text-sm">
                  Informasi tentang VoIP App
                </p>
              </div>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Panggilan Terbaru</h2>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-sm flex items-center"
                  onClick={() => setShowVideoGuide(true)}
                >
                  <FiVideo className="mr-2" /> Cek Kesiapan Video Call
                </Button>
                <Link href="/history">
                  <Button variant="outline" size="sm" className="text-sm">
                    Lihat Semua
                  </Button>
                </Link>
              </div>
            </div>
            
            <CallHistory calls={recentCalls} />
            
            {recentCalls.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8">
                <p className="text-secondary-500 mb-4">Belum ada riwayat panggilan</p>
                <Link href="/call">
                  <Button 
                    variant="default" 
                    className="inline-flex items-center"
                    onClick={() => toggleDialPad()}
                  >
                    <FiPlus className="mr-2" />
                    Buat Panggilan Baru
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Dialog Panduan Video Call */}
      {showVideoGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <VideoChatGuide onClose={() => setShowVideoGuide(false)} />
        </div>
      )}
    </div>
  );
}