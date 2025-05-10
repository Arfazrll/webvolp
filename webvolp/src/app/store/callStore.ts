import { create } from 'zustand';
import { Call, CallState, CallStatus, CallType } from '../types';

// Mengganti uuid karena tidak bisa ditemukan, gunakan Date.now() untuk ID yang unik
export const useCallStore = create<CallState>((set, get) => ({
  currentCall: null,
  callHistory: [],
  isDialPadOpen: false,

  makeCall: (phoneNumber: string, type: CallType) => {
    const newCall: Call = {
      id: Date.now().toString(), // Menggunakan timestamp sebagai id unik
      type,
      phoneNumber,
      direction: 'outgoing',
      status: 'calling',
      startTime: new Date(),
    };

    set({ currentCall: newCall, isDialPadOpen: false });

    // Add to call history
    set((state) => ({
      callHistory: [newCall, ...state.callHistory]
    }));

    // Simulate call ringing after 1 second
    setTimeout(() => {
      if (get().currentCall?.id === newCall.id) {
        get().updateCallStatus('ringing');
      }
    }, 1000);

    // Simulate call connecting after 3 seconds
    setTimeout(() => {
      if (get().currentCall?.id === newCall.id) {
        get().updateCallStatus('active');
      }
    }, 3000);
  },

  endCall: () => {
    const { currentCall } = get();
    
    if (currentCall) {
      const endTime = new Date();
      const startTime = currentCall.startTime || new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      const updatedCall: Call = {
        ...currentCall,
        status: 'ended',
        result: 'completed',
        endTime,
        duration,
      };

      // Update call in history
      set((state) => ({
        currentCall: null,
        callHistory: state.callHistory.map(call => 
          call.id === updatedCall.id ? updatedCall : call
        )
      }));
    }
  },

  answerCall: () => {
    const { currentCall } = get();
    
    if (currentCall && currentCall.direction === 'incoming') {
      set((state) => ({
        currentCall: {
          ...state.currentCall!,
          status: 'active',
          startTime: new Date(),
        }
      }));
    }
  },

  rejectCall: () => {
    const { currentCall } = get();
    
    if (currentCall && currentCall.direction === 'incoming') {
      const updatedCall: Call = {
        ...currentCall,
        status: 'ended',
        result: 'rejected',
        endTime: new Date(),
      };

      // Update call in history
      set((state) => ({
        currentCall: null,
        callHistory: state.callHistory.map(call => 
          call.id === updatedCall.id ? updatedCall : call
        )
      }));
    }
  },

  toggleDialPad: () => {
    set((state) => ({ isDialPadOpen: !state.isDialPadOpen }));
  },

  updateCallStatus: (status: CallStatus) => {
    set((state) => ({
      currentCall: state.currentCall ? {
        ...state.currentCall,
        status,
      } : null,
      // Update this call's status in history as well
      callHistory: state.currentCall ? state.callHistory.map(call => 
        call.id === state.currentCall?.id ? { ...call, status } : call
      ) : state.callHistory
    }));
  },
}));