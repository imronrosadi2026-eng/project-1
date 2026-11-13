
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "./transactions.css";

export default function TransactionsPage() {
  const [supabase] = useState(() => createClient());

  const [ticker, setTicker] = useState("");
  const [type, setType] = useState("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState("0");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function loadTransactions() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setSuccess(false);
    } else {
      setTransactions(data || []);
    }

    setLoadingData(false);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setSuccess(false);

    const { data, error } = await supabase.rpc(
      "create_stock_transaction",
      {
        p_ticker: ticker.trim().toUpperCase(),
        p_transaction_type: type,
        p_quantity: Number(quantity) * 100,
        p_price: Number(price),
        p_fees: Number(fees || 0),
        p_transaction_date: date,
        p_notes: notes.trim() || null,
      }
    );

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setMessage("Transaksi berhasil disimpan!");

    setTicker("");
    setType("BUY");
    setQuantity("");
    setPrice("");
    setFees("0");
    setDate("");
    setNotes("");

    await loadTransactions();

    setLoading(false);
  }

  async function handleDelete(id) {
    setMessage("");
    setSuccess(false);

    setMessage(
      "Penghapusan transaksi sementara dinonaktifkan agar data portofolio tetap konsisten."
    );
  }

  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value));
  }

  function formatDate(value) {
    return new Date(value + "T00:00:00").toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="transaction-page">
      <header className="transaction-header">
        <div>
          <Link href="/dashboard" className="back-link">
            ← Kembali ke Dashboard
          </Link>
          <h1>Transactions</h1>
          <p>Kelola seluruh transaksi saham Anda.</p>
        </div>
      </header>

      <section className="transaction-card">
        <h2>Tambah Transaksi</h2>
        <p className="transaction-description">
          Catat pembelian dan penjualan saham BEI.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="transaction-field">
            <label>Kode Saham</label>
            <input
              type="text"
              placeholder="Contoh: BBCA"
              value={ticker}
              onChange={(e) =>
                setTicker(
                  e.target.value.toUpperCase().replace(/\s/g, "")
                )
              }
              maxLength={6}
              required
            />
          </div>

          <div className="transaction-field">
            <label>Jenis Transaksi</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="BUY">BUY - Beli</option>
              <option value="SELL">SELL - Jual</option>
            </select>
          </div>

          <div className="transaction-row">
            <div className="transaction-field">
              <label>Jumlah Lot</label>
              <input
                type="number"
                placeholder="Contoh: 1"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="transaction-field">
              <label>Harga per Lembar (Rp)</label>
              <input
                type="number"
                placeholder="Contoh: 5000"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="transaction-row">
            <div className="transaction-field">
              <label>Biaya Transaksi (Rp)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
              />
            </div>

            <div className="transaction-field">
              <label>Tanggal Transaksi</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="transaction-field">
            <label>Catatan (Opsional)</label>
            <textarea
              placeholder="Catatan transaksi..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
            />
          </div>

          {message && (
            <p
              className={
                success ? "transaction-success" : "transaction-error"
              }
            >
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </form>
      </section>

      <section className="transaction-history">
        <div className="history-heading">
          <div>
            <h2>Riwayat Transaksi</h2>
            <p>Semua aktivitas investasi Anda.</p>
          </div>

          <span>{transactions.length} transaksi</span>
        </div>

        {loadingData ? (
          <div className="history-empty">Memuat transaksi...</div>
        ) : transactions.length === 0 ? (
          <div className="history-empty">
            Belum ada transaksi. Silakan catat pembelian saham pertama Anda.
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Saham</th>
                  <th>Tipe</th>
                  <th>Lot</th>
                  <th>Harga</th>
                  <th>Nilai</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.transaction_date)}</td>
                    <td className="history-ticker">{item.ticker}</td>
                    <td>
                      <span
                        className={`type-badge ${item.transaction_type.toLowerCase()}`}
                      >
                        {item.transaction_type}
                      </span>
                    </td>
                    <td>{Number(item.quantity) / 100}</td>
                    <td>{formatRupiah(item.price)}</td>
                    <td>
                      {formatRupiah(
                        Number(item.quantity) * Number(item.price)
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="delete-transaction"
                        onClick={() => handleDelete(item.id)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
