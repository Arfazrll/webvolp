import * as JsSIP from 'jssip';
import { KamailioConfig, KamailioCredentials, CallType, CallStatus, MediaStreamState } from '../../app/types';

// Definisi tipe untuk event JsSIP yang lebih akurat
interface RTCSessionEvent {
  session: JsSIPSession;
  originator?: string;
  request?: any;
}

// Interface yang lebih lengkap untuk session JsSIP
interface JsSIPSession {
  direction: string;
  remote_identity: {
    uri: {
      user: string;
    };
    display_name?: string;
  };
  request: {
    body: string;
  };
  terminate: (options?: any) => void;
  answer: (options: JsSIPSessionOptions) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  connection: RTCPeerConnection;
  isEnded: () => boolean;
  isEstablished: () => boolean;
}

interface JsSIPSessionOptions {
  mediaConstraints: {
    audio: boolean;
    video: boolean | MediaTrackConstraints;
  };
  pcConfig: {
    iceServers: RTCIceServer[];
    iceTransportPolicy?: RTCIceTransportPolicy;
  };
}

class KamailioService {
  private ua: JsSIP.UA | null = null;
  private session: JsSIPSession | null = null;
  private config: KamailioConfig;
  private onCallStatusChange: (status: CallStatus) => void = () => {};
  private onIncomingCall: (phoneNumber: string, type: CallType) => void = () => {};
  private mediaState: MediaStreamState = {
    localStream: null,
    remoteStream: null,
    audioEnabled: true,
    videoEnabled: true,
    speakerEnabled: false
  };
  private localVideoElement: HTMLVideoElement | null = null;
  private remoteVideoElement: HTMLVideoElement | null = null;

  constructor() {
    // Default konfigurasi (seharusnya diambil dari environment variables)
    this.config = {
      domain: process.env.NEXT_PUBLIC_KAMAILIO_DOMAIN || 'voip-server.example.com',
      port: Number(process.env.NEXT_PUBLIC_KAMAILIO_PORT) || 8088,
      websocket: process.env.NEXT_PUBLIC_KAMAILIO_WS || 'wss://voip-server.example.com:8088/ws',
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] }
      ]
    };
  }

  initialize(
    credentials: KamailioCredentials, 
    statusCallback: (status: CallStatus) => void, 
    incomingCallCallback: (phoneNumber: string, type: CallType) => void
  ) {
    this.onCallStatusChange = statusCallback;
    this.onIncomingCall = incomingCallCallback;

    // Konfigurasi socket
    const socket = new JsSIP.WebSocketInterface(this.config.websocket);
    
    // Debug options untuk development
    const debug = {
      debug: {
        level: 3,  // Dari 0 (tidak ada debug) sampai 3 (verbose)
      }
    };
    
    const configuration = {
      sockets: [socket],
      uri: `sip:${credentials.phoneNumber}@${this.config.domain}`,
      password: credentials.password,
      display_name: credentials.phoneNumber,
      ...debug
    };

    // Inisialisasi UA (User Agent)
    this.ua = new JsSIP.UA(configuration);

    // Register event handlers
    this.ua.on('connected', () => {
      console.log('Connected to WebSocket');
    });
    
    this.ua.on('disconnected', () => {
      console.log('Disconnected from WebSocket');
    });
    
    this.ua.on('registered', () => {
      console.log('Registered with SIP server');
    });
    
    this.ua.on('unregistered', () => {
      console.log('Unregistered from SIP server');
    });
    
    this.ua.on('registrationFailed', (cause) => {
      console.error('Registration failed:', cause);
    });

    // Handle incoming calls dengan implementasi yang lebih baik
    this.ua.on('newRTCSession', (event: RTCSessionEvent) => {
      console.log('New RTC Session', event);
      
      const session = event.session;
      
      if (session.direction === 'incoming') {
        // Tentukan tipe panggilan berdasarkan SDP
        const callType: CallType = 
          session.request && session.request.body && 
          session.request.body.indexOf('m=video') > -1 ? 'video' : 'audio';
        
        // Dapatkan nomor penelepon
        const from = session.remote_identity?.uri?.user || '';
        
        // Notifikasi panggilan masuk
        this.onIncomingCall(from, callType);
        this.session = session;
        
        // Setup call listeners
        this.setupCallListeners(session);
      }
    });

    // Start the user agent
    this.ua.start();
  }

  // Metode untuk mengatur elemen video
  setVideoElements(localVideo: HTMLVideoElement | null, remoteVideo: HTMLVideoElement | null) {
    this.localVideoElement = localVideo;
    this.remoteVideoElement = remoteVideo;
    
    // Jika session sudah aktif, perbarui elemen video
    if (this.session && this.session.isEstablished() && this.mediaState.remoteStream) {
      if (this.remoteVideoElement) {
        this.remoteVideoElement.srcObject = this.mediaState.remoteStream;
      }
    }
    
    if (this.mediaState.localStream && this.localVideoElement) {
      this.localVideoElement.srcObject = this.mediaState.localStream;
    }
  }

  // Implementasi yang lebih baik untuk mengatur WebRTC event listeners
  private setupMediaListeners(session: JsSIPSession) {
    if (!session.connection) {
      console.error('No RTCPeerConnection available');
      return;
    }
    
    console.log('Setting up media listeners for RTCPeerConnection');

    // Handle remote tracks
    session.connection.ontrack = (event) => {
      console.log('Remote track received', event);
      
      if (event.streams && event.streams[0]) {
        this.mediaState.remoteStream = event.streams[0];
        
        console.log('Setting remote stream to video element');
        if (this.remoteVideoElement) {
          this.remoteVideoElement.srcObject = this.mediaState.remoteStream;
          this.remoteVideoElement.play().catch(err => {
            console.error('Failed to play remote video', err);
          });
        }
      }
    };

    // Handle connection state changes
    session.connection.onconnectionstatechange = () => {
      console.log('Connection state changed:', session.connection.connectionState);
    };
    
    // Handle ICE connection state changes
    session.connection.oniceconnectionstatechange = () => {
      console.log('ICE connection state changed:', session.connection.iceConnectionState);
      
      // Jika koneksi terputus
      if (session.connection.iceConnectionState === 'disconnected' || 
          session.connection.iceConnectionState === 'failed') {
        console.warn('ICE connection failed or disconnected');
      }
    };
    
    // Handle ICE gathering state
    session.connection.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', session.connection.iceGatheringState);
    };
    
    // Log ICE candidates untuk debug
    session.connection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', event.candidate.candidate);
      } else {
        console.log('All ICE candidates gathered');
      }
    };
  }

  // Implementasi yang lebih baik untuk getUserMedia
  private async getUserMedia(isVideo: boolean): Promise<MediaStream | null> {
    try {
      // Batasan media yang lebih spesifik untuk video
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      };
      
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: isVideo ? videoConstraints : false
      };
      
      console.log('Requesting user media with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaState.localStream = stream;
      
      console.log('Got local stream with tracks:', stream.getTracks().map(t => `${t.kind}: ${t.label}`));
      
      // Tampilkan di local video element jika tersedia
      if (this.localVideoElement && stream) {
        console.log('Setting local stream to video element');
        this.localVideoElement.srcObject = stream;
        this.localVideoElement.muted = true; // Mute lokal untuk mencegah feedback
        this.localVideoElement.play().catch(err => {
          console.error('Failed to play local video', err);
        });
      }
      
      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      return null;
    }
  }

  // Mute/unmute audio
  toggleAudio(enabled: boolean) {
    if (this.mediaState.localStream) {
      this.mediaState.localStream.getAudioTracks().forEach(track => {
        console.log(`Setting audio track ${track.label} enabled: ${enabled}`);
        track.enabled = enabled;
      });
      this.mediaState.audioEnabled = enabled;
    } else {
      console.warn('No local stream available to toggle audio');
    }
  }

  // Enable/disable video
  toggleVideo(enabled: boolean) {
    if (this.mediaState.localStream) {
      this.mediaState.localStream.getVideoTracks().forEach(track => {
        console.log(`Setting video track ${track.label} enabled: ${enabled}`);
        track.enabled = enabled;
      });
      this.mediaState.videoEnabled = enabled;
    } else {
      console.warn('No local stream available to toggle video');
    }
  }

  // Toggle speaker
  toggleSpeaker(enabled: boolean) {
    this.mediaState.speakerEnabled = enabled;
    
    // Implementasi untuk audio output device jika tersedia
    if (this.remoteVideoElement && 'setSinkId' in this.remoteVideoElement) {
      // Catatan: setSinkId memerlukan izin pengguna
      try {
        // @ts-ignore - setSinkId tidak ada di tipe HTMLVideoElement standar
        this.remoteVideoElement.setSinkId(enabled ? 'speakerphone' : 'earpiece').catch(err => {
          console.error('Failed to set audio output device', err);
        });
      } catch (error) {
        console.error('Error setting audio output device:', error);
      }
    }
  }

  // Implementasi yang lebih baik untuk makeCall
  async makeCall(phoneNumber: string, type: CallType = 'audio') {
    if (!this.ua) {
      throw new Error('User agent not initialized. Call initialize() first.');
    }

    // Dapatkan media stream untuk audio/video
    const stream = await this.getUserMedia(type === 'video');
    
    if (!stream) {
      throw new Error('Failed to get user media');
    }

    // Konfigurasi yang lebih baik untuk options
    const options: JsSIPSessionOptions = {
      mediaConstraints: {
        audio: true,
        video: type === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      },
      pcConfig: {
        iceServers: this.config.iceServers,
        iceTransportPolicy: 'all'
      }
    };

    console.log('Making call to', phoneNumber, 'with type', type);
    
    // Siapkan target URI
    const target = `sip:${phoneNumber}@${this.config.domain}`;
    
    try {
      // Tambahkan metode extraHeaders untuk memastikan bahwa tipe panggilan diketahui
      const extraHeaders = type === 'video' ? 
        ['X-Call-Type: video'] : 
        ['X-Call-Type: audio'];
      
      // Buat panggilan dengan extraHeaders
      const callSession = this.ua.call(target, {
        ...options,
        extraHeaders
      });
      
      // @ts-ignore - JsSIP types tidak sesuai dengan implementasi aktual
      this.session = callSession;
      
      // Setup call listeners
      if (this.session) {
        this.setupCallListeners(this.session);
        
        // Setup media listeners setelah session dibuat
        // Ini harus dilakukan sebelum panggilan dimulai
        if (this.session.connection) {
          this.setupMediaListeners(this.session);
        } else {
          console.warn('No RTCPeerConnection available yet');
          
          // Tambahkan listener untuk peerconnection event
          this.session.on('peerconnection', (data: any) => {
            console.log('Peer connection created');
            if (data && data.peerconnection) {
              this.setupMediaListeners(this.session!);
            }
          });
        }
      }
      
      // Tambahkan track ke peerConnection jika ada
      if (this.session && this.session.connection) {
        stream.getTracks().forEach(track => {
          try {
            this.session!.connection.addTrack(track, stream);
          } catch (error) {
            console.error('Failed to add track to peer connection:', error);
          }
        });
      } else {
        console.warn('No connection available to add tracks');
      }
      
      return true;
    } catch (error) {
      console.error('Error making call:', error);
      
      // Cleanup stream jika panggilan gagal
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      throw error;
    }
  }

  // Implementasi yang lebih baik untuk answerCall
  async answerCall(type: CallType = 'audio') {
    if (!this.session || this.session.direction !== 'incoming') {
      console.warn('No incoming call to answer');
      return false;
    }
    
    try {
      // Dapatkan media stream untuk audio/video
      const stream = await this.getUserMedia(type === 'video');
      
      if (!stream) {
        console.error('Failed to get user media');
        return false;
      }

      const options: JsSIPSessionOptions = {
        mediaConstraints: {
          audio: true,
          video: type === 'video' ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          } : false
        },
        pcConfig: {
          iceServers: this.config.iceServers,
          iceTransportPolicy: 'all'
        }
      };
      
      console.log('Answering call with type', type);
      
      // Setup media listeners sebelum jawaban
      if (this.session.connection) {
        this.setupMediaListeners(this.session);
      } else {
        console.warn('No RTCPeerConnection available yet for incoming call');
        
        // Tambahkan listener untuk peerconnection event
        this.session.on('peerconnection', (data: any) => {
          console.log('Peer connection created for incoming call');
          if (data && data.peerconnection) {
            this.setupMediaListeners(this.session!);
          }
        });
      }
      
      // Jawab panggilan
      this.session.answer(options);
      
      // Tambahkan track ke peerConnection jika sudah tersedia
      if (this.session.connection) {
        stream.getTracks().forEach(track => {
          try {
            this.session!.connection.addTrack(track, stream);
          } catch (error) {
            console.error('Failed to add track to peer connection:', error);
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error answering call:', error);
      return false;
    }
  }

  // Implementasi yang lebih baik untuk endCall
  endCall() {
    // Stop media streams
    if (this.mediaState.localStream) {
      console.log('Stopping local media tracks');
      this.mediaState.localStream.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track: ${track.label}`);
        track.stop();
      });
      this.mediaState.localStream = null;
    }
    
    // Clear video elements
    if (this.localVideoElement && this.localVideoElement.srcObject) {
      console.log('Clearing local video element');
      this.localVideoElement.srcObject = null;
    }
    
    if (this.remoteVideoElement && this.remoteVideoElement.srcObject) {
      console.log('Clearing remote video element');
      this.remoteVideoElement.srcObject = null;
    }
    
    // Terminate session
    if (this.session) {
      console.log('Terminating SIP session');
      if (!this.session.isEnded()) {
        this.session.terminate();
      }
      this.session = null;
    } else {
      console.warn('No active session to terminate');
    }
    
    // Reset media state
    this.mediaState = {
      localStream: null,
      remoteStream: null,
      audioEnabled: true,
      videoEnabled: true,
      speakerEnabled: false
    };
  }

  // Implementasi yang lebih baik untuk call listeners
  private setupCallListeners(session: JsSIPSession) {
    if (!session) {
      console.warn('No session to setup listeners for');
      return;
    }

    console.log('Setting up call listeners for session');

    session.on('connecting', () => {
      console.log('Call connecting');
      this.onCallStatusChange('connecting');
    });

    session.on('progress', () => {
      console.log('Call in progress (ringing)');
      this.onCallStatusChange('ringing');
    });

    session.on('accepted', () => {
      console.log('Call accepted');
      this.onCallStatusChange('active');
    });

    session.on('confirmed', () => {
      console.log('Call confirmed (answered)');
      this.onCallStatusChange('active');
    });

    session.on('ended', () => {
      console.log('Call ended normally');
      this.onCallStatusChange('ended');
      
      // Cleanup media
      if (this.mediaState.localStream) {
        this.mediaState.localStream.getTracks().forEach(track => track.stop());
        this.mediaState.localStream = null;
      }
      
      this.session = null;
    });

    session.on('failed', (data: any) => {
      console.error('Call failed', data.cause);
      this.onCallStatusChange('failed');
      
      // Cleanup media
      if (this.mediaState.localStream) {
        this.mediaState.localStream.getTracks().forEach(track => track.stop());
        this.mediaState.localStream = null;
      }
      
      this.session = null;
    });

    // Handle mute/unmute events
    session.on('muted', () => {
      console.log('Call muted');
    });

    session.on('unmuted', () => {
      console.log('Call unmuted');
    });

    // New handlers for additional states
    session.on('reinvite', () => {
      console.log('Received re-INVITE');
    });
    
    session.on('update', () => {
      console.log('Received UPDATE');
    });
    
    session.on('refer', () => {
      console.log('Received REFER');
    });
    
    session.on('replaces', () => {
      console.log('Received REPLACES');
    });
    
    session.on('sdp', (data: any) => {
      console.log('SDP handler', data.type);
      // Log SDP untuk debugging
      console.debug('SDP:', data.sdp);
    });

    // Handle call transfer
    session.on('transferability', () => {
      console.log('Transferability changed');
    });
  }

  // Shutdown service dengan cleanup lengkap
  shutdown() {
    console.log('Shutting down KamailioService');
    
    // Stop all media
    if (this.mediaState.localStream) {
      this.mediaState.localStream.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track: ${track.label}`);
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
      if (this.session && !this.session.isEnded()) {
        this.session.terminate();
      }
      this.ua.stop();
      this.ua = null;
    }
    
    // Reset media state
    this.mediaState = {
      localStream: null,
      remoteStream: null,
      audioEnabled: true,
      videoEnabled: true,
      speakerEnabled: false
    };
    
    console.log('KamailioService shutdown complete');
  }
}

// Export as singleton
export const kamailioService = new KamailioService();