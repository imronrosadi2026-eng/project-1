
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);

    const ticker = (searchParams.get("ticker") || "")
      .trim()
      .toUpperCase();

    const period = searchParams.get("period") || "1D";

    const allowedPeriods = {
      "1D": 1,
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "1Y": 365,
      ALL: null,
    };

    if (!/^[A-Z0-9]{2,10}$/.test(ticker)) {
      return NextResponse.json(
        {
          success: false,
          message: "Kode saham tidak valid.",
        },
        { status: 400 }
      );
    }

    if (!(period in allowedPeriods)) {
      return NextResponse.json(
        {
          success: false,
          message: "Periode tidak valid.",
        },
        { status: 400 }
      );
    }

    let query = supabase
      .from("stock_price_history")
      .select(
        "ticker,last_price,price_change,change_percent,volume_lot,traded_value,recorded_at"
      )
      .eq("ticker", ticker)
      .order("recorded_at", { ascending: true });

    const days = allowedPeriods[period];

    if (days !== null) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      query = query.gte("recorded_at", startDate.toISOString());
    }

    const { data, error } = await query.limit(5000);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil riwayat harga.",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticker,
      period,
      count: data.length,
      history: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
