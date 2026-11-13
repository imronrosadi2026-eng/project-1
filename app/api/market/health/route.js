
export async function GET() {
  const apiKey = process.env.IDX_EDGE_API_KEY;

  if (!apiKey) {
    return Response.json(
      { success: false, message: "API Key belum ditemukan." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://stock.arjum.com/api/health",
      {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          message: "Koneksi API gagal.",
          status: response.status,
        },
        { status: response.status }
      );
    }

    return Response.json({
      success: true,
      message: "MAJDAH berhasil terhubung ke IDX Edge PRO.",
      data,
    });
  } catch {
    return Response.json(
      {
        success: false,
        message: "Tidak dapat menghubungi server IDX Edge PRO.",
      },
      { status: 500 }
    );
  }
}
