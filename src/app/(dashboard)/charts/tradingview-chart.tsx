"use client";

import * as React from "react";

// Convert internal symbol → TradingView symbol format
function toTVSymbol(symbol: string): string {
  const map: Record<string, string> = {
    // Metals
    XAUUSD: "TVC:GOLD", XAGUSD: "TVC:SILVER", XPTUSD: "TVC:PLATINUM",
    // Oil
    USOIL: "TVC:USOIL", UKOIL: "TVC:UKOIL", WTIUSD: "TVC:USOIL",
    // Indices
    US30: "FOREXCOM:US30", US500: "FOREXCOM:SPX500", NAS100: "FOREXCOM:NAS100",
    GER40: "FOREXCOM:GER40", UK100: "FOREXCOM:UK100", FRA40: "FOREXCOM:FRA40",
    JPN225: "FOREXCOM:JPN225", AUS200: "FOREXCOM:AUS200", HKG50: "FOREXCOM:HKG50",
    ESP35: "FOREXCOM:ESP35", ITA40: "FOREXCOM:ITA40",
    // Stocks
    AAPL: "NASDAQ:AAPL", MSFT: "NASDAQ:MSFT", GOOGL: "NASDAQ:GOOGL",
    AMZN: "NASDAQ:AMZN", TSLA: "NASDAQ:TSLA", META: "NASDAQ:META",
    NVDA: "NASDAQ:NVDA", NFLX: "NASDAQ:NFLX", AMD: "NASDAQ:AMD",
    BABA: "NYSE:BABA", ORCL: "NYSE:ORCL", CRM: "NYSE:CRM",
    // Crypto
    BTCUSD: "BINANCE:BTCUSDT", ETHUSD: "BINANCE:ETHUSDT", BNBUSD: "BINANCE:BNBUSDT",
    SOLUSD: "BINANCE:SOLUSDT", XRPUSD: "BINANCE:XRPUSDT", ADAUSD: "BINANCE:ADAUSDT",
    AVAXUSD: "BINANCE:AVAXUSDT", DOTUSD: "BINANCE:DOTUSDT", LINKUSD: "BINANCE:LINKUSDT",
    MATICUSD: "BINANCE:MATICUSDT", UNIUSD: "BINANCE:UNIUSDT", LTCUSD: "BINANCE:LTCUSDT",
    BCHUSD: "BINANCE:BCHUSDT", ATOMUSD: "BINANCE:ATOMUSDT", NEARUSD: "BINANCE:NEARUSDT",
    DOGEUSD: "BINANCE:DOGEUSDT", SHIBUSD: "BINANCE:SHIBUSDT", FTMUSD: "BINANCE:FTMUSDT",
    ALGOUSD: "BINANCE:ALGOUSDT", VETUSD: "BINANCE:VETUSDT", SANDUSD: "BINANCE:SANDUSDT",
    MANAUSD: "BINANCE:MANAUSDT", APEUSD: "BINANCE:APEUSDT", OPUSD: "BINANCE:OPUSDT",
    ARBUSD: "BINANCE:ARBUSDT", INJUSD: "BINANCE:INJUSDT", SUIUSD: "BINANCE:SUIUSDT",
    SEIUSD: "BINANCE:SEIUSDT", TIAUSD: "BINANCE:TIAUSDT",
  };
  if (map[symbol]) return map[symbol];
  // Forex pairs → FX: prefix
  return `FX:${symbol}`;
}

export function TradingViewChart({ symbol = "EURUSD", interval }: { symbol?: string; interval?: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tvSymbol = toTVSymbol(symbol);

  React.useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: interval ?? "60",
      timezone: "Europe/Bucharest",
      theme: "dark",
      style: "1",
      locale: "ro",
      backgroundColor: "rgba(9, 9, 11, 1)",
      gridColor: "rgba(39, 39, 42, 1)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [tvSymbol, interval]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full w-full" />
    </div>
  );
}
