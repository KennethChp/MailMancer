// options.js - JavaScript for the options page

// DOM Elements
const apiKeyInput = document.getElementById('api-key');
const showHideKeyButton = document.getElementById('show-hide-key');
const saveAllButton = document.getElementById('save-all');
const statusMessage = document.getElementById('status-message');
const toneOptions = document.querySelectorAll('input[name="default-tone"]');

// Load saved options when the page loads
document.addEventListener('DOMContentLoaded', loadOptions);

// Event listeners
showHideKeyButton.addEventListener('click', toggleApiKeyVisibility);
saveAllButton.addEventListener('click', saveAllSettings);

// Function to load saved options
function loadOptions() {
  // Load API key
  chrome.storage.local.get(['openAIKey'], (result) => {
    if (result.openAIKey) {
      apiKeyInput.value = result.openAIKey;
    }
  });
  
  // Load default tone
  chrome.storage.local.get(['defaultTone'], (result) => {
    if (result.defaultTone) {
      const toneElement = document.querySelector(`input[name="default-tone"][value="${result.defaultTone}"]`);
      if (toneElement) {
        toneElement.checked = true;
      }
    }
  });
}

// Function to toggle API key visibility
function toggleApiKeyVisibility() {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    showHideKeyButton.textContent = 'Hide';
  } else {
    apiKeyInput.type = 'password';
    showHideKeyButton.textContent = 'Show';
  }
}

// Function to validate and get API key
function validateApiKey() {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return null;
  }
  
  // Validate API key format (basic check)
  if (!apiKey.startsWith('sk-')) {
    showStatus('API key should start with "sk-"', 'error');
    return null;
  }
  
  return apiKey;
}

// Function to get selected tone
function getSelectedTone() {
  let selectedTone = 'professional'; // Default
  
  // Get the selected tone
  for (const toneOption of toneOptions) {
    if (toneOption.checked) {
      selectedTone = toneOption.value;
      break;
    }
  }
  
  return selectedTone;
}

// Function to save all settings
function saveAllSettings() {
  // Validate and get API key
  const apiKey = validateApiKey();
  if (apiKey === null) {
    return; // Validation failed
  }
  
  // Get selected tone
  const selectedTone = getSelectedTone();
  
  // Save both settings to Chrome storage
  chrome.storage.local.set({ 
    openAIKey: apiKey,
    defaultTone: selectedTone 
  }, () => {
    showStatus('All settings saved successfully!', 'success');
    
    // Also send message to background script to update the key in memory
    chrome.runtime.sendMessage({
      action: 'setAPIKey',
      apiKey: apiKey
    });
    
    // Send message to update the default tone in any open popups
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateDefaultTone',
          tone: selectedTone
        }).catch(() => {
          // Ignore errors from tabs that don't have content scripts
        });
      });
    });
  });
}

// Function to show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = type; // 'success' or 'error'
  
  // Clear the message after 3 seconds
  setTimeout(() => {
    statusMessage.textContent = '';
    statusMessage.className = '';
  }, 3000);
}
