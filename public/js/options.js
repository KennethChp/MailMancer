// options.js - JavaScript for the options page

// DOM Elements
const apiKeyInput = document.getElementById('api-key');
const showHideKeyButton = document.getElementById('show-hide-key');
const saveKeyButton = document.getElementById('save-key');
const saveToneButton = document.getElementById('save-tone');
const statusMessage = document.getElementById('status-message');
const toneOptions = document.querySelectorAll('input[name="default-tone"]');

// Load saved options when the page loads
document.addEventListener('DOMContentLoaded', loadOptions);

// Event listeners
showHideKeyButton.addEventListener('click', toggleApiKeyVisibility);
saveKeyButton.addEventListener('click', saveApiKey);
saveToneButton.addEventListener('click', saveDefaultTone);

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

// Function to save API key
function saveApiKey() {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }
  
  // Validate API key format (basic check)
  if (!apiKey.startsWith('sk-')) {
    showStatus('API key should start with "sk-"', 'error');
    return;
  }
  
  // Save to Chrome storage
  chrome.storage.local.set({ openAIKey: apiKey }, () => {
    showStatus('API key saved successfully!', 'success');
    
    // Also send message to background script to update the key in memory
    chrome.runtime.sendMessage({
      action: 'setAPIKey',
      apiKey: apiKey
    });
  });
}

// Function to save default tone
function saveDefaultTone() {
  let selectedTone = 'professional'; // Default
  
  // Get the selected tone
  for (const toneOption of toneOptions) {
    if (toneOption.checked) {
      selectedTone = toneOption.value;
      break;
    }
  }
  
  // Save to Chrome storage
  chrome.storage.local.set({ defaultTone: selectedTone }, () => {
    showStatus('Default tone saved successfully!', 'success');
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
