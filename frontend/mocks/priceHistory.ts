import { PriceCandle } from "@/types";

export function generateMockCandles(
  basePrice: number,
  trend: "up" | "down" | "flat" = "up",
  days: number = 60
): PriceCandle[] {
  const candles: PriceCandle[] = [];
  let price = basePrice;
  const startDate = new Date(2026, 5, 1); // June 1, 2026

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = date.toISOString().split("T")[0];

    const volatility = price * 0.02;
    const delta =
      trend === "up"
        ? (Math.random() - 0.44) * volatility
        : trend === "down"
        ? (Math.random() - 0.56) * volatility
        : (Math.random() - 0.5) * volatility;

    const open = Math.round(price);
    const close = Math.round(price + delta);
    const high = Math.round(Math.max(open, close) + Math.random() * volatility * 0.7);
    const low = Math.round(Math.min(open, close) - Math.random() * volatility * 0.7);
    const volume = Math.round(15000000 + Math.random() * 45000000);

    price = close;

    candles.push({
      time: dateStr,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  // Calculate simple moving averages
  return candles.map((candle, idx) => {
    let ma20: number | undefined;
    let ma50: number | undefined;

    if (idx >= 19) {
      const slice20 = candles.slice(idx - 19, idx + 1);
      ma20 = Math.round(slice20.reduce((acc, c) => acc + c.close, 0) / 20);
    }
    if (idx >= 49) {
      const slice50 = candles.slice(idx - 49, idx + 1);
      ma50 = Math.round(slice50.reduce((acc, c) => acc + c.close, 0) / 50);
    }

    return {
      ...candle,
      ma20,
      ma50,
    };
  });
}

export const MOCK_CANDLES_BY_TICKER: Record<string, PriceCandle[]> = {
  "BBRI.JK": generateMockCandles(4700, "up", 75),
  "BRIS.JK": generateMockCandles(2300, "up", 75),
  "SIDO.JK": generateMockCandles(630, "down", 75),
  "ASII.JK": generateMockCandles(5200, "down", 75),
  "GOTO.JK": generateMockCandles(65, "down", 75),
};
