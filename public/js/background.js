// background.js - Background service worker for MailMancer

// Initialize OpenAI API key from storage
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
    return true;
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
  else if (message.action === 'generateReply') {
    console.log('Background: Received generateReply action', message);
    
    // Check if API key is set
    if (!openAIKey) {
      console.log('Background: No API key set');
      sendResponse({ 
        success: false, 
        error: 'OpenAI API key not set. Please set it in the extension options.' 
      });
      return true;
    }
    
    // Validate email content
    if (!message.emailContent) {
      console.log('Background: No email content provided');
      sendResponse({
        success: false,
        error: 'No email content provided. Please make sure you are viewing an email.'
      });
      return true;
    }
    
    console.log('Background: Calling generateReply with email content length:', message.emailContent.length);
    
    // Generate reply using OpenAI API
    generateReply(message.emailContent, message.tone)
      .then(generatedText => {
        console.log('Background: Reply generated successfully, length:', generatedText.length);
        sendResponse({ 
          success: true, 
          generatedText: generatedText 
        });
        
        // Save the tone preference
        chrome.storage.local.set({ lastUsedTone: message.tone });
      })
      .catch(error => {
        console.error('Background: Error generating reply:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'Failed to generate reply' 
        });
      });
    
    return true; // Required for async sendResponse
  }
  else if (message.action === 'setAPIKey') {
    openAIKey = message.apiKey;
    chrome.storage.local.set({ openAIKey: message.apiKey });
    sendResponse({ success: true });
    return true;
  }
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
            <span>Casual</span>
          </label>
          <label class="mailmancer-tone-option">
            <input type="radio" name="mailmancer-tone" value="professional" ${lastUsedTone === 'professional' ? 'checked' : ''}>
            <span>Professional</span>
          </label>
          <label class="mailmancer-tone-option">
            <input type="radio" name="mailmancer-tone" value="friendly" ${lastUsedTone === 'friendly' ? 'checked' : ''}>
            <span>Friendly</span>
          </label>
          <label class="mailmancer-tone-option">
            <input type="radio" name="mailmancer-tone" value="concise" ${lastUsedTone === 'concise' ? 'checked' : ''}>
            <span>Concise</span>
          </label>
        </div>
      </div>
      
      <div id="mailmancer-result" class="mailmancer-result"></div>
      
      <div class="mailmancer-actions">
        <button id="mailmancer-cancel" class="mailmancer-button mailmancer-button-secondary">Cancel</button>
        <button id="mailmancer-reply" class="mailmancer-button mailmancer-button-reply">Reply to Email ↩️</button>
        <button id="mailmancer-generate" class="mailmancer-button mailmancer-button-primary">Generate ✨</button>
        <button id="mailmancer-insert" class="mailmancer-button mailmancer-button-primary" style="display:none;">Insert</button>
      </div>
    </div>
  `;
}

// Function to generate text using OpenAI API
async function generateText(prompt, tone) {
  try {
    // Check if API key is set
    if (!openAIKey) {
      throw new Error('OpenAI API key not set. Please set it in the extension options.');
    }
    
    // Construct the prompt based on the tone
    let systemPrompt = '';
    
    switch (tone) {
      case 'casual':
        systemPrompt = 'You are a helpful assistant that writes casual, conversational email responses. Keep the tone relaxed and informal, but still professional enough for work emails. Use contractions, simple language, and a friendly approach.';
        break;
      case 'professional':
        systemPrompt = 'You are a helpful assistant that writes professional, formal email responses. Maintain a business-appropriate tone with proper grammar and structure. Be courteous, clear, and concise while conveying professionalism.';
        break;
      case 'friendly':
        systemPrompt = 'You are a helpful assistant that writes friendly, warm email responses. Be personable and approachable while maintaining professionalism. Use a positive tone that builds rapport and shows genuine interest.';
        break;
      case 'concise':
        systemPrompt = 'You are a helpful assistant that writes concise, to-the-point email responses. Be brief but complete, eliminating unnecessary words while retaining all essential information. Aim for clarity and efficiency.';
        break;
      default:
        systemPrompt = 'You are a helpful assistant that writes email responses.';
    }
    
    // Make the actual API call to OpenAI
    console.log('Making API request to OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    console.log('Received response from OpenAI:', data);
    
    if (data.error) {
      throw new Error(data.error.message || 'Error from OpenAI API');
    }
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response generated. Please try again.');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
}

// Function to generate email reply using OpenAI API
async function generateReply(emailContent, tone) {
  try {
    console.log('Background: generateReply called with tone:', tone);
    console.log('Background: Email content length:', emailContent ? emailContent.length : 0);
    
    // Check if API key is set
    if (!openAIKey) {
      throw new Error('OpenAI API key not set. Please set it in the extension options.');
    }
    
    // Construct the prompt based on the tone
    let systemPrompt = 'You are a helpful assistant that writes email replies.';
    
    switch (tone) {
      case 'casual':
        systemPrompt += ' Write in a casual, conversational tone. Be relaxed and friendly, as if writing to a friend.';
        break;
      case 'professional':
        systemPrompt += ' Write in a professional, formal tone. Be clear, concise, and maintain appropriate business etiquette.';
        break;
      case 'friendly':
        systemPrompt += ' Write in a friendly, warm tone. Be personable and approachable while maintaining professionalism.';
        break;
      case 'concise':
        systemPrompt += ' Write in a concise, to-the-point tone. Be brief and direct, focusing only on essential information.';
        break;
    }
    
    systemPrompt += ' Generate a thoughtful reply to the email thread provided. Address all relevant points from the original email.';
    
    // Prepare the user prompt with the email content
    const userPrompt = `Here is the email thread I need to reply to:\n\n${emailContent}\n\nPlease generate a well-structured reply that addresses the key points in this email.`;
    
    console.log('Background: System prompt:', systemPrompt);
    console.log('Background: Making API request to OpenAI for email reply...');
    
    // Make the actual API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    console.log('Background: Received response from OpenAI for email reply:', data);
    
    if (data.error) {
      console.error('Background: OpenAI API error:', data.error);
      throw new Error(data.error.message || 'Error from OpenAI API');
    }
    
    if (!data.choices || data.choices.length === 0) {
      console.error('Background: No choices in OpenAI response');
      throw new Error('No response generated. Please try again.');
    }
    
    const generatedText = data.choices[0].message.content;
    console.log('Background: Generated reply text:', generatedText.substring(0, 50) + '...');
    return generatedText;
  } catch (error) {
    console.error('Background: Error generating email reply:', error);
    throw error;
  }
}

// Log that the background script has loaded
console.log('MailMancer: Background script loaded');
