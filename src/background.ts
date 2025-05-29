// Background script for MailMancer

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'setAPIKey') {
    // Store API key in chrome.storage
    chrome.storage.local.set({ openAIKey: message.apiKey });
    sendResponse({ success: true });
  }
  
  // Always return true for async response
  return true;
});

// Log that the background script has loaded
console.log('MailMancer: Background script loaded');
