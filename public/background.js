// background.js - Background service worker for MailMancer

// Initialize OpenAI API key from storage or prompt user to set it
let openAIKey = '';

// Load API key from storage when extension starts
chrome.storage.local.get(['openAIKey'], (result) => {
  if (result.openAIKey) {
    openAIKey = result.openAIKey;
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openModal') {
    // Create the modal HTML
    const modalHTML = createModalHTML(message.selectedText || '');
    
    // Send the HTML back to the content script to render
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'renderModal',
          html: modalHTML
        });
      }
    });
    
    sendResponse({ success: true });
  } 
  else if (message.action === 'generateText') {
    // Check if API key is set
    if (!openAIKey) {
      sendResponse({ 
        success: false, 
        error: 'OpenAI API key not set. Please set it in the extension options.' 
      });
      return true;
    }
    
    // Generate text using OpenAI API
    generateText(message.prompt, message.tone)
      .then(generatedText => {
        sendResponse({ 
          success: true, 
          generatedText 
        });
        
        // Save the tone preference
        chrome.storage.local.set({ lastUsedTone: message.tone });
      })
      .catch(error => {
        console.error('Error generating text:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'Failed to generate text' 
        });
      });
    
    return true; // Required for async sendResponse
  }
  else if (message.action === 'setAPIKey') {
    openAIKey = message.apiKey;
    chrome.storage.local.set({ openAIKey: message.apiKey });
    sendResponse({ success: true });
  }
  
  return true;
});

// Function to create the modal HTML
function createModalHTML(selectedText) {
  // Get the last used tone from storage, default to 'professional'
  let lastUsedTone = 'professional';
  chrome.storage.local.get(['lastUsedTone'], (result) => {
    if (result.lastUsedTone) {
      lastUsedTone = result.lastUsedTone;
    }
  });
  
  return `
    <div class="mailmancer-modal">
      <div class="mailmancer-header">
        <div class="mailmancer-logo">✨</div>
        <div class="mailmancer-title">MailMancer</div>
      </div>
      
      <div class="mailmancer-input-group">
        <label class="mailmancer-label" for="mailmancer-prompt">What do you want to say?</label>
        <textarea id="mailmancer-prompt" class="mailmancer-textarea" placeholder="What do you want to say?">${selectedText}</textarea>
      </div>
      
      <div class="mailmancer-input-group">
        <label class="mailmancer-label">Tone:</label>
        <div class="mailmancer-tone-options">
          <label class="mailmancer-tone-option">
            <input type="radio" name="mailmancer-tone" value="casual" ${lastUsedTone === 'casual' ? 'checked' : ''}>
            Casual
          </label>
          <label class="mailmancer-tone-option">
            <input type="radio" name="mailmancer-tone" value="professional" ${lastUsedTone === 'professional' ? 'checked' : ''}>
            Professional
          </label>
          <label class="mailmancer-tone-option">
            <input type="radio" name="mailmancer-tone" value="friendly" ${lastUsedTone === 'friendly' ? 'checked' : ''}>
            Friendly
          </label>
          <label class="mailmancer-tone-option">
            <input type="radio" name="mailmancer-tone" value="concise" ${lastUsedTone === 'concise' ? 'checked' : ''}>
            Concise
          </label>
        </div>
      </div>
      
      <div id="mailmancer-result" class="mailmancer-result"></div>
      
      <div class="mailmancer-actions">
        <button id="mailmancer-cancel" class="mailmancer-button mailmancer-button-secondary">Cancel</button>
        <button id="mailmancer-generate" class="mailmancer-button mailmancer-button-primary">Generate ✨</button>
        <button id="mailmancer-insert" class="mailmancer-button mailmancer-button-primary" style="display:none;">Insert</button>
      </div>
    </div>
  `;
}

// Function to generate text using OpenAI API
async function generateText(prompt, tone) {
  try {
    // Construct the prompt based on the tone
    let fullPrompt = '';
    
    switch (tone) {
      case 'casual':
        fullPrompt = `Write a casual, conversational email response: ${prompt}`;
        break;
      case 'professional':
        fullPrompt = `Write a professional, formal email response: ${prompt}`;
        break;
      case 'friendly':
        fullPrompt = `Write a friendly, warm email response: ${prompt}`;
        break;
      case 'concise':
        fullPrompt = `Write a concise, to-the-point email response: ${prompt}`;
        break;
      default:
        fullPrompt = `Write an email response: ${prompt}`;
    }
    
    // This is a mock implementation since we can't make actual API calls in this example
    // In a real implementation, you would use the fetch API to call OpenAI
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock response
    return `This is a simulated ${tone} email response. In the actual implementation, this would be generated by OpenAI's API based on your prompt: "${prompt}".`;
    
    /* 
    // Real implementation would look something like this:
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that writes email responses.' },
          { role: 'user', content: fullPrompt }
        ],
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return data.choices[0].message.content;
    */
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
}
