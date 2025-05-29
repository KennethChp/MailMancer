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
    
    // Try to find Gmail compose area as fallback
    const composeAreas = document.querySelectorAll('[contenteditable="true"]');
    if (composeAreas.length > 0) {
      // Focus the first compose area
      composeAreas[0].focus();
      document.execCommand('insertText', false, text);
    } else {
      alert('Could not find an email compose area. Please click in the compose area and try again.');
    }
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
      const toneElements = modalContainer.querySelectorAll('input[name="mailmancer-tone"]');
      let tone = 'professional'; // Default
      
      for (const element of toneElements) {
        if (element.checked) {
          tone = element.value;
          break;
        }
      }
      
      // Show loading state
      const generateButton = modalContainer.querySelector('#mailmancer-generate');
      const resultContainer = modalContainer.querySelector('#mailmancer-result');
      
      if (generateButton) {
        generateButton.disabled = true;
        generateButton.textContent = 'Generating...';
      }
      
      if (resultContainer) {
        resultContainer.textContent = 'Generating your email...';
        resultContainer.style.display = 'block';
      }
      
      // Send message to background script to generate text
      chrome.runtime.sendMessage({
        action: 'generateText',
        prompt,
        tone
      }, (response) => {
        // Reset button state
        if (generateButton) {
          generateButton.disabled = false;
          generateButton.textContent = 'Generate ✨';
        }
        
        if (response && response.success) {
          // Update the modal with the generated text
          if (resultContainer) {
            resultContainer.textContent = response.generatedText;
            resultContainer.style.display = 'block';
            
            // Show the insert button
            const insertButton = modalContainer.querySelector('#mailmancer-insert');
            if (insertButton) {
              insertButton.style.display = 'inline-block';
            }
          }
        } else {
          // Show error message
          if (resultContainer) {
            resultContainer.textContent = response && response.error ? 
              `Error: ${response.error}` : 
              'An error occurred while generating text. Please try again.';
            resultContainer.style.display = 'block';
            resultContainer.classList.add('error');
            
            // Add a link to options page if API key is missing
            if (response && response.error && response.error.includes('API key')) {
              const optionsLink = document.createElement('a');
              optionsLink.href = '#';
              optionsLink.textContent = 'Open Options Page';
              optionsLink.className = 'options-link';
              optionsLink.addEventListener('click', (e) => {
                e.preventDefault();
                chrome.runtime.openOptionsPage();
              });
              
              resultContainer.appendChild(document.createElement('br'));
              resultContainer.appendChild(document.createElement('br'));
              resultContainer.appendChild(optionsLink);
            }
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
