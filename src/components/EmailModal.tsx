import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { generateText, generateEmailReply } from '../utils/api';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  emailContent?: string;
  onInsert: (text: string) => void;
}

const EmailModal = ({ isOpen, onClose, initialPrompt = '', emailContent = '', onInsert }: EmailModalProps) => {
  // Debug email content
  console.log('MailMancer EmailModal: Email content available:', !!emailContent, 'Length:', emailContent?.length || 0);
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
      
      // Debug email content when modal opens
      console.log('MailMancer EmailModal (on open): Email content available:', !!emailContent, 'Length:', emailContent?.length || 0);
    }
  }, [isOpen, initialPrompt, emailContent, preferences.defaultTone, setError, setStatus]);

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
  
  // Handle reply button click
  const handleReply = async () => {
    if (!emailContent) {
      setError('No email content detected. Make sure you are viewing an email.');
      return;
    }

    if (!apiKey) {
      setError('OpenAI API key is not set. Please set it in the extension options.');
      return;
    }

    setStatus('generating');
    setError(null);

    try {
      const response = await generateEmailReply(emailContent, tone, apiKey);
      
      if (response.success && response.text) {
        setGeneratedText(response.text);
        setStatus('success');
      } else {
        setError(response.error || 'Failed to generate reply');
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

        {/* Debug info - remove in production */}
        <div style={{
          margin: '0 0 16px 0',
          padding: '8px',
          border: '1px solid #666',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#eee'
        }}>
          {emailContent ? 
            `Email content detected (${emailContent.length} characters)` : 
            'No email content detected. Reply button will still be shown for testing.'}
        </div>

        {/* Action buttons */}
        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px'}}>
          <button 
            onClick={onClose} 
            className="mailmancer-button mailmancer-button-cancel"
          >
            Cancel
          </button>
          
          {/* Reply button - Always visible */}
          <button 
            id="reply-button"
            onClick={handleReply} 
            disabled={status === 'generating'}
            className="mailmancer-button mailmancer-button-reply"
            style={{ zIndex: 9999 }}
          >
            {status === 'generating' ? 'Generating...' : 'Reply to Email ↩️'}
          </button>
          
          <button 
            onClick={handleGenerate} 
            disabled={status === 'generating'}
            className="mailmancer-button mailmancer-button-generate"
          >
            {status === 'generating' ? 'Generating...' : 'Generate ✨'}
          </button>
          
          {generatedText && (
            <button 
              onClick={handleInsert} 
              className="mailmancer-button mailmancer-button-insert"
            >
              Insert
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
