import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MailMancerState {
  // OpenAI API key
  apiKey: string;
  setApiKey: (key: string) => void;
  
  // User preferences
  preferences: {
    defaultTone: 'casual' | 'professional' | 'friendly' | 'concise';
  };
  setDefaultTone: (tone: 'casual' | 'professional' | 'friendly' | 'concise') => void;
  
  // Modal state
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  
  // Current generation
  prompt: string;
  setPrompt: (prompt: string) => void;
  tone: 'casual' | 'professional' | 'friendly' | 'concise';
  setTone: (tone: 'casual' | 'professional' | 'friendly' | 'concise') => void;
  generatedText: string;
  setGeneratedText: (text: string) => void;
  
  // Generation status
  status: 'idle' | 'generating' | 'success' | 'error';
  setStatus: (status: 'idle' | 'generating' | 'success' | 'error') => void;
  error: string | null;
  setError: (error: string | null) => void;
}

// Create store with persistence
export const useStore = create<MailMancerState>()(
  persist(
    (set) => ({
      // OpenAI API key
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      
      // User preferences
      preferences: {
        defaultTone: 'professional',
      },
      setDefaultTone: (tone) => set((state) => ({
        preferences: {
          ...state.preferences,
          defaultTone: tone
        },
        tone: tone // Also update current tone when default changes
      })),
      
      // Modal state
      modalVisible: false,
      setModalVisible: (visible) => set({ modalVisible: visible }),
      
      // Current generation
      prompt: '',
      setPrompt: (prompt) => set({ prompt }),
      tone: 'professional',
      setTone: (tone) => set({ tone }),
      generatedText: '',
      setGeneratedText: (generatedText) => set({ generatedText }),
      
      // Generation status
      status: 'idle',
      setStatus: (status) => set({ status }),
      error: null,
      setError: (error) => set({ error }),
    }),
    {
      name: 'mailmancer-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        preferences: state.preferences,
      }),
    }
  )
);

export default useStore;
