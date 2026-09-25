import { useState } from 'react'

import AIChatModal from './AIChatModal'

function AISection() {
  const [isChatOpen, setIsChatOpen] =
    useState(false)

  return (
    <>
      <section
        className="ai-section"
        id="ai"
      >
        <div>
          <span className="section-label">
            Smart Shopping
          </span>

          <h2>
            Your AI Shopping Assistant
          </h2>

          <p>
            Ask questions about products, compare
            options, and get recommendations based
            on what you're looking for.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            setIsChatOpen(true)
          }
        >
          Start Chat →
        </button>
      </section>

      {isChatOpen && (
        <AIChatModal
          onClose={() =>
            setIsChatOpen(false)
          }
        />
      )}
    </>
  )
}

export default AISection