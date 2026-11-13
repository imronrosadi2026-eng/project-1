
import Link from "next/link";

const features = [
  {
    number: "01",
    icon: "▦",
    title: "Portfolio Tracking",
    description: "Pantau seluruh kepemilikan saham dan nilai investasi dalam satu tempat.",
  },
  {
    number: "02",
    icon: "↗",
    title: "Market Monitoring",
    description: "Pantau pergerakan harga saham Indonesia dengan pembaruan data pasar.",
  },
  {
    number: "03",
    icon: "％",
    title: "Profit & Loss",
    description: "Ketahui keuntungan dan kerugian investasi secara lebih terukur.",
  },
  {
    number: "04",
    icon: "⌁",
    title: "Investment Analytics",
    description: "Analisis performa portofolio melalui grafik dan laporan investasi.",
  },
];

const steps = [
  ["01", "Catat investasi", "Masukkan transaksi pembelian dan penjualan saham."],
  ["02", "Pantau pasar", "Lihat perkembangan harga saham Indonesia."],
  ["03", "Evaluasi hasil", "Analisis keuntungan dan kerugian portofolio."],
];

function Brand() {
  return (
    <Link href="/" className="brand">
      <img src="/logo/majdah.png" alt="MAJDAH Logo" />
      <span>MAJDAH<span className="brand-dot">.</span></span>
    </Link>
  );
}

export default function Home() {
  return (
    <main>
      <nav className="navbar">
        <Brand />

        <div className="nav-links">
          <a href="#home">Beranda</a>
          <a href="#features">Fitur</a>
          <a href="#about">Tentang</a>
        </div>

        <div className="nav-actions">
          <Link href="/login" className="nav-login">
            Login
          </Link>

          <Link href="/register" className="nav-button">
            Daftar Sekarang <span>↗</span>
          </Link>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="status-dot"></span>
            INDONESIAN STOCK PORTFOLIO PLATFORM
          </div>

          <h1>
            Investasi lebih terarah.
            <br />
            <span>Pantau setiap pertumbuhan.</span>
          </h1>

          <p className="hero-description">
            Kelola portofolio saham Indonesia, pantau pergerakan pasar,
            dan pahami perkembangan investasi dalam satu platform.
          </p>

          <div className="hero-actions">
            <Link href="/register" className="primary-button">
              Mulai Sekarang <span>→</span>
            </Link>
            <Link href="/login" className="secondary-button">
              Sudah punya akun? Login
            </Link>
          </div>

          <div className="hero-note">
            <span>●</span> Dibangun untuk investor Indonesia
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-glow"></div>

          <div className="dashboard-preview">
            <div className="preview-header">
              <div>
                <span className="preview-label">PORTFOLIO OVERVIEW</span>
                <h3>Investment Performance</h3>
              </div>
              <span className="live-label">● MARKET</span>
            </div>

            <div className="preview-balance">
              <span>Total Portfolio Value</span>
              <h2>Rp 125.450.000</h2>
              <span className="preview-gain">
                ↗ +8,45% <small>Simulasi performa</small>
              </span>
            </div>

            <div className="chart-area">
              <div className="chart-grid">
                <span>130M</span>
                <span>120M</span>
                <span>110M</span>
                <span>100M</span>
              </div>

              <svg viewBox="0 0 500 170" className="chart-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity=".28" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d="M0 140 C35 125 45 145 80 115 S125 120 155 95 S195 110 225 78 S270 90 300 65 S340 82 375 45 S420 65 450 30 S480 40 500 12 L500 170 L0 170 Z"
                  fill="url(#chartFill)"
                />

                <path
                  d="M0 140 C35 125 45 145 80 115 S125 120 155 95 S195 110 225 78 S270 90 300 65 S340 82 375 45 S420 65 450 30 S480 40 500 12"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            <div className="chart-period">
              <span>JAN</span>
              <span>FEB</span>
              <span>MAR</span>
              <span>APR</span>
              <span>MEI</span>
              <span>JUN</span>
            </div>

            <div className="preview-footer">
              <div><span>Portfolio</span><strong>Indonesia</strong></div>
              <div><span>Assets</span><strong>IDX Stocks</strong></div>
              <div><span>Platform</span><strong>MAJDAH</strong></div>
            </div>
          </div>

          <div className="floating-tag">✦ Invest with clarity</div>
        </div>
      </section>

      <section className="market-strip">
        <span>BUILT FOR INDONESIAN INVESTORS</span>
        <div>IDX <i>•</i> EQUITIES <i>•</i> PORTFOLIO <i>•</i> ANALYTICS</div>
      </section>

      <section className="features section" id="features">
        <div className="section-heading">
          <span className="section-label">OUR FEATURES</span>
          <h2>Semua investasi.<br /><span>Satu kendali.</span></h2>
          <p>
            Tools yang membantu kamu memahami dan mengelola perjalanan investasi.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <div className="feature-top">
                <span className="feature-icon">{feature.icon}</span>
                <span className="feature-number">{feature.number}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="feature-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section section" id="about">
        <div className="about-content">
          <span className="section-label">HOW IT WORKS</span>
          <h2>
            Kenali investasimu.
            <br />
            <span>Kendalikan masa depanmu.</span>
          </h2>
          <p>
            MAJDAH dirancang untuk membantu investor mencatat transaksi,
            memantau harga pasar, dan mengevaluasi performa portofolio saham.
          </p>
        </div>

        <div className="steps">
          {steps.map(([number, title, description]) => (
            <div className="step" key={number}>
              <span className="step-number">{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
              <span className="step-arrow">↗</span>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <span className="section-label">YOUR INVESTMENT JOURNEY</span>
        <h2>
          Bangun asetmu.
          <br />
          <span>Pahami pertumbuhannya.</span>
        </h2>
        <p>
          Mulai perjalanan investasi yang lebih terorganisir bersama MAJDAH.
        </p>
        <Link href="/register" className="primary-button">
          Daftar Sekarang ↑
        </Link>
      </section>

      <footer className="footer">
        <Brand />
        <p>Investment Portfolio Platform · Indonesia</p>
        <span>© 2026 MAJDAH. All rights reserved.</span>
      </footer>
    </main>
  );
}
