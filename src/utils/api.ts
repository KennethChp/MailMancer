import OpenAI from 'openai';

// Types for API responses
export interface GenerateTextResponse {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Generate text using OpenAI API
 * @param prompt The user's prompt
 * @param tone The desired tone (casual, professional, friendly, concise)
 * @param apiKey OpenAI API key
 */
export async function generateText(
  prompt: string,
  tone: 'casual' | 'professional' | 'friendly' | 'concise',
  apiKey: string
): Promise<GenerateTextResponse> {
  if (!apiKey) {
    return {
      success: false,
      error: 'OpenAI API key is not set. Please set it in the extension options.'
    };
  }

  try {
    // Create OpenAI client
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Required for browser usage
    });

    // Construct the system prompt based on the tone
    let systemPrompt = 'You are a helpful assistant that writes email responses.';
    
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

    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    // Extract the generated text
    const generatedText = response.choices[0]?.message?.content;

    if (!generatedText) {
      return {
        success: false,
        error: 'No response generated'
      };
    }

    return {
      success: true,
      text: generatedText
    };
  } catch (error) {
    console.error('Error generating text:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}
