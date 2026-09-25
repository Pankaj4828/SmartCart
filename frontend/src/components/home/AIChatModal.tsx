import {
  useEffect,
  useState,
} from 'react'

import './AIChatModal.css'

interface AIChatModalProps {
  onClose: () => void
}

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
}

const API_BASE_URL =
  'http://localhost:8000'

function AIChatModal({
  onClose,
}: AIChatModalProps) {
  const [input, setInput] = useState('')

  const [messages, setMessages] =
    useState<ChatMessage[]>([
      {
        id: 1,
        role: 'assistant',
        content:
          'Hi! I can help you find products, compare options, and choose something that fits your needs.',
      },
    ])

  const [isLoading, setIsLoading] =
    useState(false)

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener(
      'keydown',
      handleEscape,
    )

    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      )

      document.body.style.overflow = ''
    }
  }, [onClose])

  function handleBackdropClick(
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    if (
      event.target === event.currentTarget
    ) {
      onClose()
    }
  }

  async function sendMessage(
    message: string,
  ) {
    const trimmedMessage =
      message.trim()

    if (
      !trimmedMessage ||
      isLoading
    ) {
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmedMessage,
    }

    setMessages((current) => [
      ...current,
      userMessage,
    ])

    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            message: trimmedMessage,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(
          'AI service request failed',
        )
      }

      const data: {
        response: string
      } = await response.json()

      const assistantMessage:
        ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
      }

      setMessages((current) => [
        ...current,
        assistantMessage,
      ])
    } catch {
      const errorMessage:
        ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content:
          'Sorry, I could not connect to the AI assistant right now. Please try again.',
      }

      setMessages((current) => [
        ...current,
        errorMessage,
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    void sendMessage(input)
  }

  function handleSuggestion(
    suggestion: string,
  ) {
    void sendMessage(suggestion)
  }

  return (
    <div
      className="ai-modal-overlay"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="ai-chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-chat-title"
      >
        <header className="ai-chat-header">
          <div className="ai-chat-identity">
            <div
              className="ai-avatar"
              aria-hidden="true"
            >
              ✦
            </div>

            <div>
              <strong id="ai-chat-title">
                SmartCart AI
              </strong>

              <span>
                Shopping Assistant
              </span>
            </div>
          </div>

          <button
            type="button"
            className="ai-close-button"
            onClick={onClose}
            aria-label="Close AI assistant"
          >
            ×
          </button>
        </header>

        <div className="ai-chat-body">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-message ${
                message.role === 'assistant'
                  ? 'ai-message-assistant'
                  : 'ai-message-user'
              }`}
            >
              {message.role ===
                'assistant' && (
                <div
                  className="ai-message-avatar"
                  aria-hidden="true"
                >
                  ✦
                </div>
              )}

              <div className="ai-message-content">
                {message.role ===
                  'assistant' && (
                  <span className="ai-message-name">
                    SmartCart AI
                  </span>
                )}

                <p>
                  {message.content}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="ai-message ai-message-assistant">
              <div
                className="ai-message-avatar"
                aria-hidden="true"
              >
                ✦
              </div>

              <div className="ai-message-content">
                <span className="ai-message-name">
                  SmartCart AI
                </span>

                <p>
                  Thinking...
                </p>
              </div>
            </div>
          )}

          {messages.length === 1 && (
            <div className="ai-suggestions">
              <span className="ai-suggestions-label">
                Try asking
              </span>

              <div className="ai-suggestion-list">
                <button
                  type="button"
                  className="ai-suggestion"
                  onClick={() =>
                    handleSuggestion(
                      'Find a laptop under ₹70,000',
                    )
                  }
                  disabled={isLoading}
                >
                  Find a laptop under ₹70,000
                </button>

                <button
                  type="button"
                  className="ai-suggestion"
                  onClick={() =>
                    handleSuggestion(
                      'Compare headphones',
                    )
                  }
                  disabled={isLoading}
                >
                  Compare headphones
                </button>

                <button
                  type="button"
                  className="ai-suggestion"
                  onClick={() =>
                    handleSuggestion(
                      'Recommend a smart watch',
                    )
                  }
                  disabled={isLoading}
                >
                  Recommend a smart watch
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="ai-chat-input-area">
          <form
            className="ai-chat-input"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              placeholder="Ask about products, prices, or recommendations..."
              aria-label="Ask SmartCart AI"
              disabled={isLoading}
            />

            <button
              type="submit"
              className="ai-send-button"
              disabled={
                !input.trim() ||
                isLoading
              }
              aria-label="Send message"
            >
              →
            </button>
          </form>

          <span className="ai-input-hint">
            {isLoading
              ? 'SmartCart AI is thinking...'
              : 'Powered by local AI'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default AIChatModal