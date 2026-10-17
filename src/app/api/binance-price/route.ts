import { NextResponse } from "next/server";
import { requireUser } from "@/shared/lib/session";
import { fetchP2PPrice } from "@/shared/lib/binance";

// The USDT/VES P2P price for the dashboard. Fetched server-side because
// Binance doesn't allow calls from the browser
export async function GET(req: Request) {
  const { response } = await requireUser(req);
  if (response) return response;

  try {
    const price = await fetchP2PPrice();
    if (price === null) {
      return NextResponse.json(
        { message: "Binance no devolvió un precio" },
        { status: 502 },
      );
    }
    return NextResponse.json({ price });
  } catch (error) {
    console.error("Error fetching Binance P2P price:", error);
    return NextResponse.json(
      { message: "No se pudo obtener el precio de Binance" },
      { status: 502 },
    );
  }
}
