// content.js - Script injected into Gmail
console.log('MailMancer: Content script loaded');

// Create and inject the modal container
const modalContainer = document.createElement('div');
modalContainer.id = 'mailmancer-modal-container';
modalContainer.style.display = 'none';
document.body.appendChild(modalContainer);

// Listen for keyboard shortcut (Ctrl+Shift+M)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'M') {
    toggleModal();
  }
});

// Function to toggle the modal
function toggleModal() {
  const isVisible = modalContainer.style.display === 'block';
  
  if (isVisible) {
    modalContainer.style.display = 'none';
  } else {
    // Get the current selected text from the compose area
    const selectedText = window.getSelection().toString();
    
    // Send message to background script to open modal
    chrome.runtime.sendMessage({
      action: 'openModal',
      selectedText
    });
    
    modalContainer.style.display = 'block';
  }
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'insertText') {
    insertTextIntoEmail(message.text);
    sendResponse({ success: true });
  } else if (message.action === 'renderModal') {
    renderModal(message.html);
    sendResponse({ success: true });
  }
  return true;
});

// Function to insert text into the active email compose field
function insertTextIntoEmail(text) {
  // Find the active compose area
  const activeElement = document.activeElement;
  
  if (activeElement && activeElement.isContentEditable) {
    // We're in a contentEditable area (Gmail compose)
    document.execCommand('insertText', false, text);
  } else {
    console.error('MailMancer: No active editable element found');
  }
  
  // Hide the modal after insertion
  modalContainer.style.display = 'none';
}

// Function to render the modal with provided HTML
function renderModal(html) {
  modalContainer.innerHTML = html;
  
  // Add event listeners to the newly rendered modal
  const cancelButton = modalContainer.querySelector('#mailmancer-cancel');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      modalContainer.style.display = 'none';
    });
  }
  
  const generateButton = modalContainer.querySelector('#mailmancer-generate');
  if (generateButton) {
    generateButton.addEventListener('click', () => {
      const prompt = modalContainer.querySelector('#mailmancer-prompt').value;
      const tone = document.querySelector('input[name="mailmancer-tone"]:checked').value;
      
      // Send message to background script to generate text
      chrome.runtime.sendMessage({
        action: 'generateText',
        prompt,
        tone
      }, (response) => {
        if (response && response.success) {
          // Update the modal with the generated text
          const resultContainer = modalContainer.querySelector('#mailmancer-result');
          if (resultContainer) {
            resultContainer.textContent = response.generatedText;
            resultContainer.style.display = 'block';
          }
        }
      });
    });
  }
  
  const insertButton = modalContainer.querySelector('#mailmancer-insert');
  if (insertButton) {
    insertButton.addEventListener('click', () => {
      const resultContainer = modalContainer.querySelector('#mailmancer-result');
      if (resultContainer && resultContainer.textContent) {
        insertTextIntoEmail(resultContainer.textContent);
      }
    });
  }
}
