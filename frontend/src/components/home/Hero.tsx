function Hero() {
  function handleExploreProducts() {
    const heroSection =
      document.querySelector('.hero')

    const productsSection =
      heroSection?.nextElementSibling

    productsSection?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function handleAskAI() {
    const aiSection =
      document.getElementById('ai')

    aiSection?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <section className="hero">
      <div className="hero-content">
        <span className="badge">
          AI-Powered Shopping
        </span>

        <h1>
          Shop smarter with
          <span> SmartCart</span>
        </h1>

        <p>
          Discover products, get intelligent
          recommendations, and find what you need
          with your AI shopping assistant.
        </p>

        <div className="hero-actions">
          <button
            type="button"
            className="primary-button"
            onClick={handleExploreProducts}
          >
            Explore Products
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={handleAskAI}
          >
            Ask AI Assistant
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero