import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { generateText } from '../utils/api';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  onInsert: (text: string) => void;
}

const EmailModal = ({ isOpen, onClose, initialPrompt = '', onInsert }: EmailModalProps) => {
  const { 
    apiKey, 
    preferences,
    status, setStatus,
    error, setError
  } = useStore();
  
  const [prompt, setPrompt] = useState(initialPrompt);
  const [tone, setTone] = useState<'casual' | 'professional' | 'friendly' | 'concise'>(
    preferences.defaultTone
  );
  const [generatedText, setGeneratedText] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt);
      setTone(preferences.defaultTone);
      setGeneratedText('');
      setError(null);
      setStatus('idle');
    }
  }, [isOpen, initialPrompt, preferences.defaultTone, setError, setStatus]);

  // Handle generate button click
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!apiKey) {
      setError('OpenAI API key is not set. Please set it in the extension options.');
      return;
    }

    setStatus('generating');
    setError(null);

    try {
      const response = await generateText(prompt, tone, apiKey);
      
      if (response.success && response.text) {
        setGeneratedText(response.text);
        setStatus('success');
      } else {
        setError(response.error || 'Failed to generate text');
        setStatus('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setStatus('error');
    }
  };

  // Handle insert button click
  const handleInsert = () => {
    if (generatedText) {
      onInsert(generatedText);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content p-6">
        <div className="flex items-center mb-6">
          <div className="text-2xl font-bold mr-2">✨</div>
          <h1 className="text-xl font-semibold">MailMancer</h1>
        </div>

        <div className="mb-4">
          <label htmlFor="prompt" className="block text-sm font-medium mb-2">
            What do you want to say?
          </label>
          <textarea
            id="prompt"
            className="input w-full min-h-[100px]"
            placeholder="What do you want to say?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <p className="block text-sm font-medium mb-2">Tone:</p>
          <div className="flex flex-wrap gap-3">
            {['Casual', 'Professional', 'Friendly', 'Concise'].map((toneOption) => (
              <button
                key={toneOption}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tone === toneOption.toLowerCase()
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => setTone(toneOption.toLowerCase() as any)}
              >
                {toneOption}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md text-red-200 text-sm">
            {error}
          </div>
        )}

        {generatedText && (
          <div className="mb-6">
            <p className="block text-sm font-medium mb-2">Generated Response:</p>
            <div className="bg-gray-800 border border-gray-700 rounded-md p-3 max-h-[200px] overflow-y-auto">
              {generatedText}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          
          <button 
            onClick={handleGenerate} 
            disabled={status === 'generating'}
            className="btn btn-primary flex items-center"
          >
            {status === 'generating' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>Generate ✨</>
            )}
          </button>
          
          {generatedText && (
            <button onClick={handleInsert} className="btn btn-primary">
              Insert
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
