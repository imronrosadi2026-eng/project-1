
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STOCKS } from "@/lib/stocks";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Silakan login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const apiKey = process.env.IDX_EDGE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "API Key IDX belum tersedia.",
        },
        { status: 500 }
      );
    }

    const codes = STOCKS.join(",");

    const response = await fetch(
      `https://stock.arjum.com/api/price/list?codes=${encodeURIComponent(codes)}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil harga dari IDX Edge PRO.",
          provider_status: response.status,
        },
        { status: response.status }
      );
    }

    if (!result.stocks || typeof result.stocks !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Format data harga tidak sesuai.",
        },
        { status: 502 }
      );
    }

    const updatedAt = new Date().toISOString();

    const rows = Object.values(result.stocks).map((stock) => ({
      ticker: stock.code,
      last_price: stock.last_price ?? null,
      price_change: stock.change ?? null,
      change_percent: stock.change_pct ?? null,
      freq: stock.freq ?? null,
      volume_lot: stock.lot ?? null,
      volume: stock.lot != null ? Number(stock.lot) * 100 : null,
      traded_value: stock.value ?? null,
      source_date: stock.source_date ?? null,
      data_ts: stock.data_ts ?? null,
      quote_age_ms: stock.quote_age_ms ?? null,
      market_status: result.market?.status ?? null,
      updated_at: updatedAt,
    }));

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada harga saham yang diterima.",
        },
        { status: 502 }
      );
    }

    // Simpan harga terbaru ke market_prices
    const { error: databaseError } = await supabase
      .from("market_prices")
      .upsert(rows, { onConflict: "ticker" });

    if (databaseError) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal menyimpan harga ke Supabase.",
          error: databaseError.message,
        },
        { status: 500 }
      );
    }

    // Siapkan snapshot riwayat harga
    const historyRows = rows.map((stock) => ({
      ticker: stock.ticker,
      last_price: stock.last_price,
      price_change: stock.price_change,
      change_percent: stock.change_percent,
      volume_lot: stock.volume_lot,
      freq: stock.freq,
      traded_value: stock.traded_value,
      source_date: stock.source_date,
      data_ts: stock.data_ts,
      market_status: stock.market_status,
      recorded_at: updatedAt,
    }));

    // Simpan snapshot ke stock_price_history
    const { error: historyError } = await supabase
      .from("stock_price_history")
      .insert(historyRows);

    if (historyError) {
      return NextResponse.json(
        {
          success: false,
          message: "Harga terbaru tersimpan, tetapi riwayat harga gagal disimpan.",
          error: historyError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sinkronisasi harga dan penyimpanan riwayat berhasil.",
      requested: STOCKS.length,
      received: rows.length,
      history_saved: historyRows.length,
      updated_at: updatedAt,
      market: result.market ?? null,
      quota_cost: response.headers.get("X-Quota-Cost"),
      quota_remaining: response.headers.get("X-RateLimit-Remaining"),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat sinkronisasi.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
