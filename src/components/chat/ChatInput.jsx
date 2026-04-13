import { useState } from 'react'

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('')

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-2 p-3 border-t border-gray-800 bg-gray-900">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about your campaigns..."
        disabled={disabled}
        rows={1}
        className="flex-1 bg-gray-800 text-gray-200 placeholder-gray-600 text-sm rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        style={{ maxHeight: '96px', overflowY: 'auto' }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-3 py-2 transition-colors shrink-0"
        aria-label="Send"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  )
}
