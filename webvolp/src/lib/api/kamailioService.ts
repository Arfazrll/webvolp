// src/lib/api/kamailioService.ts - Perbaikan untuk video call

import * as JsSIP from 'jssip';
import { KamailioConfig, KamailioCredentials, CallType, CallStatus, MediaStreamState } from '../../app/types';
import { toast } from 'react-toastify';

// Fungsi untuk memprioritaskan codec video tertentu untuk meningkatkan kompatibilitas
function preferCodec(sdp: string, codecName: string, codecType: 'audio' | 'video'): string {
  try {
    const sections = sdp.split('\r\nm=');
    const header = sections[0];
    const rest = sections.slice(1);
    
    const mediaSection = rest.find(section => section.startsWith(codecType));
    if (!mediaSection) return sdp;
    
    const lines = mediaSection.split('\r\n');
    const formatLine = lines.find(line => line.startsWith('a=rtpmap:') && line.includes(codecName));
    if (!formatLine) return sdp;
    
    const codec = formatLine.split(':')[1].split(' ')[0];
    
    // Reorder payload types to prefer selected codec
    const formatLine0 = lines.find(line => line.startsWith('m='));
    if (!formatLine0) return sdp;
    
    const parts = formatLine0.split(' ');
    const payloadTypes = parts.slice(3);
    
    // Remove current codec and put it first
    const index = payloadTypes.indexOf(codec);
    if (index === -1) return sdp;
    
    payloadTypes.splice(index, 1);
    payloadTypes.unshift(codec);
    
    // Update the m= line
    parts.splice(3, parts.length - 3, ...payloadTypes);
    lines[0] = parts.join(' ');
    
    // Rebuild the section
    const newMediaSection = lines.join('\r\n');
    
    // Rebuild the SDP
    const newSections = rest.map(section => 
      section.startsWith(codecType) ? newMediaSection : section
    );
    
    return `${header}\r\nm=${newSections.join('\r\nm=')}`;
  } catch (error) {
    console.error('Error preferring codec:', error);
    return sdp; // Return original SDP if something went wrong
  }
}

// Fungsi untuk meningkatkan bandwidth untuk video
function increaseBandwidth(sdp: string): string {
  try {
    // Tambahkan b=AS:2000 ke semua bagian video untuk meningkatkan kualitas
    const sections = sdp.split('\r\nm=');
    const header = sections[0];
    const rest = sections.slice(1);
    
    const newSections = rest.map(section => {
      if (section.startsWith('video')) {
        const lines = section.split('\r\n');
        
        // Cek apakah sudah ada b=AS:
        const hasBandwidth = lines.some(line => line.startsWith('b=AS:'));
        
        if (!hasBandwidth) {
          // Tambahkan setelah baris c=
          const cLineIndex = lines.findIndex(line => line.startsWith('c='));
          if (cLineIndex !== -1) {
            lines.splice(cLineIndex + 1, 0, 'b=AS:2000'); // 2 Mbps
          } else {
            // Jika tidak ada c=, tambahkan di awal
            lines.unshift('b=AS:2000');
          }
        }
        
        return lines.join('\r\n');
      }
      return section;
    });
    
    return `${header}\r\nm=${newSections.join('\r\nm=')}`;
  } catch (error) {
    console.error('Error increasing bandwidth:', error);
    return sdp; // Return original SDP if something went wrong
  }
}

// Logger untuk debugging WebRTC
const logWebRTC = (message: string, data?: any) => {
  const timestamp = new Date().toISOString().substr(11, 12);
  console.log(`[WebRTC ${timestamp}] ${message}`, data || '');
};

class KamailioService {
  private ua: any = null;
  private session: any = null;
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
    // Default konfigurasi (seharusnya diambil dari environment variables)
    this.config = {
      domain: process.env.NEXT_PUBLIC_KAMAILIO_DOMAIN || 'voip-server.example.com',
      port: Number(process.env.NEXT_PUBLIC_KAMAILIO_PORT) || 8088,
      websocket: process.env.NEXT_PUBLIC_KAMAILIO_WS || 'wss://voip-server.example.com:8088/ws',
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] },
        // Tambahkan TURN server jika tersedia untuk melewati NAT/firewall
        { urls: 'turn:numb.viagenie.ca', username: 'webrtc@live.com', credential: 'muazkh' }
      ]
    };

    logWebRTC('KamailioService initialized with config', {
      domain: this.config.domain,
      port: this.config.port,
      websocket: this.config.websocket,
      iceServers: this.config.iceServers.length
    });
  }

  // Dapatkan status koneksi saat ini
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
      
      // Deteksi WebRTC support
      if (!window.RTCPeerConnection) {
        throw new Error('Browser tidak mendukung WebRTC. Gunakan Chrome, Firefox, atau Edge terbaru.');
      }
      
      // Deteksi getUserMedia support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera/mikrofon. Gunakan browser yang lebih baru.');
      }
  
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
        register_expires: 300, // 5 menit
        session_timers: true,
        use_preloaded_route: false,
        ...debug
      };

      logWebRTC('Creating JsSIP User Agent with config', {
        uri: configuration.uri,
        register_expires: configuration.register_expires,
        session_timers: configuration.session_timers
      });

      // Inisialisasi UA (User Agent)
      this.ua = new JsSIP.UA(configuration);

      // Register event handlers
      this.ua.on('connected', () => {
        logWebRTC('Connected to SIP WebSocket');
      });
      
      this.ua.on('disconnected', () => {
        logWebRTC('Disconnected from SIP WebSocket');
        
        // Jika terputus saat panggilan aktif, kirim status failed
        if (this.session && this.session.isEstablished && this.session.isEstablished()) {
          this.onCallStatusChange('failed');
          this.onConnectionChange(false);
        }
      });
      
      this.ua.on('registered', () => {
        logWebRTC('Registered with SIP server');
      });
      
      this.ua.on('unregistered', () => {
        logWebRTC('Unregistered from SIP server');
      });
      
      this.ua.on('registrationFailed', (cause: any) => {
        logWebRTC('Registration failed', cause);
      });

      // Handle incoming calls
      this.ua.on('newRTCSession', (event: any) => {
        logWebRTC('New RTC Session received', {
          direction: event.session.direction,
          hasRequest: !!event.session.request,
          hasBody: event.session.request ? !!event.session.request.body : false
        });
        
        const session = event.session;
        
        if (session.direction === 'incoming') {
          // Tentukan tipe panggilan berdasarkan SDP
          const sdpBody = session.request?.body || '';
          const hasVideo = sdpBody.indexOf('m=video') > -1;
          const callType: CallType = hasVideo ? 'video' : 'audio';
          
          logWebRTC(`Incoming ${callType} call detected from SDP`, { hasVideo });
          
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
      logWebRTC('JsSIP User Agent started');
      this.isInitializing = false;
      return true;
    } catch (error) {
      logWebRTC('Error initializing JsSIP', error);
      this.isInitializing = false;
      return false;
    }
  }

  // Metode untuk mengatur elemen video
  setVideoElements(localVideo: HTMLVideoElement | null, remoteVideo: HTMLVideoElement | null) {
    logWebRTC('Setting video elements', { 
      localVideo: localVideo ? `id=${localVideo.id || 'unset'}` : 'null', 
      remoteVideo: remoteVideo ? `id=${remoteVideo.id || 'unset'}` : 'null' 
    });
    
    this.localVideoElement = localVideo;
    this.remoteVideoElement = remoteVideo;
    
    // Konfigurasi video elements dengan atribut yang benar
    if (this.localVideoElement) {
      this.localVideoElement.autoplay = true;
      this.localVideoElement.muted = true;
      this.localVideoElement.playsInline = true;
    }
    
    if (this.remoteVideoElement) {
      this.remoteVideoElement.autoplay = true;
      this.remoteVideoElement.playsInline = true;
    }
    
    // Jika session sudah aktif, perbarui elemen video - gunakan null untuk menghindari undefined
    if (this.session && this.session.isEstablished && typeof this.session.isEstablished === 'function' && 
        this.session.isEstablished() && this.mediaState.remoteStream) {
      if (this.remoteVideoElement) {
        logWebRTC('Attaching existing remote stream to video element');
        this.remoteVideoElement.srcObject = this.mediaState.remoteStream || null;
      }
    }
    
    if (this.mediaState.localStream && this.localVideoElement) {
      logWebRTC('Attaching existing local stream to video element');
      this.localVideoElement.srcObject = this.mediaState.localStream || null;
    }
    
    this.isVideoCallReady = !!(this.localVideoElement && this.remoteVideoElement);
    logWebRTC('Video call readiness set to', this.isVideoCallReady);
  }

  // Upaya untuk menyegarkan stream video saat bermasalah
  refreshVideoStream() {
    logWebRTC('Attempting to refresh video stream');
    
    if (!this.session || !this.session.isEstablished || !this.session.isEstablished()) {
      logWebRTC('No active session to refresh');
      return false;
    }
    
    if (this.retryCount >= this.maxRetries) {
      logWebRTC('Max retries reached, giving up');
      return false;
    }
    
    this.retryCount++;
    
    try {
      // Coba renegosiasi koneksi
      if (this.session.renegotiate) {
        logWebRTC(`Renegotiating session (attempt ${this.retryCount} of ${this.maxRetries})`);
        
        const options = {
          mediaConstraints: {
            audio: true,
            video: true
          }
        };
        
        this.session.renegotiate(options, 
          () => {
            logWebRTC('Renegotiation successful');
            this.retryCount = 0; // Reset retry counter on success
          },
          (error: any) => {
            logWebRTC('Renegotiation failed', error);
          }
        );
        return true;
      }
      
      return false;
    } catch (error) {
      logWebRTC('Error refreshing video stream', error);
      return false;
    }
  }

  // Implementasi yang lebih baik untuk setupMediaListeners
  private setupMediaListeners(session: any) {
    if (!session.connection) {
      logWebRTC('No RTCPeerConnection available for media listeners');
      return;
    }
    
    logWebRTC('Setting up media listeners for RTCPeerConnection');

    // Simpan referensi ke RTCPeerConnection untuk debugging
    const pc = session.connection;
    logWebRTC('RTCPeerConnection config:', pc.getConfiguration());

    // Handle remote tracks
    pc.ontrack = (event: any) => {
      logWebRTC('Remote track received', {
        kind: event.track.kind,
        label: event.track.label,
        enabled: event.track.enabled,
        muted: event.track.muted,
        readyState: event.track.readyState,
        hasStreams: !!event.streams && event.streams.length > 0
      });
      
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        
        logWebRTC('Got remote stream with tracks', 
          stream.getTracks().map((t: any) => ({
            kind: t.kind,
            label: t.label,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState
          }))
        );
        
        // Simpan remote stream
        this.mediaState.remoteStream = stream;
        
        // Tambahkan event listener untuk track ended
        event.track.onended = () => {
          logWebRTC(`Remote ${event.track.kind} track ended`);
          // Beritahu UI bahwa koneksi bermasalah
          this.onConnectionChange(false);
        };
        
        // Tambahkan event listener untuk track mute/unmute
        event.track.onmute = () => {
          logWebRTC(`Remote ${event.track.kind} track muted`);
        };
        
        event.track.onunmute = () => {
          logWebRTC(`Remote ${event.track.kind} track unmuted`);
        };
        
        // Verifikasi bahwa track aktif
        if (!event.track.enabled) {
          logWebRTC(`Remote ${event.track.kind} track is disabled, enabling it`);
          event.track.enabled = true;
        }
        
        // Siapkan video element
        if (this.remoteVideoElement) {
          logWebRTC('Setting remote stream to video element');
          
          // Gunakan null sebagai fallback untuk menghindari undefined
          this.remoteVideoElement.srcObject = this.mediaState.remoteStream || null;
          
          // Mainkan video dengan penanganan error yang lebih baik
          this.remoteVideoElement.play()
            .then(() => {
              logWebRTC('Remote video playback started');
              // Beritahu UI bahwa video sudah terhubung
              this.onConnectionChange(true);
            })
            .catch(err => {
              logWebRTC('Failed to play remote video', err);
              
              // Coba lagi dengan user interaction atau autoplay muted
              logWebRTC('Attempting to play muted as fallback');
              if (this.remoteVideoElement) {
                this.remoteVideoElement.muted = true;
                this.remoteVideoElement.play()
                  .then(() => {
                    logWebRTC('Remote video playback started (muted)');
                    // Beritahu UI bahwa video sudah terhubung meski muted
                    this.onConnectionChange(true);
                  })
                  .catch(err2 => {
                    logWebRTC('Still failed to play remote video even muted', err2);
                    // Beritahu UI bahwa koneksi bermasalah
                    this.onConnectionChange(false);
                  });
              }
            });
        } else {
          logWebRTC('No remote video element available to display remote stream');
          // Beritahu UI bahwa koneksi bermasalah karena tidak ada elemen video
          this.onConnectionChange(false);
        }
      } else {
        logWebRTC('Received track but no stream available');
        // Beritahu UI bahwa koneksi bermasalah
        this.onConnectionChange(false);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      this.connectionState = state;
      logWebRTC('Connection state changed', state);
      
      // Beritahu perubahan state koneksi
      const isConnected = state === 'connected' || state === 'completed';
      this.onConnectionChange(isConnected);
      
      // Jika koneksi terputus, coba sambungkan kembali atau akhiri panggilan
      if (state === 'failed') {
        logWebRTC('Connection failed, ending call');
        this.onCallStatusChange('failed');
        this.endCall();
      } else if (state === 'disconnected') {
        logWebRTC('Connection disconnected, attempting to reconnect');
        // Coba reconnect, tapi jika terlalu lama, akhiri panggilan
        setTimeout(() => {
          if (pc.connectionState === 'disconnected') {
            logWebRTC('Still disconnected after timeout, ending call');
            this.onCallStatusChange('failed');
            this.endCall();
          }
        }, 10000); // 10 detik timeout
      }
    };
    
    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      logWebRTC('ICE connection state changed', state);
      
      // Jika koneksi ICE terputus
      if (state === 'disconnected' || state === 'failed') {
        logWebRTC('ICE connection failed or disconnected');
        
        // Beritahu UI bahwa koneksi bermasalah
        this.onConnectionChange(false);
        
        // Jika gagal selama lebih dari 5 detik, akhiri panggilan
        if (state === 'failed') {
          logWebRTC('ICE connection failed permanently, ending call');
          this.onCallStatusChange('failed');
          setTimeout(() => this.endCall(), 5000);
        }
      } else if (state === 'connected' || state === 'completed') {
        // Beritahu UI bahwa koneksi berjalan baik
        this.onConnectionChange(true);
      }
    };
    
    // Handle ICE gathering state
    pc.onicegatheringstatechange = () => {
      logWebRTC('ICE gathering state', pc.iceGatheringState);
    };
    
    // Log ICE candidates untuk debug
    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        logWebRTC('New ICE candidate', {
          candidate: event.candidate.candidate?.substr(0, 50) + '...',
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        });
      } else {
        logWebRTC('All ICE candidates gathered');
      }
    };
    
    // Log data channel events if they occur
    pc.ondatachannel = (event: any) => {
      logWebRTC('Data channel received', event.channel.label);
    };
  }

  // Implementasi yang lebih baik untuk getUserMedia
  private async getUserMedia(isVideo: boolean): Promise<MediaStream | null> {
    try {
      // Batasan media yang lebih adaptif untuk video
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 640, min: 320 },
        height: { ideal: 480, min: 240 },
        frameRate: { ideal: 24, min: 15 }
      };
      
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: isVideo ? videoConstraints : false
      };
      
      logWebRTC('Requesting user media with constraints', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaState.localStream = stream;
      
      logWebRTC('Got local stream with tracks', 
        stream.getTracks().map(t => ({
          kind: t.kind,
          label: t.label,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState
        }))
      );
      
      // Tampilkan di local video element jika tersedia
      if (this.localVideoElement && stream) {
        logWebRTC('Setting local stream to video element');
        // Gunakan null sebagai fallback untuk menghindari undefined
        this.localVideoElement.srcObject = stream || null;
        this.localVideoElement.muted = true; // Mute lokal untuk mencegah feedback
        
        try {
          await this.localVideoElement.play();
          logWebRTC('Local video playback started');
        } catch (err) {
          logWebRTC('Failed to play local video', err);
        }
      } else if (isVideo) {
        logWebRTC('No local video element available for preview');
      }
      
      return stream;
    } catch (error) {
      logWebRTC('Error getting user media', error);
      return null;
    }
  }

  // Mute/unmute audio
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

  // Enable/disable video
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

  // Toggle speaker
  toggleSpeaker(enabled: boolean) {
    logWebRTC('Toggling speaker', enabled);
    this.mediaState.speakerEnabled = enabled;
    
    // Implementasi untuk audio output device jika tersedia
    if (this.remoteVideoElement && 'setSinkId' in this.remoteVideoElement) {
      // Catatan: setSinkId memerlukan izin pengguna
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
      
      // Fallback - adjust volume dengan cast eksplisit untuk menghindari error typescript
      if (this.remoteVideoElement) {
        const videoElement = this.remoteVideoElement as HTMLVideoElement;
        videoElement.volume = enabled ? 1.0 : 0.5;
        logWebRTC(`Adjusted volume to ${enabled ? '100%' : '50%'} as fallback`);
      }
    }
  }

  // Implementasi yang lebih baik untuk makeCall
  async makeCall(phoneNumber: string, type: CallType = 'audio') {
    if (!this.ua) {
      throw new Error('User agent not initialized. Call initialize() first.');
    }

    logWebRTC(`Initiating ${type} call to ${phoneNumber}`);
    
    try {
      // Reset retry counter
      this.retryCount = 0;
      
      // Reset connection state
      this.connectionState = 'new';
      
      // Checks for video call
      if (type === 'video' && !this.isVideoCallReady) {
        logWebRTC('Video elements not ready for video call');
        if (!this.localVideoElement || !this.remoteVideoElement) {
          throw new Error('Video elements belum siap. Silakan coba lagi.');
        }
      }
      
      // Dapatkan media stream untuk audio/video
      const stream = await this.getUserMedia(type === 'video');
      
      if (!stream) {
        const errorMsg = `Failed to get ${type} stream. Periksa izin kamera dan mikrofon.`;
        logWebRTC(errorMsg);
        throw new Error(errorMsg);
      }

      // Konfigurasi yang lebih baik untuk options
      const options = {
        mediaConstraints: {
          audio: true,
          video: type === 'video'
        },
        pcConfig: {
          iceServers: this.config.iceServers,
          iceTransportPolicy: 'all',
          bundlePolicy: 'balanced',
          rtcpMuxPolicy: 'require',
          sdpSemantics: 'unified-plan'
        },
        mediaStream: stream, // Tambahkan stream langsung ke options
        rtcOfferConstraints: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === 'video'
        }
      };

      logWebRTC('Call options', JSON.stringify(options, (key, value) => {
        // Jangan log MediaStream sebagai JSON
        if (key === 'mediaStream' && value instanceof MediaStream) return '[MediaStream]';
        return value;
      }));
      
      // Siapkan target URI
      const target = `sip:${phoneNumber}@${this.config.domain}`;
      
      // Tambahkan metode extraHeaders untuk memastikan bahwa tipe panggilan diketahui
      const extraHeaders = type === 'video' ? 
        ['X-Call-Type: video'] : 
        ['X-Call-Type: audio'];
      
      // Buat panggilan dengan extraHeaders
      const callSession = this.ua.call(target, {
        ...options,
        extraHeaders
      });
      
      // Simpan session panggilan
      this.session = callSession;
      
      // Setup call listeners
      if (this.session) {
        this.setupCallListeners(this.session);
        
        // Setup media listeners setelah session dibuat
        if (this.session.connection) {
          this.setupMediaListeners(this.session);
        } else {
          logWebRTC('No RTCPeerConnection available yet');
          
          // Tambahkan listener untuk peerconnection event
          this.session.on('peerconnection', (data: any) => {
            logWebRTC('Peer connection created', {
              peerconnection: !!data.peerconnection
            });
            if (data && data.peerconnection) {
              this.setupMediaListeners(this.session);
            }
          });
        }
      } else {
        logWebRTC('Failed to create call session');
        throw new Error('Gagal membuat sesi panggilan');
      }
      
      return true;
    } catch (error) {
      logWebRTC('Error making call', error);
      
      // Cleanup stream jika panggilan gagal
      if (this.mediaState.localStream) {
        this.mediaState.localStream.getTracks().forEach(track => track.stop());
        this.mediaState.localStream = null;
      }
      
      throw error;
    }
  }

  // Implementasi yang lebih baik untuk answerCall
  async answerCall(type: CallType = 'audio') {
    if (!this.session || this.session.direction !== 'incoming') {
      logWebRTC('No incoming call to answer');
      return false;
    }
    
    logWebRTC(`Answering call as ${type}`);
    
    try {
      // Reset retry counter
      this.retryCount = 0;
      
      // Reset connection state
      this.connectionState = 'new';
      
      // Validasi video call readiness
      if (type === 'video' && !this.isVideoCallReady) {
        logWebRTC('Video elements not ready for answering video call');
        if (!this.localVideoElement || !this.remoteVideoElement) {
          throw new Error('Video elements belum siap. Silakan coba lagi.');
        }
      }
      
      // Dapatkan media stream untuk audio/video
      const stream = await this.getUserMedia(type === 'video');
      
      if (!stream) {
        logWebRTC('Failed to get user media for answering call');
        return false;
      }

      // Konfigurasi untuk menjawab panggilan
      const options = {
        mediaConstraints: {
          audio: true,
          video: type === 'video'
        },
        pcConfig: {
          iceServers: this.config.iceServers,
          iceTransportPolicy: 'all',
          bundlePolicy: 'balanced',
          rtcpMuxPolicy: 'require',
          sdpSemantics: 'unified-plan'
        },
        mediaStream: stream, // Tambahkan stream langsung ke options
        rtcAnswerConstraints: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === 'video'
        }
      };
      
      logWebRTC('Answer options', JSON.stringify(options, (key, value) => {
        // Jangan log MediaStream sebagai JSON
        if (key === 'mediaStream' && value instanceof MediaStream) return '[MediaStream]';
        return value;
      }));
      
      // Setup media listeners sebelum jawaban
      if (this.session.connection) {
        this.setupMediaListeners(this.session);
      } else {
        logWebRTC('No RTCPeerConnection available yet for incoming call');
        
        // Tambahkan listener untuk peerconnection event
        this.session.on('peerconnection', (data: any) => {
          logWebRTC('Peer connection created for incoming call', {
            peerconnection: !!data.peerconnection
          });
          if (data && data.peerconnection) {
            this.setupMediaListeners(this.session);
          }
        });
      }
      
      // Jawab panggilan
      this.session.answer(options);
      logWebRTC('Call answered');
      
      return true;
    } catch (error) {
      logWebRTC('Error answering call', error);
      return false;
    }
  }

  // Implementasi yang lebih baik untuk endCall
  endCall() {
    logWebRTC('Ending call');
    
    // Reset connection state
    this.connectionState = 'closed';
    
    // Stop media streams
    if (this.mediaState.localStream) {
      logWebRTC('Stopping local media tracks');
      this.mediaState.localStream.getTracks().forEach(track => {
        logWebRTC(`Stopping ${track.kind} track: ${track.label}`);
        track.stop();
      });
      this.mediaState.localStream = null;
    }
    
    // Clear video elements
    if (this.localVideoElement && this.localVideoElement.srcObject) {
      logWebRTC('Clearing local video element');
      this.localVideoElement.srcObject = null;
    }
    
    if (this.remoteVideoElement && this.remoteVideoElement.srcObject) {
      logWebRTC('Clearing remote video element');
      this.remoteVideoElement.srcObject = null;
    }
    
    // Terminate session
    if (this.session) {
      logWebRTC('Terminating SIP session');
      try {
        if (this.session.isEnded && typeof this.session.isEnded === 'function' && !this.session.isEnded()) {
          this.session.terminate();
        }
      } catch (e) {
        logWebRTC('Error terminating session', e);
      }
      this.session = null;
    } else {
      logWebRTC('No active session to terminate');
    }
    
    // Reset media state
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

  // Implementasi yang lebih baik untuk call listeners
  private setupCallListeners(session: any) {
    if (!session) {
      logWebRTC('No session to setup listeners for');
      return;
    }

    logWebRTC('Setting up call listeners for session');

    session.on('connecting', () => {
      logWebRTC('Call connecting');
      this.onCallStatusChange('connecting');
    });

    session.on('progress', () => {
      logWebRTC('Call in progress (ringing)');
      this.onCallStatusChange('ringing');
    });

    session.on('accepted', () => {
      logWebRTC('Call accepted');
      this.onCallStatusChange('active');
    });

    session.on('confirmed', () => {
      logWebRTC('Call confirmed (answered)');
      this.onCallStatusChange('active');
    });

    session.on('ended', () => {
      logWebRTC('Call ended normally');
      this.onCallStatusChange('ended');
      
      // Beritahu UI bahwa koneksi berakhir
      this.onConnectionChange(false);
      
      // Cleanup media
      if (this.mediaState.localStream) {
        this.mediaState.localStream.getTracks().forEach(track => track.stop());
        this.mediaState.localStream = null;
      }
      
      this.session = null;
    });

    session.on('failed', (data: any) => {
      logWebRTC('Call failed', data?.cause || 'unknown cause');
      this.onCallStatusChange('failed');
      
      // Beritahu UI bahwa koneksi gagal
      this.onConnectionChange(false);
      
      // Cleanup media
      if (this.mediaState.localStream) {
        this.mediaState.localStream.getTracks().forEach(track => track.stop());
        this.mediaState.localStream = null;
      }
      
      this.session = null;
    });

    // Handle mute/unmute events
    session.on('muted', () => {
      logWebRTC('Call muted');
    });

    session.on('unmuted', () => {
      logWebRTC('Call unmuted');
    });

    // New handlers for additional states
    session.on('reinvite', (data: any) => {
      logWebRTC('Received re-INVITE', {
        hasRequest: !!data?.request,
        hasBody: data?.request ? !!data.request.body : false
      });
      
      // Cek apakah reinvite untuk video
      if (data && data.request && data.request.body && 
          data.request.body.indexOf('m=video') > -1) {
        logWebRTC('Video re-INVITE detected');
      }
    });
    
    session.on('update', () => {
      logWebRTC('Received UPDATE');
    });
    
    session.on('sdp', (data: any) => {
      logWebRTC('SDP handler', data?.type || 'unknown');
      
      // Log SDP untuk debugging
      if (data && data.sdp) {
        // Cek apakah SDP mengandung video
        const hasVideo = data.sdp.indexOf('m=video') > -1;
        logWebRTC(`SDP ${hasVideo ? 'contains' : 'does not contain'} video section`);
        
        // Manipulasi SDP untuk kompatibilitas codec video yang lebih baik
        if (hasVideo) {
          if (data.type === 'offer' || data.type === 'answer') {
            // Prefer common video codecs for better compatibility
            let modifiedSdp = data.sdp;
            
            // Try VP8 first (widely supported)
            if (modifiedSdp.includes('VP8')) {
              modifiedSdp = preferCodec(modifiedSdp, 'VP8', 'video');
              logWebRTC('Modified SDP to prefer VP8 codec');
            }
            
            // If H.264 is available, also give it high priority
            if (modifiedSdp.includes('H264')) {
              modifiedSdp = preferCodec(modifiedSdp, 'H264', 'video');
              logWebRTC('Modified SDP to prefer H.264 codec');
            }
            
            // Increase bandwidth for better video quality
            modifiedSdp = increaseBandwidth(modifiedSdp);
            logWebRTC('Modified SDP to increase bandwidth');
            
            // Update SDP
            data.sdp = modifiedSdp;
          }
        }
      }
    });

    // Additional logging untuk membantu debug
    session.on('icecandidate', (event: any) => {
      logWebRTC('ICE candidate event', {
        candidate: event.candidate?.candidate?.substring(0, 30) + '...',
        sdpMid: event.candidate?.sdpMid,
        sdpMLineIndex: event.candidate?.sdpMLineIndex
      });
    });
    
    session.on('getusermediafailed', (error: any) => {
      logWebRTC('getUserMedia failed', error);
      toast.error('Gagal mengakses kamera/mikrofon. Periksa izin browser Anda.');
    });
    
    session.on('peerconnection:createofferfailed', (error: any) => {
      logWebRTC('Create offer failed', error);
    });
    
    session.on('peerconnection:createanswerfailed', (error: any) => {
      logWebRTC('Create answer failed', error);
    });
    
    session.on('peerconnection:setlocaldescriptionfailed', (error: any) => {
      logWebRTC('Set local description failed', error);
    });
    
    session.on('peerconnection:setremotedescriptionfailed', (error: any) => {
      logWebRTC('Set remote description failed', error);
    });
  }

  // Shutdown service dengan cleanup lengkap
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
    
    // Reset media state
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

// Export as singleton
export const kamailioService = new KamailioService();