import { create } from 'zustand';
import { Call, CallState, CallStatus, CallType } from '../types';

export const useCallStore = create<CallState>((set, get) => ({
  currentCall: null,
  callHistory: [],
  isDialPadOpen: false,

  makeCall: (phoneNumber: string, type: CallType) => {
    // TODO: Dalam implementasi sebenarnya, objek Call tidak seharusnya dibuat
    // sebelum koneksi ke backend berhasil. Ini hanya untuk keperluan UI saat ini.
    const newCall: Call = {
      id: Date.now().toString(),
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

    // TODO: Backend seharusnya mengontrol keseluruhan status panggilan
    // Tidak ada simulasi panggilan di sini
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

      // TODO: Backend seharusnya mengontrol keseluruhan status panggilan
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

      // TODO: Backend seharusnya mengontrol keseluruhan status panggilan
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

      // TODO: Backend seharusnya mengontrol keseluruhan status panggilan
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
      callHistory: state.currentCall ? state.callHistory.map(call => 
        call.id === state.currentCall?.id ? { ...call, status } : call
      ) : state.callHistory
    }));
  },
}));