import * as JsSIP from 'jssip';
import { KamailioConfig, KamailioCredentials, CallType, CallStatus, MediaStreamState } from '../../app/types';
import { toast } from 'react-toastify';

const logWebRTC = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    const timestamp = new Date().toISOString().substr(11, 12);
    console.log(`[WebRTC ${timestamp}] ${message}`, data || '');
  }
};

class KamailioService {
  private ua: any = null; // User Agent JsSIP
  private session: any = null; // Sesi panggilan aktif
  private config: KamailioConfig;
  private onCallStatusChange: (status: CallStatus) => void = () => {};
  private onIncomingCall: (phoneNumber: string, type: CallType) => void = () => {};
  private onConnectionChange: (connected: boolean) => void = () => {};
  private mediaState: MediaStreamState = {
    localStream: null,
    remoteStream: null,
    audioEnabled: true,
    videoEnabled: true,
    speakerEnabled: false
  };
  private localVideoElement: HTMLVideoElement | null = null;
  private remoteVideoElement: HTMLVideoElement | null = null;
  private isVideoCallReady: boolean = false;
  private isInitializing: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private connectionState: string = 'new';

  constructor() {
    
    this.config = {
      domain: process.env.NEXT_PUBLIC_KAMAILIO_DOMAIN || '',
      port: Number(process.env.NEXT_PUBLIC_KAMAILIO_PORT) || 0,
      websocket: process.env.NEXT_PUBLIC_KAMAILIO_WS || '',
      // Server ICE harus dikonfigurasi dengan benar dari backend
      iceServers: []
    };

    logWebRTC('KamailioService initialized with config', {
      domain: this.config.domain,
      port: this.config.port,
      websocket: this.config.websocket
    });
  }

  /**
   * Mendapatkan status koneksi saat ini
   */
  getConnectionState(): string {
    return this.connectionState;
  }


  initialize(
    credentials: KamailioCredentials, 
    statusCallback: (status: CallStatus) => void, 
    incomingCallCallback: (phoneNumber: string, type: CallType) => void,
    connectionCallback: (connected: boolean) => void
  ) {
    if (this.isInitializing) {
      logWebRTC('Already initializing, skipping duplicate call');
      return false;
    }
    
    this.isInitializing = true;
    this.onCallStatusChange = statusCallback;
    this.onIncomingCall = incomingCallCallback;
    this.onConnectionChange = connectionCallback;
    this.connectionState = 'new';

    try {
      logWebRTC('Initializing JsSIP');
      
      // Validasi dukungan browser
      if (!window.RTCPeerConnection) {
        throw new Error('Browser tidak mendukung WebRTC. Gunakan Chrome, Firefox, atau Edge terbaru.');
      }
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera/mikrofon. Gunakan browser yang lebih baru.');
      }

      // Validasi konfigurasi
      if (!this.config.domain || !this.config.websocket) {
        throw new Error('Konfigurasi Kamailio tidak valid. Periksa environment variables.');
      }

      
      logWebRTC('TODO: Implement JsSIP initialization');
      
      this.isInitializing = false;
      return true;
    } catch (error) {
      logWebRTC('Error initializing JsSIP', error);
      this.isInitializing = false;
      return false;
    }
  }


  setVideoElements(localVideo: HTMLVideoElement | null, remoteVideo: HTMLVideoElement | null) {
    logWebRTC('Setting video elements', { 
      localVideo: localVideo ? `id=${localVideo.id || 'unset'}` : 'null', 
      remoteVideo: remoteVideo ? `id=${remoteVideo.id || 'unset'}` : 'null' 
    });
    
    this.localVideoElement = localVideo;
    this.remoteVideoElement = remoteVideo;
    
    // Konfigurasi video elements
    if (this.localVideoElement) {
      this.localVideoElement.autoplay = true;
      this.localVideoElement.muted = true; // Selalu mute untuk mencegah feedback
      this.localVideoElement.playsInline = true;
    }
    
    if (this.remoteVideoElement) {
      this.remoteVideoElement.autoplay = true;
      this.remoteVideoElement.playsInline = true;
    }
    
    this.isVideoCallReady = !!(this.localVideoElement && this.remoteVideoElement);
    logWebRTC('Video call readiness set to', this.isVideoCallReady);
  }

 
  async makeCall(phoneNumber: string, type: CallType = 'audio') {
    logWebRTC(`Initiating ${type} call to ${phoneNumber}`);
    
    if (!this.ua) {
      logWebRTC('User agent not initialized');
      throw new Error('User agent not initialized. Call initialize() first.');
    }
    
    try {
      // TODO: Implementasikan logika untuk membuat panggilan ke backend Kamailio
      throw new Error('Fungsi belum diimplementasikan');
    } catch (error) {
      logWebRTC('Error making call', error);
      throw error;
    }
  }


  async answerCall(type: CallType = 'audio') {
    if (!this.session || this.session.direction !== 'incoming') {
      logWebRTC('No incoming call to answer');
      return false;
    }
    
    logWebRTC(`Answering call as ${type}`);
    
    try {
      // TODO: Implementasikan logika untuk menjawab panggilan dari backend Kamailio
      return false;
    } catch (error) {
      logWebRTC('Error answering call', error);
      return false;
    }
  }


  endCall() {
    logWebRTC('Ending call');
    
    // Reset connection state
    this.connectionState = 'closed';
    

    this.mediaState = {
      localStream: null,
      remoteStream: null,
      audioEnabled: true,
      videoEnabled: true,
      speakerEnabled: false
    };
    
    // Reset video call ready state
    this.onConnectionChange(false);
    
    logWebRTC('Call ended successfully');
  }


  toggleAudio(enabled: boolean) {
    logWebRTC('Toggling audio', enabled);
    
    if (this.mediaState.localStream) {
      const audioTracks = this.mediaState.localStream.getAudioTracks();
      logWebRTC(`Found ${audioTracks.length} audio tracks to toggle`);
      
      audioTracks.forEach(track => {
        logWebRTC(`Setting audio track ${track.label} enabled: ${enabled}`);
        track.enabled = enabled;
      });
      
      this.mediaState.audioEnabled = enabled;
    } else {
      logWebRTC('No local stream available to toggle audio');
    }

  }

  toggleVideo(enabled: boolean) {
    logWebRTC('Toggling video', enabled);
    
    if (this.mediaState.localStream) {
      const videoTracks = this.mediaState.localStream.getVideoTracks();
      logWebRTC(`Found ${videoTracks.length} video tracks to toggle`);
      
      videoTracks.forEach(track => {
        logWebRTC(`Setting video track ${track.label} enabled: ${enabled}`);
        track.enabled = enabled;
      });
      
      this.mediaState.videoEnabled = enabled;
    } else {
      logWebRTC('No local stream available to toggle video');
    }
    
  }

  toggleSpeaker(enabled: boolean) {
    logWebRTC('Toggling speaker', enabled);
    this.mediaState.speakerEnabled = enabled;
    
    if (this.remoteVideoElement && 'setSinkId' in this.remoteVideoElement) {
      try {
        // @ts-ignore - setSinkId tidak ada di tipe HTMLVideoElement standar
        this.remoteVideoElement.setSinkId(enabled ? 'speakerphone' : 'earpiece')
          .then(() => logWebRTC(`Audio output set to ${enabled ? 'speaker' : 'earpiece'}`))
          .catch((err: any) => {
            logWebRTC('Failed to set audio output device', err);
          });
      } catch (error) {
        logWebRTC('Error setting audio output device', error);
      }
    } else {
      logWebRTC('setSinkId not supported by this browser');
      
      // Fallback - adjust volume
      if (this.remoteVideoElement) {
        const videoElement = this.remoteVideoElement as HTMLVideoElement;
        videoElement.volume = enabled ? 1.0 : 0.5;
        logWebRTC(`Adjusted volume to ${enabled ? '100%' : '50%'} as fallback`);
      }
    }
  }

  /**
   * Shutdown service dan membersihkan resource
   */
  shutdown() {
    logWebRTC('Shutting down KamailioService');
    
    // Reset connection state
    this.connectionState = 'closed';
    
    // Stop all media
    if (this.mediaState.localStream) {
      this.mediaState.localStream.getTracks().forEach(track => {
        logWebRTC(`Stopping ${track.kind} track: ${track.label}`);
        track.stop();
      });
      this.mediaState.localStream = null;
    }
    
    // Clear video elements
    if (this.localVideoElement && this.localVideoElement.srcObject) {
      this.localVideoElement.srcObject = null;
    }
    
    if (this.remoteVideoElement && this.remoteVideoElement.srcObject) {
      this.remoteVideoElement.srcObject = null;
    }
    
    // Terminate session and UA
    if (this.ua) {
      if (this.session && this.session.isEnded && 
          typeof this.session.isEnded === 'function' && !this.session.isEnded()) {
        this.session.terminate();
      }
      this.ua.stop();
      this.ua = null;
    }
    
    // Reset all state
    this.mediaState = {
      localStream: null,
      remoteStream: null,
      audioEnabled: true,
      videoEnabled: true,
      speakerEnabled: false
    };
    
    this.isVideoCallReady = false;
    this.onConnectionChange(false);
    logWebRTC('KamailioService shutdown complete');
  }
}

export const kamailioService = new KamailioService();