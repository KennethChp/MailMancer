import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [lastUsedTone, setLastUsedTone] = useState('professional')

  // Load API key and preferences from storage when popup opens
  useEffect(() => {
    chrome.storage.local.get(['openAIKey', 'lastUsedTone'], (result) => {
      if (result.openAIKey) {
        setApiKey(result.openAIKey)
      }
      if (result.lastUsedTone) {
        setLastUsedTone(result.lastUsedTone)
      }
    })
  }, [])

  // Save API key to storage
  const saveApiKey = () => {
    setStatus('saving')
    chrome.runtime.sendMessage(
      { action: 'setAPIKey', apiKey },
      (response) => {
        if (response && response.success) {
          setStatus('success')
          setTimeout(() => setStatus('idle'), 2000)
        } else {
          setStatus('error')
          setTimeout(() => setStatus('idle'), 2000)
        }
      }
    )
  }

  // Open Gmail in a new tab
  const openGmail = () => {
    chrome.tabs.create({ url: 'https://mail.google.com' })
  }

  // Show the keyboard shortcut help
  const showHelp = () => {
    alert('MailMancer Shortcuts:\n\nCtrl+Shift+M: Open MailMancer while composing an email')
  }

  return (
    <div className="min-h-[400px] w-[350px] bg-gray-900 text-white p-6">
      <header className="flex items-center mb-6">
        <div className="text-2xl font-bold mr-2">✨</div>
        <h1 className="text-xl font-semibold">MailMancer</h1>
      </header>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-medium mb-2">OpenAI API Key</h2>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="input w-full pr-10"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
            >
              {showApiKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm">
              {status === 'saving' && 'Saving...'}
              {status === 'success' && 'Saved successfully!'}
              {status === 'error' && 'Error saving key'}
            </span>
            <button onClick={saveApiKey} className="btn btn-primary text-sm">
              Save Key
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">Preferences</h2>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Default Tone</label>
            <select
              value={lastUsedTone}
              onChange={(e) => {
                setLastUsedTone(e.target.value)
                chrome.storage.local.set({ lastUsedTone: e.target.value })
              }}
              className="input w-full"
            >
              <option value="casual">Casual</option>
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="concise">Concise</option>
            </select>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={openGmail} className="btn btn-secondary text-sm">
              Open Gmail
            </button>
            <button onClick={showHelp} className="btn btn-secondary text-sm">
              Keyboard Shortcuts
            </button>
          </div>
        </section>

        <footer className="pt-4 text-center text-xs text-gray-500">
          <p>MailMancer v0.1.0</p>
          <p className="mt-1">Press Ctrl+Shift+M in Gmail to activate</p>
        </footer>
      </div>
    </div>
  )
}

export default App
