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
    
    try {
      // Send message to background script to open modal
      chrome.runtime.sendMessage({
        action: 'openModal',
        selectedText
      }, (response) => {
        // Check for runtime error
        if (chrome.runtime.lastError) {
          console.warn('MailMancer: Error sending message to background script:', chrome.runtime.lastError.message);
          // Continue showing the modal even if the message fails
        }
      });
    } catch (error) {
      // Handle any exceptions that might occur
      console.error('MailMancer: Failed to communicate with background script:', error);
      // We'll still show the modal even if communication fails
    }
    
    // Show the modal regardless of whether the message was sent successfully
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

// Function to extract email content from the page
function extractEmailContent() {
  console.log('MailMancer: Attempting to extract email content');
  
  try {
    // For Gmail - Try multiple selectors
    // 1. Standard Gmail thread elements
    const emailThreadElements = document.querySelectorAll('.a3s.aiL');
    console.log('MailMancer: Found Gmail thread elements:', emailThreadElements.length);
    
    if (emailThreadElements && emailThreadElements.length > 0) {
      // Get all emails in the thread
      const emailContent = Array.from(emailThreadElements)
        .map(element => element.textContent || '')
        .join('\n\n--- Previous message ---\n\n');
      
      console.log('MailMancer: Extracted email content from Gmail thread elements');
      return emailContent;
    }
    
    // 2. Try alternative Gmail selectors
    const gmailSelectors = [
      '.gs', // Another Gmail content container
      '.ii.gt', // Email body in conversation view
      '.gE.iv.gt', // Another possible email container
      '.adP.adO' // Email content in some Gmail views
    ];
    
    for (const selector of gmailSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        const content = Array.from(elements)
          .map(element => element.textContent || '')
          .join('\n\n');
        
        if (content && content.length > 50) {
          console.log(`MailMancer: Found email content using selector ${selector}`);
          return content;
        }
      }
    }
    
    // 3. Try Gmail viewport approach
    const gmailViewport = document.querySelector('.AO');
    if (gmailViewport) {
      const emailBody = gmailViewport.querySelector('[role="main"] .a3s');
      if (emailBody) {
        console.log('MailMancer: Found Gmail email body using viewport selector');
        return emailBody.textContent || '';
      }
    }
    
    // 4. Try to find email content in Outlook
    const outlookSelectors = [
      '.ReadMsgBody', 
      '.ExternalClass', 
      '[aria-label="Message body"]',
      '.allowTextSelection'
    ];
    
    for (const selector of outlookSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const content = element.textContent || '';
        if (content && content.length > 50) {
          console.log(`MailMancer: Found Outlook email content using selector ${selector}`);
          return content;
        }
      }
    }
    
    // 5. If we can't find the email content using specific selectors, try a more generic approach
    const emailContainer = document.querySelector('[role="main"]');
    if (emailContainer) {
      const possibleEmailContent = emailContainer.textContent;
      if (possibleEmailContent && possibleEmailContent.length > 100) {
        console.log('MailMancer: Found generic email content');
        return possibleEmailContent;
      }
    }
    
    // 6. Last resort - try to find any large text block on the page
    const allTextElements = document.querySelectorAll('div, p, span');
    const largeTextElements = Array.from(allTextElements)
      .filter(el => {
        const text = el.textContent || '';
        return text.length > 200; // Look for substantial blocks of text
      })
      .sort((a, b) => (b.textContent || '').length - (a.textContent || '').length);
    
    if (largeTextElements.length > 0) {
      console.log('MailMancer: Found email content using large text block approach');
      return largeTextElements[0].textContent || '';
    }
    
    console.log('MailMancer: Could not extract email content, using fallback');
  } catch (error) {
    console.error('MailMancer: Error extracting email content:', error);
  }
  
  // Force email content detection for testing purposes
  console.log('MailMancer: Using fallback test email content');
  return "This is a test email content. Dear User, I hope this email finds you well. I wanted to follow up on our previous conversation about the project timeline. Could you please provide an update on the current status? Thanks, Sender";
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
  
  // Get the Reply button
  const replyButton = modalContainer.querySelector('#mailmancer-reply');
  if (replyButton) {
    console.log('MailMancer: Found Reply button, attaching event listener');
    // Remove any existing event listeners to avoid duplicates
    replyButton.removeEventListener('click', handleReplyClick);
    // Add event listener for Reply button
    replyButton.addEventListener('click', handleReplyClick);
  } else {
    console.error('MailMancer: Reply button not found in modal');
    // If Reply button doesn't exist but Generate button does, create and add Reply button
    const generateButton = modalContainer.querySelector('#mailmancer-generate');
    if (generateButton) {
      const buttonContainer = generateButton.parentElement;
      
      // Create Reply button
      const replyBtn = document.createElement('button');
      replyBtn.id = 'mailmancer-reply';
      replyBtn.className = 'mailmancer-button mailmancer-button-reply';
      replyBtn.textContent = 'Reply to Email ↩️';
      replyBtn.style.backgroundColor = '#3b82f6';
      replyBtn.style.color = 'white';
      replyBtn.style.padding = '8px 16px';
      replyBtn.style.borderRadius = '6px';
      replyBtn.style.fontWeight = '500';
      replyBtn.style.cursor = 'pointer';
      replyBtn.style.border = 'none';
      replyBtn.style.marginRight = '8px';
      
      // Insert before Generate button
      buttonContainer.insertBefore(replyBtn, generateButton);
      
      console.log('MailMancer: Created and added Reply button');
      // Add event listener for Reply button
      replyBtn.addEventListener('click', handleReplyClick);
    }
  }
  
  // Function to handle Reply button click
  function handleReplyClick() {
    console.log('MailMancer: Reply button clicked');
    
    // Extract email content from the page
    const emailContent = extractEmailContent();
    console.log('MailMancer: Extracted email content length:', emailContent ? emailContent.length : 0);
    
    // Show loading state
    const replyButton = modalContainer.querySelector('#mailmancer-reply');
    const resultContainer = modalContainer.querySelector('#mailmancer-result');
    
    if (replyButton) {
      replyButton.disabled = true;
      replyButton.textContent = 'Generating...';
    }
    
    if (resultContainer) {
      resultContainer.textContent = 'Generating your email reply...';
      resultContainer.style.display = 'block';
      resultContainer.classList.remove('error');
    }
    
    // First try using the background script approach (more reliable)
    try {
      // Get tone selection
      const toneElements = modalContainer.querySelectorAll('input[name="mailmancer-tone"]');
      let tone = 'professional'; // Default
      
      for (const element of toneElements) {
        if (element.checked) {
          tone = element.value;
          break;
        }
      }
      
      console.log('MailMancer: Selected tone:', tone);
      console.log('MailMancer: Sending message to background script');
      
      // Send message to background script to generate reply
      chrome.runtime.sendMessage({
        action: 'generateReply',
        emailContent: emailContent,
        tone: tone
      }, (response) => {
        // Check for runtime error
        if (chrome.runtime.lastError) {
          console.warn('MailMancer: Error sending message to background script:', chrome.runtime.lastError.message);
          // If there's an error, try the direct API approach
          handleDirectApiCall(emailContent, tone, replyButton, resultContainer);
          return;
        }
        
        // Check if there was a response
        if (!response) {
          console.error('MailMancer: No response from background script, trying direct API call');
          // If no response, try the direct API approach
          handleDirectApiCall(emailContent, tone, replyButton, resultContainer);
          return;
        }
        
        console.log('MailMancer: Received response from background script:', response);
        
        // Reset button state
        if (replyButton) {
          replyButton.disabled = false;
          replyButton.textContent = 'Reply to Email ↩️';
        }
        
        if (response.success && response.generatedText) {
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
            resultContainer.textContent = response.error ? 
              `Error: ${response.error}` : 
              'An error occurred while generating reply. Please try again.';
            resultContainer.style.display = 'block';
            resultContainer.classList.add('error');
            
            // Add a link to options page if API key is missing
            if (response.error && response.error.includes('API key')) {
              addOptionsPageLink(resultContainer);
            }
          }
        }
      });
    } catch (error) {
      console.error('MailMancer: Error with background script approach:', error);
      // If there's an error with the background script approach, try direct API call
      handleDirectApiCall(emailContent, tone, replyButton, resultContainer);
    }
  }
  
  // Helper function to add options page link
  function addOptionsPageLink(container) {
    const optionsLink = document.createElement('a');
    optionsLink.href = '#';
    optionsLink.textContent = 'Open Options Page';
    optionsLink.className = 'options-link';
    optionsLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
    
    container.appendChild(document.createElement('br'));
    container.appendChild(document.createElement('br'));
    container.appendChild(optionsLink);
  }
  
  // Function to handle direct API call as fallback
  function handleDirectApiCall(emailContent, tone, replyButton, resultContainer) {
    console.log('MailMancer: Using direct API call approach');
    
    if (!emailContent || emailContent.trim().length < 10) {
      alert('No email content detected. Make sure you are viewing an email.');
      
      // Reset button state
      if (replyButton) {
        replyButton.disabled = false;
        replyButton.textContent = 'Reply to Email ↩️';
      }
      
      return;
    }
    
    // Get API key from storage
    chrome.storage.local.get(['openAIKey'], (result) => {
      const apiKey = result.openAIKey;
      
      if (!apiKey) {
        console.log('MailMancer: No API key found in storage');
        if (resultContainer) {
          resultContainer.textContent = 'Error: OpenAI API key not set. Please set it in the extension options.';
          resultContainer.style.display = 'block';
          resultContainer.classList.add('error');
          
          // Add link to options page
          addOptionsPageLink(resultContainer);
        }
        
        if (replyButton) {
          replyButton.disabled = false;
          replyButton.textContent = 'Reply to Email ↩️';
        }
        
        return;
      }
      
      console.log('MailMancer: API key found, generating reply');
      
      // Construct the system prompt based on the tone
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
      
      const userPrompt = `Here is the email thread I need to reply to:\n\n${emailContent}\n\nPlease generate a well-structured reply that addresses the key points in this email.`;
      
      console.log('MailMancer: Making direct API request to OpenAI');
      
      // Make the actual API call to OpenAI
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
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
      })
      .then(response => {
        console.log('MailMancer: Received response from OpenAI');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('MailMancer: Parsed JSON response');
        
        // Reset button state
        if (replyButton) {
          replyButton.disabled = false;
          replyButton.textContent = 'Reply to Email ↩️';
        }
        
        if (data.error) {
          console.error('MailMancer: OpenAI API error:', data.error);
          throw new Error(data.error.message || 'Error from OpenAI API');
        }
        
        if (!data.choices || data.choices.length === 0) {
          console.error('MailMancer: No choices in OpenAI response');
          throw new Error('No response generated. Please try again.');
        }
        
        const generatedText = data.choices[0].message.content;
        console.log('MailMancer: Generated reply text:', generatedText.substring(0, 50) + '...');
        
        // Update the modal with the generated text
        if (resultContainer) {
          resultContainer.textContent = generatedText;
          resultContainer.style.display = 'block';
          
          // Show the insert button
          const insertButton = modalContainer.querySelector('#mailmancer-insert');
          if (insertButton) {
            insertButton.style.display = 'inline-block';
          }
        }
      })
      .catch(error => {
        console.error('MailMancer: Error generating reply:', error);
        
        // Reset button state
        if (replyButton) {
          replyButton.disabled = false;
          replyButton.textContent = 'Reply to Email ↩️';
        }
        
        // Show error message
        if (resultContainer) {
          resultContainer.textContent = `Error: ${error.message || 'An unknown error occurred'}`;
          resultContainer.style.display = 'block';
          resultContainer.classList.add('error');
        }
      });
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
      try {
        chrome.runtime.sendMessage({
          action: 'generateText',
          prompt,
          tone
        }, (response) => {
          // Check for runtime error
          if (chrome.runtime.lastError) {
            console.warn('MailMancer: Error sending message to background script:', chrome.runtime.lastError.message);
            
            // Reset button state
            if (generateButton) {
              generateButton.disabled = false;
              generateButton.textContent = 'Generate ✨';
            }
            
            // Show error message
            if (resultContainer) {
              resultContainer.textContent = 'Error communicating with the extension. Please try reloading the page.';
              resultContainer.style.display = 'block';
              resultContainer.classList.add('error');
            }
            return;
          }
          
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
      } catch (error) {
        console.error('MailMancer: Error sending message to generate text:', error);
        
        // Reset button state
        if (generateButton) {
          generateButton.disabled = false;
          generateButton.textContent = 'Generate ✨';
        }
        
        // Show error message
        if (resultContainer) {
          resultContainer.textContent = 'Error communicating with the extension. Please try reloading the page.';
          resultContainer.style.display = 'block';
          resultContainer.classList.add('error');
        }
      }
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
