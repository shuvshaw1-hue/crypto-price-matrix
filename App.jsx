import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp, ArrowUpRight, ArrowDownRight, Search, RefreshCw,
  Activity, ChevronDown, SlidersHorizontal, Info, CircleDollarSign
} from "lucide-react";

// DEMO ONLY: sample quotes are fictional. Replace this data source with your API.
const INITIAL_MARKETS = [
  { exchange: "Binance", region: "Global", pairs: {
    BTC: { buy: 67250.12, sell: 67240.08 }, ETH: { buy: 3242.18, sell: 3240.91 },
    SOL: { buy: 148.55, sell: 148.45 }, XRP: { buy: 0.5804, sell: 0.5798 },
    DOGE: { buy: 0.1295, sell: 0.1293 }, ADA: { buy: 0.4512, sell: 0.4507 }
  }},
  { exchange: "Coinbase", region: "US", pairs: {
    BTC: { buy: 67290.45, sell: 67270.22 }, ETH: { buy: 3247.25, sell: 3243.60 },
    SOL: { buy: 149.20, sell: 149.00 }, XRP: { buy: 0.5820, sell: 0.5809 },
    DOGE: { buy: 0.1300, sell: 0.1296 }, ADA: { buy: 0.4528, sell: 0.4518 }
  }},
  { exchange: "Kraken", region: "Global", pairs: {
    BTC: { buy: 67210.35, sell: 67190.12 }, ETH: { buy: 3240.40, sell: 3237.10 },
    SOL: { buy: 148.30, sell: 148.10 }, XRP: { buy: 0.5799, sell: 0.5790 },
    DOGE: { buy: 0.1292, sell: 0.1290 }, ADA: { buy: 0.4502, sell: 0.4498 }
  }},
  { exchange: "KuCoin", region: "Global", pairs: {
    BTC: { buy: 67235.80, sell: 67218.40 }, ETH: { buy: 3243.10, sell: 3241.50 },
    SOL: { buy: 148.75, sell: 148.60 }, XRP: { buy: 0.5807, sell: 0.5800 },
    DOGE: { buy: 0.1297, sell: 0.1294 }, ADA: { buy: 0.4517, sell: 0.4510 }
  }},
  { exchange: "Bybit", region: "Global", pairs: {
    BTC: { buy: 67245.00, sell: 67230.25 }, ETH: { buy: 3241.80, sell: 3240.20 },
    SOL: { buy: 148.48, sell: 148.35 }, XRP: { buy: 0.5802, sell: 0.5796 },
    DOGE: { buy: 0.1294, sell: 0.1292 }, ADA: { buy: 0.4509, sell: 0.4504 }
  }}
];

const COINS = [
  { symbol: "BTC", name: "Bitcoin", icon: "₿", color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", icon: "◆", color: "#8b9cff" },
  { symbol: "SOL", name: "Solana", icon: "◎", color: "#9b87f5" },
  { symbol: "XRP", name: "XRP", icon: "✕", color: "#8da2b5" },
  { symbol: "DOGE", name: "Dogecoin", icon: "Ð", color: "#c9a63d" },
  { symbol: "ADA", name: "Cardano", icon: "●", color: "#3b82f6" }
];

const money = (value) => {
  if (value == null || !Number.isFinite(value)) return "—";
  const digits = value < 1 ? 5 : value < 100 ? 3 : 2;
  return "$" + value.toLocaleString("en-US", {
    minimumFractionDigits: value < 1 ? digits : 2,
    maximumFractionDigits: digits
  });
};

function App() {
  const [markets, setMarkets] = useState(INITIAL_MARKETS);
  const [search, setSearch] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState("All exchanges");
  const [quoteCurrency, setQuoteCurrency] = useState("USD");
  const [sortBy, setSortBy] = useState("exchange");
  const [showSpread, setShowSpread] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [status, setStatus] = useState("Demo data");

  const visibleCoins = useMemo(() => COINS.filter((coin) =>
    `${coin.symbol} ${coin.name}`.toLowerCase().includes(search.toLowerCase())
  ), [search]);

  const visibleMarkets = useMemo(() => {
    let result = markets.filter((market) =>
      exchangeFilter === "All exchanges" || market.exchange === exchangeFilter
    );
    if (sortBy === "spread") {
      result = [...result].sort((a, b) => {
        const spread = (m) => visibleCoins.length
          ? visibleCoins.reduce((sum, c) => sum + (m.pairs[c.symbol]?.buy - m.pairs[c.symbol]?.sell || 0), 0) / visibleCoins.length
          : 0;
        return spread(a) - spread(b);
      });
    } else {
      result = [...result].sort((a, b) => a.exchange.localeCompare(b.exchange));
    }
    return result;
  }, [markets, exchangeFilter, sortBy, visibleCoins]);

  const bestPrices = useMemo(() => {
    const result = {};
    visibleCoins.forEach((coin) => {
      const quotes = markets.map((m) => m.pairs[coin.symbol]).filter(Boolean);
      result[coin.symbol] = {
        lowestBuy: quotes.length ? Math.min(...quotes.map((q) => q.buy)) : null,
        highestSell: quotes.length ? Math.max(...quotes.map((q) => q.sell)) : null
      };
    });
    return result;
  }, [markets, visibleCoins]);

  // Optional visual-only demo refresh. It is NOT live market data.
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setMarkets((current) => current.map((market) => ({
        ...market,
        pairs: Object.fromEntries(Object.entries(market.pairs).map(([symbol, q]) => {
          const buy = q.buy * (1 + (Math.random() - 0.5) * 0.00025);
          const sell = Math.min(buy, q.sell * (1 + (Math.random() - 0.5) * 0.00025));
          return [symbol, { buy, sell }];
        }))
      })));
      setLastUpdated(new Date());
    }, 2500);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  function resetDemo() {
    setMarkets(INITIAL_MARKETS);
    setLastUpdated(new Date());
    setStatus("Demo data");
  }

  function formatPrice(value) {
    if (quoteCurrency === "USD") return money(value);
    // Sample data is USD-based; conversion is deliberately not fabricated.
    return money(value);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CryptoMatrix home">
          <span className="brand-mark"><ArrowDownUp size={20} /></span>
          <span>Crypto<span className="brand-accent">Matrix</span></span>
        </a>
        <nav className="main-nav">
          <a className="active" href="#markets">Markets</a>
          <a href="#comparison">Compare</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className="topbar-right">
          <span className="demo-pill"><span className="status-dot" /> {status}</span>
          <button className="icon-button" title="Reset demo prices" onClick={resetDemo}>
            <RefreshCw size={17} />
          </button>
        </div>
      </header>

      <main id="top" className="page-content">
        <section className="hero">
          <div>
            <div className="eyebrow"><Activity size={14} /> CRYPTO MARKET SCANNER</div>
            <h1>Compare crypto <span>buy & sell prices.</span></h1>
            <p className="hero-copy">Compare bid and ask prices across exchanges in one simple, spreadsheet-style view.</p>
          </div>
          <div className="hero-note">
            <Info size={17} />
            <span>Demo quotes only. Connect exchange APIs for real prices.</span>
          </div>
        </section>

        <section className="stats-grid" aria-label="Summary">
          <div className="stat-card">
            <span className="stat-label">Exchanges shown</span>
            <strong>{visibleMarkets.length}</strong>
            <span className="stat-foot">Supported demo venues</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Coins shown</span>
            <strong>{visibleCoins.length}</strong>
            <span className="stat-foot">Filter with search</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Price fields</span>
            <strong>{visibleCoins.length * 2}</strong>
            <span className="stat-foot">Buy (ask) + Sell (bid)</span>
          </div>
          <div className="stat-card updated-card">
            <span className="stat-label">Last refreshed</span>
            <strong>{lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</strong>
            <button className="text-button" onClick={() => setLastUpdated(new Date())}><RefreshCw size={13} /> Refresh timestamp</button>
          </div>
        </section>

        <section className="matrix-card" id="markets">
          <div className="section-heading">
            <div>
              <h2>Exchange price matrix</h2>
              <p>Each cell shows the buy and sell quote for one coin on one exchange.</p>
            </div>
            <div className="live-label"><span className="status-dot" /> {autoRefresh ? "Demo updating" : "Demo snapshot"}</div>
          </div>

          <div className="toolbar">
            <label className="search-box">
              <Search size={17} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search coin: BTC, Bitcoin, ETH..." />
              {search && <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
            </label>
            <label className="select-control">
              <SlidersHorizontal size={15} />
              <select value={exchangeFilter} onChange={(e) => setExchangeFilter(e.target.value)}>
                <option>All exchanges</option>
                {markets.map((m) => <option key={m.exchange}>{m.exchange}</option>)}
              </select>
              <ChevronDown size={14} />
            </label>
            <label className="select-control sort-control">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="exchange">Sort: Exchange name</option>
                <option value="spread">Sort: Average spread</option>
              </select>
              <ChevronDown size={14} />
            </label>
          </div>

          <div className="table-options">
            <label className="toggle-label">
              <input type="checkbox" checked={showSpread} onChange={(e) => setShowSpread(e.target.checked)} />
              <span className="toggle-track" />
              Show spread
            </label>
            <label className="toggle-label">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              <span className="toggle-track" />
              Animate demo quotes
            </label>
            <span className="table-hint"><span className="buy-dot" /> Buy / Ask <span className="sell-dot" /> Sell / Bid</span>
          </div>

          <div className="table-scroll" id="comparison">
            <table className="price-table">
              <thead>
                <tr>
                  <th className="exchange-head">Exchange <span className="muted-count">({visibleMarkets.length})</span></th>
                  {visibleCoins.map((coin) => (
                    <th key={coin.symbol} className="coin-head">
                      <div className="coin-heading">
                        <span className="coin-icon" style={{ "--coin-color": coin.color }}>{coin.icon}</span>
                        <span><b>{coin.symbol}</b><small>{coin.name}</small></span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleMarkets.map((market) => (
                  <tr key={market.exchange}>
                    <td className="exchange-cell">
                      <span className={`exchange-logo logo-${market.exchange.toLowerCase()}`}>{market.exchange.slice(0, 1)}</span>
                      <span><b>{market.exchange}</b><small>{market.region}</small></span>
                    </td>
                    {visibleCoins.map((coin) => {
                      const quote = market.pairs[coin.symbol];
                      if (!quote) return <td key={coin.symbol} className="price-cell"><span className="no-data">No market</span></td>;
                      const best = bestPrices[coin.symbol];
                      const lowestBuy = quote.buy === best?.lowestBuy;
                      const highestSell = quote.sell === best?.highestSell;
                      const spread = quote.buy - quote.sell;
                      const spreadPercent = quote.buy ? (spread / quote.buy) * 100 : 0;
                      return (
                        <td key={coin.symbol} className="price-cell">
                          <div className="quote-pair">
                            <div className={`quote-line buy-line ${lowestBuy ? "best-buy" : ""}`}>
                              <span className="quote-label">BUY</span>
                              <strong>{formatPrice(quote.buy)}</strong>
                              {lowestBuy && <span className="best-tag">LOW</span>}
                            </div>
                            <div className={`quote-line sell-line ${highestSell ? "best-sell" : ""}`}>
                              <span className="quote-label">SELL</span>
                              <strong>{formatPrice(quote.sell)}</strong>
                              {highestSell && <span className="best-tag">HIGH</span>}
                            </div>
                            {showSpread && <div className="spread-line">Spread {formatPrice(spread)} <span>({spreadPercent.toFixed(3)}%)</span></div>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {visibleMarkets.length === 0 && (
                  <tr><td className="empty-state" colSpan={visibleCoins.length + 1}>No exchanges match your filter.</td></tr>
                )}
                {visibleCoins.length === 0 && (
                  <tr><td className="empty-state" colSpan={visibleCoins.length + 1}>No coins match “{search}”. Try BTC, ETH, SOL, XRP, DOGE or ADA.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>Showing {visibleMarkets.length} exchanges × {visibleCoins.length} coins</span>
            <span>Prices are illustrative and not executable quotes.</span>
          </div>
        </section>

        <section className="legend-grid" id="how-it-works">
          <article className="legend-card">
            <span className="legend-icon buy-icon"><ArrowDownRight size={19} /></span>
            <div><h3>Buy price · Ask</h3><p>The lowest price a seller is currently asking for. Your actual fill can vary by order size and fees.</p></div>
          </article>
          <article className="legend-card">
            <span className="legend-icon sell-icon"><ArrowUpRight size={19} /></span>
            <div><h3>Sell price · Bid</h3><p>The highest price a buyer is currently bidding. Your actual proceeds depend on liquidity and fees.</p></div>
          </article>
          <article className="legend-card">
            <span className="legend-icon spread-icon"><CircleDollarSign size={19} /></span>
            <div><h3>Spread</h3><p>Buy price minus sell price for the same market. A smaller spread can indicate a tighter market, but fees still matter.</p></div>
          </article>
        </section>

        <footer className="footer">
          <span>© 2026 CryptoMatrix · Frontend prototype</span>
          <span><span className="status-dot" /> Demo mode — no trades are executed</span>
        </footer>
      </main>
    </div>
  );
}

export default App;