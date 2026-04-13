import { useState, useRef, useEffect } from 'react'
import { useReportContext } from '../../context/ReportContext'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

const STARTERS = [
  'Which tactic should I scale first?',
  'What are my best search terms?',
  'Where is my budget being wasted?',
  'How should I adjust my placement modifiers?',
  'Which ASINs are at risk?',
]

export default function ChatPanel({ open, onClose }) {
  const { summary, targetAcos, hasData } = useReportContext()
  const [messages, setMessages] = useState([]) // { role: 'user'|'assistant', content }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    setError(null)
    const userMsg = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: next.slice(-10).map(m => ({ role: m.role, content: m.content })),
          summary,
          targetAcos,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Request failed')

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-gray-900 border-l border-gray-800 flex flex-col z-40 transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
          <div>
            <p className="text-white font-semibold text-sm">AdPilot AI</p>
            <p className="text-gray-500 text-xs">Ask questions about your campaigns</p>
          </div>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setError(null) }}
                className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <EmptyState hasData={hasData} onStarter={sendMessage} />
          ) : (
            <>
              {messages.map((m, i) => (
                <ChatMessage key={i} role={m.role} content={m.content} />
              ))}
              {loading && <TypingIndicator />}
              {error && (
                <p className="text-red-400 text-xs text-center mt-2">{error}</p>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={loading || !hasData} />
        {!hasData && (
          <p className="text-gray-600 text-xs text-center pb-2">Upload reports to start chatting</p>
        )}
      </aside>
    </>
  )
}

function EmptyState({ hasData, onStarter }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-8">
      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center">
        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <div>
        <p className="text-gray-300 font-medium text-sm mb-1">Ask me anything about your data</p>
        <p className="text-gray-600 text-xs">I have full context on your campaigns, search terms, placements, and ASINs.</p>
      </div>
      {hasData && (
        <div className="w-full space-y-2 mt-2">
          {STARTERS.map((s, i) => (
            <button
              key={i}
              onClick={() => onStarter(s)}
              className="w-full text-left text-xs text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl px-3 py-2 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 mr-2">
        A
      </div>
      <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
