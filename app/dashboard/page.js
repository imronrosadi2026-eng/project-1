
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import "./dashboard.css";
import LogoutButton from "./logout-button";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  return new Date(value + "T00:00:00").toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const menu = [
  ["▦", "Dashboard", "/dashboard"],
  ["⇄", "Transactions", "/dashboard/transactions"],
  ["◈", "My Portfolio", "/dashboard/portfolio"],
  ["⌕", "Stock Market", "/dashboard/market"],
];

export default async function Dashboard() {
  const supabase = await createClient();

  const [
    { data: stocks, error: portfolioError },
    { data: transactions, error: transactionError },
  ] = await Promise.all([
    supabase
      .from("portfolios")
      .select("*")
      .gt("quantity", 0)
      .order("ticker", { ascending: true }),

    supabase
      .from("transactions")
      .select("*")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const portfolioData = stocks || [];
  const transactionData = transactions || [];

  let marketData = [];
  let marketError = null;

  if (portfolioData.length > 0) {
    const tickers = portfolioData.map((stock) => stock.ticker);

    const result = await supabase
      .from("market_prices")
      .select("ticker, last_price, change_percent, updated_at")
      .in("ticker", tickers);

    marketData = result.data || [];
    marketError = result.error;
  }

  const marketMap = Object.fromEntries(
    marketData.map((item) => [item.ticker, item])
  );

  const stocksWithPrices = portfolioData.map((stock) => ({
    ...stock,
    market: marketMap[stock.ticker] || null,
  }));

  const pricedStocks = stocksWithPrices.filter(
    (stock) =>
      stock.market?.last_price !== null &&
      stock.market?.last_price !== undefined
  );

  const totalStocks = portfolioData.length;

  const totalShares = portfolioData.reduce(
    (total, stock) => total + Number(stock.quantity),
    0
  );

  const totalInvested = portfolioData.reduce(
    (total, stock) =>
      total +
      Number(stock.quantity) * Number(stock.average_price),
    0
  );

  const totalMarketValue = pricedStocks.reduce(
    (total, stock) =>
      total +
      Number(stock.quantity) * Number(stock.market.last_price),
    0
  );

  const pricedInvested = pricedStocks.reduce(
    (total, stock) =>
      total +
      Number(stock.quantity) * Number(stock.average_price),
    0
  );

  const totalProfitLoss = totalMarketValue - pricedInvested;

  const totalReturn =
    pricedInvested > 0
      ? (totalProfitLoss / pricedInvested) * 100
      : 0;

  const allStocksPriced = pricedStocks.length === totalStocks;

  const marketValueLabel =
    totalStocks === 0
      ? formatRupiah(0)
      : pricedStocks.length > 0
        ? formatRupiah(totalMarketValue)
        : "Menunggu harga";

  const profitLossLabel =
    totalStocks === 0
      ? formatRupiah(0)
      : pricedStocks.length > 0
        ? formatRupiah(totalProfitLoss)
        : "Menunggu harga";

  const portfolio = [
    {
      label: "Market Value",
      value: marketValueLabel,
      change:
        totalStocks === 0
          ? "Belum ada saham"
          : `${pricedStocks.length} dari ${totalStocks} saham memiliki harga`,
    },
    {
      label: "Total Invested",
      value: formatRupiah(totalInvested),
      change: "Total modal saham",
    },
    {
      label: "Profit / Loss",
      value: profitLossLabel,
      change:
        pricedStocks.length === 0
          ? "Menunggu harga pasar"
          : `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}% return${
              allStocksPriced ? "" : " · sebagian saham"
            }`,
      profitLoss: true,
    },
    {
      label: "Total Stocks",
      value: totalStocks.toString(),
      change: `${totalShares.toLocaleString("id-ID")} lembar`,
    },
  ];

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <a href="/" className="logo">
          <img src="/logo/majdah.png" alt="MAJDAH" />
          <span>
            MAJDAH<span className="green">.</span>
          </span>
        </a>

        <p className="menu-title">MENU</p>

        {menu.map((item, index) => (
          <Link
            href={item[2]}
            className={`menu-item ${index === 0 ? "active" : ""}`}
            key={item[1]}
          >
            <span>{item[0]}</span>
            {item[1]}
          </Link>
        ))}

        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">M</div>
            <div>
              <strong>Investor</strong>
              <small>MAJDAH Account</small>
            </div>
          </div>

          <LogoutButton />
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome to your investment overview.</p>
          </div>

          <div className="market-status">
            <span className="status-dot"></span>
            IDX MARKET
          </div>
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow">INVESTMENT OVERVIEW</p>
            <h2>
              Build your wealth
              <br />
              with <span>MAJDAH.</span>
            </h2>
            <p>Monitor your Indonesian stock portfolio in one place.</p>
          </div>

          <div className="welcome-icon">↗</div>
        </section>

        <section className="stats-grid">
          {portfolio.map((item) => (
            <article className="stat-card" key={item.label}>
              <p>{item.label}</p>
              <h2
                className={
                  item.profitLoss
                    ? totalProfitLoss > 0
                      ? "portfolio-profit"
                      : totalProfitLoss < 0
                        ? "portfolio-loss"
                        : ""
                    : ""
                }
              >
                {item.value}
              </h2>
              <small>{item.change}</small>
            </article>
          ))}
        </section>

        {marketError && (
          <p className="empty-portfolio">
            Harga pasar belum dapat dimuat: {marketError.message}
          </p>
        )}

        <section className="content-grid">
          <article className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <h3>Portfolio Performance</h3>
                <p>Your investment growth over time</p>
              </div>
              <span className="period">1M</span>
            </div>

            <div className="empty-chart">
              <div className="chart-icon">⌁</div>
              <strong>Performance data unavailable</strong>
              <p>
                Historical portfolio performance will appear when
                historical price tracking is implemented.
              </p>
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <h3>My Portfolio</h3>
                <p>Your stock holdings</p>
              </div>

              <Link href="/dashboard/portfolio" className="view-all">
                View all
              </Link>
            </div>

            {portfolioError ? (
              <div className="empty-portfolio">
                Gagal memuat portofolio.
              </div>
            ) : portfolioData.length === 0 ? (
              <div className="empty-portfolio">
                <div>◈</div>
                <strong>No stocks owned</strong>
                <p>Your stock holdings will appear here.</p>
              </div>
            ) : (
              <div className="empty-portfolio">
                {stocksWithPrices.slice(0, 5).map((stock) => (
                  <div key={stock.id}>
                    <strong>{stock.ticker}</strong>
                    <p>
                      {(Number(stock.quantity) / 100).toLocaleString("id-ID")} lot
                      {" · "}
                      {stock.market?.last_price != null
                        ? formatRupiah(
                            Number(stock.quantity) *
                              Number(stock.market.last_price)
                          )
                        : "Menunggu harga"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="panel transactions">
          <div className="panel-heading">
            <div>
              <h3>Recent Transactions</h3>
              <p>Your latest investment activities</p>
            </div>

            <Link href="/dashboard/transactions" className="view-all">
              View all
            </Link>
          </div>

          {transactionError ? (
            <div className="empty-transactions">
              Gagal memuat transaksi.
            </div>
          ) : transactionData.length === 0 ? (
            <div className="empty-transactions">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="empty-transactions">
              {transactionData.map((item) => (
                <div key={item.id}>
                  <strong>
                    {item.ticker} · {item.transaction_type}
                  </strong>
                  <p>
                    {formatDate(item.transaction_date)}
                    {" · "}
                    {(Number(item.quantity) / 100).toLocaleString("id-ID")} lot
                    {" · "}
                    {formatRupiah(
                      Number(item.quantity) * Number(item.price)
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer>© 2026 MAJDAH. Investment Portfolio Tracker.</footer>
      </section>
    </main>
  );
}
