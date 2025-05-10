import * as JsSIP from 'jssip';
import { KamailioConfig, KamailioCredentials, CallType, CallStatus, MediaStreamState } from '../../app/types';

// Interface untuk event newRTCSession untuk menghindari tipe implisit any
interface RTCSessionEvent {
  session: unknown;
  originator?: string;
  request?: unknown;
}

// Interface untuk session JsSIP yang lebih umum
interface JsSIPSession {
  direction: string;
  remote_identity: {
    uri: {
      user: string;
    };
  };
  request: {
    body: string;
  };
  terminate: () => void;
  answer: (options: JsSIPSessionOptions) => void;
  on: (event: string, callback: () => void) => void;
  connection?: RTCPeerConnection;
  addStream?: (stream: MediaStream) => void;
}

interface JsSIPSessionOptions {
  mediaConstraints: {
    audio: boolean;
    video: boolean;
  };
  pcConfig: {
    iceServers: RTCIceServer[];
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
    // Default config (should be loaded from environment variables)
    this.config = {
      domain: process.env.NEXT_PUBLIC_KAMAILIO_DOMAIN || 'voip-server.example.com',
      port: Number(process.env.NEXT_PUBLIC_KAMAILIO_PORT) || 8088,
      websocket: process.env.NEXT_PUBLIC_KAMAILIO_WS || 'wss://voip-server.example.com:8088/ws',
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] }
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

    // Configure JsSIP
    const socket = new JsSIP.WebSocketInterface(this.config.websocket);
    
    const configuration = {
      sockets: [socket],
      uri: `sip:${credentials.phoneNumber}@${this.config.domain}`,
      password: credentials.password,
      display_name: credentials.phoneNumber,
    };

    this.ua = new JsSIP.UA(configuration);

    // Register callbacks menggunakan callback type yang sama dengan JsSIP
    this.ua.on('connected', () => console.log('Connected to WebSocket'));
    this.ua.on('disconnected', () => console.log('Disconnected from WebSocket'));
    this.ua.on('registered', () => console.log('Registered with SIP server'));
    this.ua.on('unregistered', () => console.log('Unregistered from SIP server'));
    
    // Gunakan fungsi tanpa tipe parameter untuk menghindari tipe error
    this.ua.on('registrationFailed', () => {
      console.error('Registration failed');
    });

    // Handle incoming calls dengan tipe parameter yang eksplisit
    this.ua.on('newRTCSession', (event: RTCSessionEvent) => {
      if (!event.session) {
        return;
      }
      
      // Gunakan type assertion untuk session
      const session = event.session as JsSIPSession;
      
      if (session.direction === 'incoming') {
        // Determine call type based on SDP
        const callType: CallType = 
          session.request && session.request.body && 
          session.request.body.indexOf('m=video') > -1 ? 'video' : 'audio';
        
        // Get caller's number
        const from = session.remote_identity?.uri?.user || '';
        
        // Notify about incoming call
        this.onIncomingCall(from, callType);
        this.session = session;
        
        // Setup call listeners
        this.setupCallListeners(session);

        // Setup media listeners for video call
        if (callType === 'video') {
          this.setupMediaListeners(session);
        }
      }
    });

    // Start the user agent
    this.ua.start();
  }

  // Set video elements for display
  setVideoElements(localVideo: HTMLVideoElement | null, remoteVideo: HTMLVideoElement | null) {
    this.localVideoElement = localVideo;
    this.remoteVideoElement = remoteVideo;
  }

  // Setup media stream and listeners for video call
  private async setupMediaListeners(session: JsSIPSession) {
    try {
      // Setup event listeners untuk RTCPeerConnection
      if (session.connection) {
        session.connection.ontrack = (event) => {
          if (event.track.kind === 'video' || event.track.kind === 'audio') {
            // Simpan remote stream
            this.mediaState.remoteStream = event.streams[0];
            
            // Tampilkan di remote video element jika tersedia
            if (this.remoteVideoElement && this.mediaState.remoteStream) {
              this.remoteVideoElement.srcObject = this.mediaState.remoteStream;
            }
          }
        };
      }
    } catch (error) {
      console.error('Error setting up media listeners:', error);
    }
  }

  // Get user media for video call
  private async getUserMedia(isVideo: boolean): Promise<MediaStream | null> {
    try {
      const constraints = {
        audio: true,
        video: isVideo
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaState.localStream = stream;
      
      // Tampilkan di local video element jika tersedia
      if (this.localVideoElement && stream) {
        this.localVideoElement.srcObject = stream;
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
        track.enabled = enabled;
      });
      this.mediaState.audioEnabled = enabled;
    }
  }

  // Enable/disable video
  toggleVideo(enabled: boolean) {
    if (this.mediaState.localStream) {
      this.mediaState.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      this.mediaState.videoEnabled = enabled;
    }
  }

  // Toggle speaker
  toggleSpeaker(enabled: boolean) {
    this.mediaState.speakerEnabled = enabled;
    
    // Implementasi actual akan bergantung pada device API
    // Untuk demo, kita hanya update state
  }

  async makeCall(phoneNumber: string, type: CallType = 'audio') {
    if (!this.ua) {
      throw new Error('User agent not initialized. Call initialize() first.');
    }

    // Dapatkan media stream untuk audio/video
    const stream = await this.getUserMedia(type === 'video');
    
    if (!stream) {
      throw new Error('Failed to get user media');
    }

    // Prepare media options
    const options: JsSIPSessionOptions = {
      mediaConstraints: {
        audio: true,
        video: type === 'video'
      },
      pcConfig: {
        iceServers: this.config.iceServers
      }
    };

    // Make the call
    const target = `sip:${phoneNumber}@${this.config.domain}`;
    
    // Type casting untuk hasil call() karena kita tau itu adalah session
    const callResult = this.ua.call(target, options);
    // @ts-expect-error JsSIP session type mismatch
    this.session = callResult;
    
    // Add stream to session if supported
    if (this.session && 'addStream' in this.session && typeof this.session.addStream === 'function') {
      try {
        this.session.addStream(stream);
      } catch (error) {
        console.error('Failed to add stream to session:', error);
      }
    }
    
    // Setup listeners
    if (this.session) {
      this.setupCallListeners(this.session);
      this.setupMediaListeners(this.session);
    }
  }

  async answerCall(type: CallType = 'audio') {
    if (!this.session || this.session.direction !== 'incoming') {
      return;
    }
    
    // Dapatkan media stream untuk audio/video
    const stream = await this.getUserMedia(type === 'video');
    
    if (!stream) {
      console.error('Failed to get user media');
      return;
    }

    const options: JsSIPSessionOptions = {
      mediaConstraints: {
        audio: true,
        video: type === 'video'
      },
      pcConfig: {
        iceServers: this.config.iceServers
      }
    };
    
    // Answer the call
    this.session.answer(options);
    
    // Add stream to session if supported
    if ('addStream' in this.session && typeof this.session.addStream === 'function') {
      try {
        this.session.addStream(stream);
      } catch (error) {
        console.error('Failed to add stream to session:', error);
      }
    }
  }

  endCall() {
    // Stop media streams
    if (this.mediaState.localStream) {
      this.mediaState.localStream.getTracks().forEach(track => track.stop());
      this.mediaState.localStream = null;
    }
    
    // Clear video elements
    if (this.localVideoElement && this.localVideoElement.srcObject) {
      this.localVideoElement.srcObject = null;
    }
    
    if (this.remoteVideoElement && this.remoteVideoElement.srcObject) {
      this.remoteVideoElement.srcObject = null;
    }
    
    // Terminate session
    if (this.session) {
      this.session.terminate();
      this.session = null;
    }
  }

  private setupCallListeners(session: JsSIPSession) {
    if (!session) return;

    session.on('connecting', () => {
      this.onCallStatusChange('connecting');
    });

    session.on('progress', () => {
      this.onCallStatusChange('ringing');
    });

    session.on('accepted', () => {
      this.onCallStatusChange('active');
    });

    session.on('ended', () => {
      this.onCallStatusChange('ended');
      
      // Cleanup media
      if (this.mediaState.localStream) {
        this.mediaState.localStream.getTracks().forEach(track => track.stop());
        this.mediaState.localStream = null;
      }
      
      this.session = null;
    });

    session.on('failed', () => {
      this.onCallStatusChange('failed');
      
      // Cleanup media
      if (this.mediaState.localStream) {
        this.mediaState.localStream.getTracks().forEach(track => track.stop());
        this.mediaState.localStream = null;
      }
      
      this.session = null;
    });
  }

  shutdown() {
    // Stop all media
    if (this.mediaState.localStream) {
      this.mediaState.localStream.getTracks().forEach(track => track.stop());
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
      if (this.session) {
        this.session.terminate();
      }
      this.ua.stop();
      this.ua = null;
    }
  }
}

// Export as singleton
export const kamailioService = new KamailioService();