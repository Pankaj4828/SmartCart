import './App.css'

const products = [
  {
    name: 'Smart Laptop',
    category: 'Computers',
    price: '₹64,999',
    icon: '💻',
  },
  {
    name: 'Wireless Headphones',
    category: 'Audio',
    price: '₹4,999',
    icon: '🎧',
  },
  {
    name: 'Smart Watch',
    category: 'Wearables',
    price: '₹7,999',
    icon: '⌚',
  },
]

function App() {
  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <span className="brand-icon">🛒</span>
          <span>SmartCart</span>
        </div>

        <nav className="nav-links">
          <a href="#products">Products</a>
          <a href="#orders">Orders</a>
          <a href="#ai">AI Assistant</a>
        </nav>

        <button className="cart-button">
          🛒 Cart
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="badge">AI-Powered Shopping</span>

            <h1>
              Shop smarter with
              <span> SmartCart</span>
            </h1>

            <p>
              Discover products, get intelligent recommendations,
              and find what you need with your AI shopping assistant.
            </p>

            <div className="hero-actions">
              <button className="primary-button">
                Explore Products
              </button>

              <button className="secondary-button">
                Ask AI Assistant
              </button>
            </div>
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <div>
              <span className="section-label">Discover</span>
              <h2>Featured Products</h2>
            </div>

            <button className="view-all-button">
              View all →
            </button>
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.name}>
                <div className="product-image">
                  <span>{product.icon}</span>
                </div>

                <div className="product-info">
                  <span className="product-category">
                    {product.category}
                  </span>

                  <h3>{product.name}</h3>

                  <div className="product-footer">
                    <strong>{product.price}</strong>

                    <button className="add-button">
                      Add to cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ai-section" id="ai">
          <div>
            <span className="section-label">Smart Shopping</span>
            <h2>Your AI Shopping Assistant</h2>
            <p>
              Ask questions about products, compare options,
              and get recommendations based on what you're looking for.
            </p>
          </div>

          <button className="primary-button">
            Start Chat →
          </button>
        </section>
      </main>

      <footer>
        <p>© 2026 SmartCart · AI-Powered E-Commerce Platform</p>
      </footer>
    </div>
  )
}

export default App
