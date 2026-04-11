// AdPilot — Chat state hook
// Checkpoint 7 will implement full logic — stub for now.

import { useState } from 'react'

export const useChat = () => {
  const [messages, setMessages] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const addMessage = (role, content) => {
    setMessages((prev) => [...prev, { role, content, id: Date.now() }])
  }

  return { messages, isOpen, setIsOpen, loading, setLoading, addMessage }
}
