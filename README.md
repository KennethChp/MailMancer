# ✨ MailMancer

MailMancer is a Chrome extension designed to assist users in writing and replying to emails using AI. The tool integrates with web-based email clients like Gmail and provides a minimal, on-demand modal interface where users can enter a prompt, select a tone, and generate well-crafted messages.

![MailMancer Screenshot](screenshot.png)

## 🚀 Features

- **AI-Powered Email Writing**: Generate professional email responses with a single click
- **Tone Selection**: Choose from casual, professional, friendly, or concise tones
- **Seamless Gmail Integration**: Works directly in your Gmail compose window
- **Keyboard Shortcuts**: Quick access with Ctrl+Shift+M
- **Dark Theme**: Sleek, Apple-inspired dark UI
- **Privacy-Focused**: Your API key stays on your device

## 🔧 Installation

### Development Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/MailMancer.git
   cd MailMancer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder from this project

### Using the Extension

1. Click the MailMancer icon in your Chrome toolbar to open the popup
2. Enter your OpenAI API key in the settings
3. Navigate to Gmail and start composing an email
4. Press `Ctrl+Shift+M` to open the MailMancer modal
5. Enter your prompt, select a tone, and click "Generate"
6. Review the generated text and click "Insert" to add it to your email

## 🛠️ Tech Stack

- **Frontend**: TypeScript, React, TailwindCSS
- **State Management**: Zustand
- **Build Tools**: Vite
- **API Integration**: OpenAI API
- **Storage**: Chrome Storage API

## 📝 Usage

### Keyboard Shortcuts

- `Ctrl+Shift+M`: Open MailMancer while composing an email

### Tone Options

- **Casual**: Relaxed and conversational, as if writing to a friend
- **Professional**: Formal and business-appropriate
- **Friendly**: Warm and personable while maintaining professionalism
- **Concise**: Brief and to-the-point
