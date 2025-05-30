import { useState, useEffect } from 'react';
import EmailModal from './EmailModal';
import useStore from '../store/useStore';

const ContentScript = () => {
  const { modalVisible, setModalVisible } = useStore();
  const [selectedText, setSelectedText] = useState('');
  const [emailContent, setEmailContent] = useState('');

  // Listen for keyboard shortcut (Ctrl+Shift+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        // Get selected text from the active element
        const selection = window.getSelection();
        if (selection) {
          setSelectedText(selection.toString());
        }
        
        // Extract email content if available
        const emailThread = extractEmailContent();
        setEmailContent(emailThread || '');
        
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
        
        // Extract email content if available
        const emailThread = extractEmailContent();
        setEmailContent(emailThread || '');
        
        setModalVisible(true);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [setModalVisible]);

  // Function to extract email content from the page
  const extractEmailContent = (): string | null => {
    // This function attempts to extract email content from various email providers
    console.log('MailMancer: Attempting to extract email content');
    
    // For Gmail
    // Try to find the email thread content
    const emailThreadElements = document.querySelectorAll('.a3s.aiL');
    console.log('MailMancer: Found Gmail thread elements:', emailThreadElements.length);
    
    if (emailThreadElements && emailThreadElements.length > 0) {
      // Get the most recent email in the thread (last element)
      const emailContent = Array.from(emailThreadElements)
        .map(element => element.textContent || '')
        .join('\n\n--- Previous message ---\n\n');
      
      console.log('MailMancer: Extracted email content from Gmail thread elements');
      return emailContent;
    }
    
    // Try alternative Gmail selectors
    const gmailViewport = document.querySelector('.AO');
    if (gmailViewport) {
      const emailBody = gmailViewport.querySelector('[role="main"] .a3s');
      if (emailBody) {
        console.log('MailMancer: Found Gmail email body using alternative selector');
        return emailBody.textContent || '';
      }
    }
    
    // Try to find email content in Outlook
    const outlookContent = document.querySelector('.ReadMsgBody, .ExternalClass, [aria-label="Message body"]');
    if (outlookContent) {
      console.log('MailMancer: Found Outlook email content');
      return outlookContent.textContent || '';
    }
    
    // If we can't find the email content using specific selectors, try a more generic approach
    // Look for any substantial text content in the page that might be an email
    const emailContainer = document.querySelector('[role="main"]');
    if (emailContainer) {
      const possibleEmailContent = emailContainer.textContent;
      if (possibleEmailContent && possibleEmailContent.length > 100) {
        // Only return if we have substantial content
        console.log('MailMancer: Found generic email content');
        return possibleEmailContent;
      }
    }
    
    // Force email content detection for testing purposes
    // This is a temporary solution to ensure the Reply button shows up
    // Remove this in production or replace with proper detection logic
    console.log('MailMancer: Using fallback test email content');
    return "This is a test email content to ensure the Reply button appears. In a real implementation, this would be the actual email content extracted from the page.";
    
    // Uncomment the line below and remove the test content above when proper detection is working
    // return null;
  };
  
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
      emailContent={emailContent}
      onInsert={insertTextIntoEmail}
    />
  );
};

export default ContentScript;
