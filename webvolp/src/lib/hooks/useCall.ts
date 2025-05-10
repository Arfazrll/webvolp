import { useEffect, useState, useRef } from 'react';
import { useCallStore } from '../../app/store/callStore';
import { useAuthStore } from '../../app/store/authStore';
import { kamailioService } from '../../lib/api/kamailioService';
import { CallType, CallStatus, CallDirection } from '../../app/types';
import { toast } from 'react-toastify';

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
  
  // Refs untuk elemen video
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize Kamailio service when user is available
  useEffect(() => {
    if (user && !isInitialized) {
      console.log('Initializing Kamailio service with user:', user.phoneNumber);
      
      try {
        // TODO: Implementasikan koneksi asli ke Kamailio
        kamailioService.initialize(
          { 
            phoneNumber: user.phoneNumber, 
            password: '' // TODO: Implementasikan manajemen kredensial yang aman
          },
          // Status callback
          (status) => {
            console.log('Call status changed:', status);
            updateCallStatus(status);
            
            if (status === 'failed') {
              toast.error('Panggilan gagal. Periksa koneksi jaringan Anda.');
            }
          },
          // Incoming call callback
          (phoneNumber, type) => {
            console.log('Incoming call from:', phoneNumber, 'type:', type);
            toast.info(`Panggilan ${type === 'video' ? 'video' : 'suara'} masuk dari ${phoneNumber}`);
            
            // TODO: Verifikasi dengan backend bahwa panggilan masuk valid
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
          },
          // Connection callback
          (connectionStatus) => {
            console.log('Connection status changed:', connectionStatus);
            if (connectionStatus === false) {
              toast.error('Koneksi VoIP terputus');
            } else if (connectionStatus === true) {
              toast.success('Terhubung ke layanan VoIP');
            }
          }
        );
        
        setIsInitialized(true);
        console.log('Kamailio service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Kamailio service:', error);
        toast.error('Gagal menginisialisasi layanan VoIP');
      }
    }
    
    // Cleanup pada unmount
    return () => {
      if (isInitialized) {
        console.log('Cleaning up Kamailio service');
        kamailioService.shutdown();
      }
    };
  }, [user, isInitialized, callHistory, updateCallStatus]);

  // Metode untuk membuat panggilan
  const makeCall = async (phoneNumber: string, type: CallType = 'audio') => {
    if (!phoneNumber.trim()) {
      toast.error('Masukkan nomor telepon terlebih dahulu');
      return;
    }
    
    try {
      console.log('Making call to', phoneNumber, 'with type', type);
      
      // Check camera/mic permission for video calls
      if (type === 'video') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          
          // Stop tracks after permission check
          stream.getTracks().forEach(track => track.stop());
          console.log('Camera and microphone permission granted');
        } catch (err) {
          console.error('Media permission denied:', err);
          toast.error('Izin kamera/mikrofon ditolak. Silakan izinkan akses untuk melakukan panggilan video.');
          return;
        }
      }
      
      // TODO: Pendekatan yang benar adalah untuk menginisialisasi koneksi ke backend DULU,
      // kemudian setelah berhasil, baru update state UI
      // Untuk sekarang, update store dahulu
      storeStartCall(phoneNumber, type);
      
      if (isInitialized) {
        // TODO: Implementasikan koneksi ke backend untuk panggilan
        await kamailioService.makeCall(phoneNumber, type);
        
        // Set initial media state
        setAudioEnabled(true);
        setVideoEnabled(type === 'video');
      } else {
        throw new Error('Layanan VoIP belum diinisialisasi');
      }
    } catch (error) {
      console.error('Failed to make call:', error);
      toast.error(`Gagal melakukan panggilan: ${error instanceof Error ? error.message : 'Error tidak diketahui'}`);
      
      // Update status menjadi failed
      updateCallStatus('failed');
      
      // Akhiri panggilan di store - tidak perlu setTimeout
      storeEndCall();
    }
  };

  // Metode untuk menjawab panggilan
  const answerCall = async () => {
    if (!currentCall) {
      console.warn('No incoming call to answer');
      return;
    }
    
    try {
      console.log('Answering call from', currentCall.phoneNumber, 'with type', currentCall.type);
      
      // Pre-check permissions for video calls
      if (currentCall.type === 'video') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          
          // Stop tracks after permission check
          stream.getTracks().forEach(track => track.stop());
          console.log('Camera and microphone permission granted');
        } catch (err) {
          console.error('Media permission denied:', err);
          toast.error('Izin kamera/mikrofon ditolak. Silakan izinkan akses untuk menjawab panggilan video.');
          return;
        }
      }
      
      // TODO: Pendekatan yang benar adalah menjawab panggilan di backend DULU
      // kemudian setelah berhasil, baru update state UI
      // Untuk sekarang, update store dahulu
      storeAnswerCall();
      
      if (isInitialized) {
        // TODO: Implementasikan koneksi ke backend untuk menjawab panggilan
        await kamailioService.answerCall(currentCall.type);
        
        // Set initial media state
        setAudioEnabled(true);
        setVideoEnabled(currentCall.type === 'video');
      } else {
        throw new Error('Layanan VoIP belum diinisialisasi');
      }
    } catch (error) {
      console.error('Failed to answer call:', error);
      toast.error(`Gagal menjawab panggilan: ${error instanceof Error ? error.message : 'Error tidak diketahui'}`);
      
      // Update status menjadi failed
      updateCallStatus('failed');
      
      // Akhiri panggilan di store - tidak perlu setTimeout
      storeEndCall();
    }
  };

  // Metode untuk mengakhiri panggilan
  const endCall = () => {
    if (!currentCall) {
      console.warn('No active call to end');
      return;
    }
    
    try {
      console.log('Ending call with', currentCall.phoneNumber);
      
      // TODO: Pendekatan yang benar adalah mengakhiri panggilan di backend DULU,
      // kemudian setelah berhasil, baru update state UI
      // Untuk sekarang, update store dahulu
      storeEndCall();
      
      if (isInitialized) {
        // TODO: Implementasikan koneksi ke backend untuk mengakhiri panggilan
        kamailioService.endCall();
      }
      
      // Reset media state
      setAudioEnabled(true);
      setVideoEnabled(true);
    } catch (error) {
      console.error('Failed to end call:', error);
      toast.error('Gagal mengakhiri panggilan');
    }
  };

  // Metode untuk menolak panggilan
  const rejectCall = () => {
    if (!currentCall || currentCall.direction !== 'incoming') {
      console.warn('No incoming call to reject');
      return;
    }
    
    try {
      console.log('Rejecting call from', currentCall.phoneNumber);
      
      // TODO: Pendekatan yang benar adalah menolak panggilan di backend DULU,
      // kemudian setelah berhasil, baru update state UI
      // Untuk sekarang, update store dahulu
      storeRejectCall();
      
      if (isInitialized) {
        // TODO: Implementasikan koneksi ke backend untuk menolak panggilan
        kamailioService.endCall();
      }
      
      // Reset media state
      setAudioEnabled(true);
      setVideoEnabled(true);
    } catch (error) {
      console.error('Failed to reject call:', error);
      toast.error('Gagal menolak panggilan');
    }
  };

  // Metode untuk toggle audio
  const toggleAudio = (enabled: boolean) => {
    try {
      console.log('Toggling audio:', enabled);
      setAudioEnabled(enabled);
      
      if (isInitialized) {
        kamailioService.toggleAudio(enabled);
      }
      
      toast.info(enabled ? 'Mikrofon aktif' : 'Mikrofon dimatikan');
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    }
  };

  // Metode untuk toggle video
  const toggleVideo = (enabled: boolean) => {
    try {
      console.log('Toggling video:', enabled);
      setVideoEnabled(enabled);
      
      if (isInitialized) {
        kamailioService.toggleVideo(enabled);
      }
      
      toast.info(enabled ? 'Kamera aktif' : 'Kamera dimatikan');
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  };

  // Metode untuk toggle speaker
  const toggleSpeaker = (enabled: boolean) => {
    try {
      console.log('Toggling speaker:', enabled);
      setSpeakerEnabled(enabled);
      
      if (isInitialized) {
        kamailioService.toggleSpeaker(enabled);
      }
      
      toast.info(enabled ? 'Speaker aktif' : 'Speaker dimatikan');
    } catch (error) {
      console.error('Failed to toggle speaker:', error);
    }
  };

  // Function untuk set video refs ke service
  const setVideoRefs = (localVideo: HTMLVideoElement | null, remoteVideo: HTMLVideoElement | null) => {
    try {
      console.log('Setting video refs to service:', {
        localVideo: localVideo ? `id=${localVideo.id}` : 'null',
        remoteVideo: remoteVideo ? `id=${remoteVideo.id}` : 'null'
      });
      
      // Simpan refs
      if (localVideo) localVideoRef.current = localVideo;
      if (remoteVideo) remoteVideoRef.current = remoteVideo;
      
      if (isInitialized) {
        kamailioService.setVideoElements(localVideo, remoteVideo);
      }
    } catch (error) {
      console.error('Failed to set video refs:', error);
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
    setVideoRefs,
    localVideoRef,
    remoteVideoRef
  };
}