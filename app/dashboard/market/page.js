
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { createClient } from "@/lib/supabase/client";

function formatRupiah(value) {
  if (value === null || value === undefined) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatNumber(value) {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("id-ID");
}

function formatDateTime(value) {
  if (!value) return "Belum tersedia";

  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StockLogo({ ticker, size = 42 }) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [ticker]);

  return (
    <div
      style={{
        ...styles.logo,
        width: size,
        height: size,
      }}
    >
      {!imageError ? (
        <img
          src={`/stocks/${ticker}.png`}
          alt={ticker}
          onError={() => setImageError(true)}
          style={styles.logoImage}
        />
      ) : (
        <span style={styles.logoFallback}>{ticker.slice(0, 4)}</span>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0].payload;

  return (
    <div style={styles.tooltip}>
      <strong>{formatRupiah(item.price)}</strong>
      <span>{formatDateTime(item.recorded_at)}</span>
    </div>
  );
}

export default function StockMarketPage() {
  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedTicker, setSelectedTicker] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [period, setPeriod] = useState("1D");

  const loadStocks = useCallback(async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("market_prices")
      .select("*")
      .order("ticker", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    setStocks(data || []);

    if (data && data.length > 0) {
      const latest = data
        .map((stock) => stock.updated_at)
        .filter(Boolean)
        .sort()
        .at(-1);

      setLastUpdated(latest || null);
    }
  }, []);

  const loadHistory = useCallback(async (ticker, selectedPeriod) => {
    if (!ticker) return;

    setHistoryLoading(true);
    setHistoryError("");
    setHistory([]);

    try {
      const response = await fetch(
        `/api/market/history?ticker=${encodeURIComponent(ticker)}&period=${selectedPeriod}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil riwayat harga.");
      }

      const chartData = (result.history || [])
        .filter(
          (item) =>
            item.last_price !== null &&
            item.last_price !== undefined
        )
        .map((item) => ({
          price: Number(item.last_price),
          recorded_at: item.recorded_at,
          label: new Date(item.recorded_at).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));

      setHistory(chartData);
    } catch (err) {
      setHistoryError(err.message || "Gagal mengambil data grafik.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    async function initialize() {
      await loadStocks();
      setLoading(false);
    }

    initialize();
  }, [loadStocks]);

  useEffect(() => {
    if (selectedTicker) {
      loadHistory(selectedTicker, period);
    }
  }, [selectedTicker, period, loadHistory]);

  async function handleSync() {
    if (syncing) return;

    setSyncing(true);
    setError("");
    setSyncMessage("");

    try {
      const response = await fetch("/api/market/sync", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Sinkronisasi gagal.");
      }

      await loadStocks();

      if (selectedTicker) {
        await loadHistory(selectedTicker, period);
      }

      setSyncMessage(
        `Berhasil memperbarui ${result.received} dari ${result.requested} saham.`
      );
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat sinkronisasi.");
    } finally {
      setSyncing(false);
    }
  }

  const filteredStocks = stocks.filter((stock) =>
    stock.ticker.toLowerCase().includes(search.toLowerCase())
  );

  const selectedStock = stocks.find(
    (stock) => stock.ticker === selectedTicker
  );

  const chartPrices = history.map((item) => item.price);
  const chartMin =
    chartPrices.length > 0 ? Math.min(...chartPrices) : 0;
  const chartMax =
    chartPrices.length > 0 ? Math.max(...chartPrices) : 0;
  const chartPadding = Math.max((chartMax - chartMin) * 0.15, chartMax * 0.002);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <Link href="/dashboard" style={styles.back}>
            ← Dashboard
          </Link>

          <h1 style={styles.title}>Stock Market</h1>
          <p style={styles.subtitle}>
            Indonesian stock market overview
          </p>
        </div>

        <div style={styles.marketBadge}>
          <span style={styles.dot}></span>
          IDX MARKET
        </div>
      </header>

      <section style={styles.summary}>
        <div style={styles.summaryCard}>
          <span>Total Stocks</span>
          <strong>{stocks.length}</strong>
        </div>

        <div style={styles.summaryCard}>
          <span>Market Data</span>
          <strong>
            {loading
              ? "Loading..."
              : stocks.length > 0
                ? "Available"
                : "No data"}
          </strong>
        </div>

        <div style={styles.summaryCard}>
          <span>Last Updated</span>
          <strong style={styles.updatedValue}>
            {formatDateTime(lastUpdated)}
          </strong>
        </div>
      </section>

      {selectedStock && (
        <section style={styles.detailPanel}>
          <div style={styles.detailHeader}>
            <div style={styles.detailIdentity}>
              <StockLogo ticker={selectedStock.ticker} size={58} />

              <div>
                <span style={styles.detailEyebrow}>STOCK DETAIL</span>
                <h2 style={styles.detailTicker}>
                  {selectedStock.ticker}
                </h2>
                <p style={styles.detailSubtitle}>
                  Indonesian Stock Exchange
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedTicker(null);
                setHistory([]);
              }}
              style={styles.closeButton}
            >
              ✕ Tutup
            </button>
          </div>

          <div style={styles.priceSection}>
            <span style={styles.detailLabel}>Last Traded Price</span>

            <strong style={styles.detailPrice}>
              {formatRupiah(selectedStock.last_price)}
            </strong>

            <div
              style={{
                ...styles.priceChange,
                color:
                  Number(selectedStock.price_change || 0) >= 0
                    ? "#00d69a"
                    : "#ff647c",
              }}
            >
              {Number(selectedStock.price_change || 0) > 0 ? "+" : ""}
              {formatRupiah(selectedStock.price_change)}
              {"  "}
              ({Number(selectedStock.change_percent || 0) > 0 ? "+" : ""}
              {Number(selectedStock.change_percent || 0).toFixed(2)}%)
            </div>
          </div>

          <div style={styles.detailGrid}>
            <div style={styles.detailItem}>
              <span>Volume (Lot)</span>
              <strong>{formatNumber(selectedStock.volume_lot)}</strong>
            </div>

            <div style={styles.detailItem}>
              <span>Frequency</span>
              <strong>{formatNumber(selectedStock.freq)}</strong>
            </div>

            <div style={styles.detailItem}>
              <span>Traded Value</span>
              <strong>{formatRupiah(selectedStock.traded_value)}</strong>
            </div>

            <div style={styles.detailItem}>
              <span>Quote Time</span>
              <strong>{selectedStock.data_ts || "Belum tersedia"}</strong>
            </div>

            <div style={styles.detailItem}>
              <span>Source Date</span>
              <strong>
                {selectedStock.source_date || "Belum tersedia"}
              </strong>
            </div>

            <div style={styles.detailItem}>
              <span>Market Status</span>
              <strong>
                {selectedStock.market_status || "Belum tersedia"}
              </strong>
            </div>
          </div>

          <div style={styles.detailFooter}>
            Data diperbarui: {formatDateTime(selectedStock.updated_at)}
          </div>

          <div style={styles.chartPanel}>
            <div style={styles.chartHeader}>
              <div>
                <h3 style={styles.chartTitle}>Price History</h3>
                <p style={styles.chartSubtitle}>
                  {selectedStock.ticker} · Historical price
                </p>
              </div>

              <div style={styles.periodButtons}>
                {["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"].map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPeriod(item)}
                      style={{
                        ...styles.periodButton,
                        ...(period === item
                          ? styles.periodButtonActive
                          : {}),
                      }}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>

            {historyLoading ? (
              <div style={styles.chartMessage}>
                Memuat grafik harga...
              </div>
            ) : historyError ? (
              <div style={styles.chartMessage}>
                {historyError}
              </div>
            ) : history.length === 0 ? (
              <div style={styles.chartMessage}>
                Belum ada data historis untuk periode ini.
                <p>
                  Jalankan Sync Prices untuk mulai mengumpulkan data.
                </p>
              </div>
            ) : (
              <>
                <div style={styles.chartStats}>
                  <div>
                    <span>Latest Recorded Price</span>
                    <strong>
                      {formatRupiah(history[history.length - 1].price)}
                    </strong>
                  </div>

                  <div>
                    <span>Recorded Points</span>
                    <strong>{history.length}</strong>
                  </div>
                </div>

                <div style={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={history}
                      margin={{
                        top: 15,
                        right: 15,
                        left: 5,
                        bottom: 5,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="stockGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#00d69a"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor="#00d69a"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        stroke="#263442"
                        strokeDasharray="4 4"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        stroke="#8292a5"
                        tick={{ fontSize: 10 }}
                        minTickGap={35}
                      />

                      <YAxis
                        domain={[
                          Math.max(0, chartMin - chartPadding),
                          chartMax + chartPadding,
                        ]}
                        stroke="#8292a5"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) =>
                          Number(value).toLocaleString("id-ID")
                        }
                        width={75}
                      />

                      <Tooltip content={<CustomTooltip />} />

                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#00d69a"
                        strokeWidth={2}
                        fill="url(#stockGradient)"
                        dot={history.length <= 20}
                        activeDot={{
                          r: 5,
                          fill: "#00d69a",
                          stroke: "#ffffff",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <p style={styles.chartFootnote}>
                  Grafik berdasarkan snapshot harga yang dikumpulkan MAJDAH.
                  Bukan data historis bursa sebelum perekaman dimulai.
                </p>
              </>
            )}
          </div>
        </section>
      )}

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <h2 style={styles.heading}>Market Watchlist</h2>
            <p style={styles.subtitle}>
              Harga saham dari IDX Edge PRO
            </p>
          </div>

          <div style={styles.actions}>
            <input
              type="text"
              placeholder="Cari kode saham..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={styles.search}
            />

            <button
              type="button"
              onClick={handleSync}
              disabled={syncing || loading}
              style={{
                ...styles.syncButton,
                opacity: syncing || loading ? 0.6 : 1,
                cursor: syncing || loading ? "not-allowed" : "pointer",
              }}
            >
              {syncing ? "Syncing..." : "↻ Sync Prices"}
            </button>
          </div>
        </div>

        {syncMessage && (
          <div style={styles.successMessage}>
            ✓ {syncMessage}
          </div>
        )}

        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={styles.message}>Memuat data saham...</p>
        ) : stocks.length === 0 && !error ? (
          <p style={styles.message}>Belum ada data harga saham.</p>
        ) : filteredStocks.length === 0 ? (
          <p style={styles.message}>Saham tidak ditemukan.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>STOCK</th>
                  <th style={styles.th}>LAST PRICE</th>
                  <th style={styles.th}>CHANGE</th>
                  <th style={styles.th}>CHANGE %</th>
                  <th style={styles.th}>VOLUME (LOT)</th>
                </tr>
              </thead>

              <tbody>
                {filteredStocks.map((stock) => {
                  const change = Number(stock.price_change || 0);
                  const positive = change >= 0;
                  const selected = selectedTicker === stock.ticker;

                  return (
                    <tr
                      key={stock.ticker}
                      onClick={() => {
                        setSelectedTicker(stock.ticker);
                        setPeriod("1D");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          setSelectedTicker(stock.ticker);
                          setPeriod("1D");
                        }
                      }}
                      tabIndex={0}
                      style={{
                        ...styles.stockRow,
                        background: selected ? "#172b2b" : "transparent",
                      }}
                    >
                      <td style={styles.td}>
                        <div style={styles.stockInfo}>
                          <StockLogo ticker={stock.ticker} size={34} />
                          <strong>{stock.ticker}</strong>
                        </div>
                      </td>

                      <td style={styles.td}>
                        {formatRupiah(stock.last_price)}
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          color: positive ? "#00d69a" : "#ff647c",
                        }}
                      >
                        {positive ? "+" : ""}
                        {formatRupiah(change)}
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          color:
                            Number(stock.change_percent || 0) >= 0
                              ? "#00d69a"
                              : "#ff647c",
                        }}
                      >
                        {Number(stock.change_percent || 0) > 0 ? "+" : ""}
                        {Number(stock.change_percent || 0).toFixed(2)}%
                      </td>

                      <td style={styles.td}>
                        {formatNumber(stock.volume_lot)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p style={styles.footer}>
          Menampilkan {filteredStocks.length} dari {stocks.length} saham.
          Klik salah satu saham untuk melihat detail dan grafiknya.
        </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "35px",
    background: "#080e14",
    color: "#f1f5f9",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
  },
  back: {
    color: "#00d69a",
    textDecoration: "none",
    fontSize: "13px",
  },
  title: {
    fontSize: "30px",
    margin: "12px 0 5px",
  },
  subtitle: {
    color: "#8292a5",
    fontSize: "13px",
    margin: "5px 0",
  },
  marketBadge: {
    border: "1px solid #145b48",
    borderRadius: "30px",
    padding: "10px 16px",
    color: "#00d69a",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#00d69a",
  },
  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginBottom: "25px",
  },
  summaryCard: {
    background: "#111a23",
    border: "1px solid #263442",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    color: "#8292a5",
    fontSize: "13px",
  },
  updatedValue: {
    color: "#f1f5f9",
    fontSize: "13px",
  },
  panel: {
    background: "#111a23",
    border: "1px solid #263442",
    borderRadius: "14px",
    padding: "22px",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "20px",
  },
  heading: {
    fontSize: "18px",
    margin: "0",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  search: {
    background: "#080e14",
    border: "1px solid #304151",
    borderRadius: "8px",
    color: "#ffffff",
    padding: "11px 14px",
    outline: "none",
    width: "220px",
    maxWidth: "100%",
  },
  syncButton: {
    background: "#00b987",
    border: "none",
    borderRadius: "8px",
    color: "#06140f",
    padding: "12px 17px",
    fontWeight: "bold",
    fontSize: "12px",
  },
  successMessage: {
    background: "#0c3027",
    color: "#00d69a",
    border: "1px solid #145b48",
    borderRadius: "8px",
    padding: "12px 15px",
    fontSize: "13px",
    marginBottom: "18px",
  },
  errorMessage: {
    background: "#351923",
    color: "#ff8496",
    border: "1px solid #6b2939",
    borderRadius: "8px",
    padding: "12px 15px",
    fontSize: "13px",
    marginBottom: "18px",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    minWidth: "650px",
  },
  th: {
    color: "#8292a5",
    fontSize: "11px",
    padding: "14px 12px",
    borderBottom: "1px solid #263442",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #202c38",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  stockRow: {
    cursor: "pointer",
    outline: "none",
  },
  stockInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logo: {
    borderRadius: "8px",
    background: "#1b2935",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  logoFallback: {
    color: "#00d69a",
    fontWeight: "bold",
    fontSize: "10px",
  },
  detailPanel: {
    background: "#111a23",
    border: "1px solid #145b48",
    borderRadius: "14px",
    padding: "24px",
    marginBottom: "25px",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
  },
  detailIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  detailEyebrow: {
    color: "#00d69a",
    fontSize: "10px",
    letterSpacing: "1.5px",
  },
  detailTicker: {
    fontSize: "24px",
    margin: "4px 0",
  },
  detailSubtitle: {
    color: "#8292a5",
    fontSize: "12px",
    margin: 0,
  },
  closeButton: {
    background: "#1b2935",
    border: "1px solid #304151",
    borderRadius: "8px",
    color: "#cbd5e1",
    padding: "9px 13px",
    cursor: "pointer",
  },
  priceSection: {
    marginTop: "28px",
    paddingBottom: "22px",
    borderBottom: "1px solid #263442",
  },
  detailLabel: {
    display: "block",
    color: "#8292a5",
    fontSize: "12px",
    marginBottom: "8px",
  },
  detailPrice: {
    display: "block",
    fontSize: "32px",
    marginBottom: "8px",
  },
  priceChange: {
    fontSize: "14px",
    fontWeight: "bold",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "20px",
    padding: "24px 0",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  detailFooter: {
    color: "#8292a5",
    fontSize: "11px",
    borderTop: "1px solid #263442",
    paddingTop: "15px",
  },
  chartPanel: {
    background: "#080e14",
    border: "1px solid #263442",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "22px",
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "20px",
  },
  chartTitle: {
    margin: 0,
    fontSize: "17px",
  },
  chartSubtitle: {
    color: "#8292a5",
    fontSize: "11px",
    margin: "6px 0 0",
  },
  periodButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
  },
  periodButton: {
    background: "#17232e",
    border: "1px solid #304151",
    borderRadius: "6px",
    color: "#8292a5",
    padding: "7px 10px",
    fontSize: "11px",
    cursor: "pointer",
  },
  periodButtonActive: {
    background: "#064e3b",
    borderColor: "#00d69a",
    color: "#00d69a",
  },
  chartStats: {
    display: "flex",
    flexWrap: "wrap",
    gap: "35px",
    marginBottom: "15px",
  },
  chartContainer: {
    width: "100%",
    height: "300px",
  },
  chartMessage: {
    minHeight: "220px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#8292a5",
    textAlign: "center",
    fontSize: "13px",
  },
  chartFootnote: {
    color: "#8292a5",
    fontSize: "10px",
    marginTop: "15px",
  },
  tooltip: {
    background: "#17232e",
    border: "1px solid #304151",
    borderRadius: "8px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "#ffffff",
    fontSize: "12px",
  },
  message: {
    color: "#8292a5",
    padding: "30px 0",
    textAlign: "center",
  },
  footer: {
    color: "#8292a5",
    fontSize: "11px",
    marginTop: "20px",
  },
};
