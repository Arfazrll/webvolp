// User Type
export interface User {
  phoneNumber: string;
  name?: string;
  avatar?: string;
}

// Auth Types
export interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (phoneNumber: string) => Promise<void>;
  logout: () => void;
}

// Call Types
export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'active' | 'ended' | 'failed' | 'connecting';
export type CallDirection = 'outgoing' | 'incoming';
export type CallResult = 'completed' | 'missed' | 'rejected';

export interface CallDetails {
  duration?: number;
  quality?: 'good' | 'medium' | 'poor';
  networkType?: 'wifi' | 'cellular' | 'unknown';
  device?: {
    audio: {
      inputDevice?: string;
      outputDevice?: string;
    };
    video?: {
      camera?: string;
    };
  };
}

export interface Call {
  id: string;
  type: CallType;
  phoneNumber: string;
  direction: CallDirection;
  status: CallStatus;
  result?: CallResult;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  details?: CallDetails;
}

export interface CallState {
  currentCall: Call | null;
  callHistory: Call[];
  isDialPadOpen: boolean;
  makeCall: (phoneNumber: string, type: CallType) => void;
  endCall: () => void;
  answerCall: () => void;
  rejectCall: () => void;
  toggleDialPad: () => void;
  updateCallStatus: (status: CallStatus) => void;
}

// Kamailio Service Types
export interface KamailioConfig {
  domain: string;
  port: number;
  websocket: string;
  iceServers: RTCIceServer[];
}

export interface KamailioCredentials {
  phoneNumber: string;
  password: string;
}

// WebRTC Types
export interface MediaStreamState {
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  speakerEnabled: boolean;
}

// Video Call Types
export interface VideoCallOptions {
  localVideo: HTMLVideoElement | null;
  remoteVideo: HTMLVideoElement | null;
  audio: boolean;
  video: boolean;
}

// Navigation Types
export interface RouteConfig {
  path: string;
  title: string;
  icon?: React.ReactNode;
}

// Filter Types
export interface CallFilter {
  type?: CallType;
  direction?: CallDirection;
  result?: CallResult;
  startDate?: Date;
  endDate?: Date;
  minDuration?: number;
  maxDuration?: number;
  phoneNumber?: string;
}