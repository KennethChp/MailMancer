import { useState, useEffect } from 'react';
import EmailModal from './EmailModal';
import useStore from '../store/useStore';

const ContentScript = () => {
  const { modalVisible, setModalVisible } = useStore();
  const [selectedText, setSelectedText] = useState('');

  // Listen for keyboard shortcut (Ctrl+Shift+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        // Get selected text from the active element
        const selection = window.getSelection();
        if (selection) {
          setSelectedText(selection.toString());
        }
        
        // Toggle modal visibility
        setModalVisible(!modalVisible);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalVisible, setModalVisible]);

  // Listen for messages from background script
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.action === 'openModal') {
        setSelectedText(message.selectedText || '');
        setModalVisible(true);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [setModalVisible]);

  // Function to insert text into the active email compose field
  const insertTextIntoEmail = (text: string) => {
    // Find the active compose area
    const activeElement = document.activeElement;
    
    if (activeElement && (activeElement as HTMLElement).isContentEditable) {
      // We're in a contentEditable area (Gmail compose)
      document.execCommand('insertText', false, text);
    } else {
      console.error('MailMancer: No active editable element found');
      
      // Try to find Gmail compose area as fallback
      const composeAreas = document.querySelectorAll('[contenteditable="true"]');
      if (composeAreas.length > 0) {
        // Focus the first compose area
        (composeAreas[0] as HTMLElement).focus();
        document.execCommand('insertText', false, text);
      } else {
        alert('Could not find an email compose area. Please click in the compose area and try again.');
      }
    }
  };

  return (
    <EmailModal
      isOpen={modalVisible}
      onClose={() => setModalVisible(false)}
      initialPrompt={selectedText}
      onInsert={insertTextIntoEmail}
    />
  );
};

export default ContentScript;
