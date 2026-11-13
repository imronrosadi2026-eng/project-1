
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "./portfolio.css";

export default function PortfolioPage() {
  const [supabase] = useState(() => createClient());
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPortfolio() {
      setLoading(true);
      setMessage("");

      const { data: portfolioData, error: portfolioError } =
        await supabase
          .from("portfolios")
          .select("*")
          .gt("quantity", 0)
          .order("ticker", { ascending: true });

      if (portfolioError) {
        setMessage(portfolioError.message);
        setLoading(false);
        return;
      }

      const holdings = portfolioData || [];

      if (holdings.length === 0) {
        setStocks([]);
        setLoading(false);
        return;
      }

      const tickers = holdings.map((stock) => stock.ticker);

      const { data: marketData, error: marketError } = await supabase
        .from("market_prices")
        .select("ticker, last_price, price_change, change_percent, updated_at")
        .in("ticker", tickers);

      if (marketError) {
        setMessage(
          "Portofolio berhasil dimuat, tetapi harga pasar gagal dimuat: " +
            marketError.message
        );
        setStocks(holdings);
        setLoading(false);
        return;
      }

      const marketMap = Object.fromEntries(
        (marketData || []).map((item) => [item.ticker, item])
      );

      const combinedStocks = holdings.map((stock) => ({
        ...stock,
        market: marketMap[stock.ticker] || null,
      }));

      setStocks(combinedStocks);
      setLoading(false);
    }

    loadPortfolio();
  }, [supabase]);

  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  function formatPercent(value) {
    return `${Number(value).toFixed(2).replace(".", ",")}%`;
  }

  const totalStocks = stocks.length;

  const totalShares = stocks.reduce(
    (total, stock) => total + Number(stock.quantity),
    0
  );

  const totalInvested = stocks.reduce(
    (total, stock) =>
      total + Number(stock.quantity) * Number(stock.average_price),
    0
  );

  const pricedStocks = stocks.filter(
    (stock) =>
      stock.market?.last_price !== null &&
      stock.market?.last_price !== undefined
  );

  const totalMarketValue = pricedStocks.reduce(
    (total, stock) =>
      total + Number(stock.quantity) * Number(stock.market.last_price),
    0
  );

  const totalInvestedWithPrice = pricedStocks.reduce(
    (total, stock) =>
      total + Number(stock.quantity) * Number(stock.average_price),
    0
  );

  const totalUnrealizedPL =
    totalMarketValue - totalInvestedWithPrice;

  const totalReturn =
    totalInvestedWithPrice > 0
      ? (totalUnrealizedPL / totalInvestedWithPrice) * 100
      : 0;

  const allStocksPriced = pricedStocks.length === stocks.length;

  function StockLogo({ ticker }) {
    const [imageError, setImageError] = useState(false);

    return (
      <div className="portfolio-stock-logo">
        {!imageError ? (
          <img
            src={`/stocks/${ticker}.png`}
            alt={`${ticker} logo`}
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{ticker.slice(0, 2)}</span>
        )}
      </div>
    );
  }

  return (
    <main className="portfolio-page">
      <header className="portfolio-header">
        <div>
          <Link href="/dashboard" className="portfolio-back">
            ← Kembali ke Dashboard
          </Link>
          <h1>My Portfolio</h1>
          <p>Pantau kepemilikan saham dan performa investasi Anda.</p>
        </div>

        <Link
          href="/dashboard/transactions"
          className="portfolio-add-button"
        >
          + Tambah Transaksi
        </Link>
      </header>

      <section className="portfolio-summary">
        <div className="portfolio-summary-card">
          <span>Total Saham</span>
          <h2>{totalStocks}</h2>
          <p>Emiten dimiliki</p>
        </div>

        <div className="portfolio-summary-card">
          <span>Total Lembar</span>
          <h2>{totalShares.toLocaleString("id-ID")}</h2>
          <p>Jumlah saham</p>
        </div>

        <div className="portfolio-summary-card">
          <span>Total Modal</span>
          <h2>{formatRupiah(totalInvested)}</h2>
          <p>Modal berdasarkan harga rata-rata</p>
        </div>

        <div className="portfolio-summary-card">
          <span>Market Value</span>
          <h2>
            {allStocksPriced
              ? formatRupiah(totalMarketValue)
              : `${formatRupiah(totalMarketValue)}*`}
          </h2>
          <p>
            {allStocksPriced
              ? "Nilai pasar seluruh saham"
              : `${pricedStocks.length} dari ${stocks.length} saham memiliki harga`}
          </p>
        </div>

        <div className="portfolio-summary-card">
          <span>Unrealized P/L</span>
          <h2
            className={
              totalUnrealizedPL > 0
                ? "portfolio-profit"
                : totalUnrealizedPL < 0
                  ? "portfolio-loss"
                  : ""
            }
          >
            {formatRupiah(totalUnrealizedPL)}
          </h2>
          <p>
            {allStocksPriced
              ? `Return ${formatPercent(totalReturn)}`
              : "Perhitungan saham yang sudah memiliki harga"}
          </p>
        </div>
      </section>

      <section className="portfolio-table-card">
        <div className="portfolio-table-heading">
          <div>
            <h2>Kepemilikan Saham</h2>
            <p>Harga pasar dan performa setiap saham.</p>
          </div>
          <span>{stocks.length} saham</span>
        </div>

        {loading ? (
          <div className="portfolio-empty">Memuat portofolio...</div>
        ) : message ? (
          <div className="portfolio-empty">{message}</div>
        ) : stocks.length === 0 ? (
          <div className="portfolio-empty">
            Belum ada saham dalam portofolio Anda.
          </div>
        ) : (
          <div className="portfolio-table-wrapper">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Saham</th>
                  <th>Lot</th>
                  <th>Lembar</th>
                  <th>Avg. Price</th>
                  <th>Last Price</th>
                  <th>Total Modal</th>
                  <th>Market Value</th>
                  <th>Unrealized P/L</th>
                </tr>
              </thead>

              <tbody>
                {stocks.map((stock) => {
                  const quantity = Number(stock.quantity);
                  const averagePrice = Number(stock.average_price);
                  const invested = quantity * averagePrice;
                  const lastPrice =
                    stock.market?.last_price !== null &&
                    stock.market?.last_price !== undefined
                      ? Number(stock.market.last_price)
                      : null;

                  const marketValue =
                    lastPrice !== null ? quantity * lastPrice : null;

                  const unrealizedPL =
                    marketValue !== null
                      ? marketValue - invested
                      : null;

                  const returnPercent =
                    invested > 0 && unrealizedPL !== null
                      ? (unrealizedPL / invested) * 100
                      : null;

                  return (
                    <tr key={stock.id}>
                      <td>
                        <div className="portfolio-stock-name">
                          <StockLogo ticker={stock.ticker} />
                          <strong>{stock.ticker}</strong>
                        </div>
                      </td>

                      <td>
                        {(quantity / 100).toLocaleString("id-ID")}
                      </td>

                      <td>{quantity.toLocaleString("id-ID")}</td>

                      <td>{formatRupiah(averagePrice)}</td>

                      <td>
                        {lastPrice !== null
                          ? formatRupiah(lastPrice)
                          : "Menunggu harga"}
                      </td>

                      <td>{formatRupiah(invested)}</td>

                      <td>
                        {marketValue !== null
                          ? formatRupiah(marketValue)
                          : "—"}
                      </td>

                      <td>
                        {unrealizedPL !== null ? (
                          <div
                            className={
                              unrealizedPL > 0
                                ? "portfolio-profit"
                                : unrealizedPL < 0
                                  ? "portfolio-loss"
                                  : ""
                            }
                          >
                            <strong>{formatRupiah(unrealizedPL)}</strong>
                            <small>
                              {formatPercent(returnPercent)}
                            </small>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="portfolio-price-note">
          * Market Value dan Unrealized P/L dihitung dari saham yang sudah
          memiliki harga pasar di MAJDAH.
        </p>
      </section>
    </main>
  );
}
