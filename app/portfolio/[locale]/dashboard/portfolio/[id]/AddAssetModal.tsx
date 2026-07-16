"use client";

import { useState, useEffect, useRef } from "react";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  assetType: string;
  currency: string;
}

const CURRENCIES = ["USD", "KRW", "JPY", "EUR", "HKD", "GBP"];

function CurrencyTag({ c }: { c: string }) {
  return <span className="text-muted">{c === "KRW" ? "₩" : c === "JPY" ? "¥" : c === "EUR" ? "€" : c === "GBP" ? "£" : "$"}</span>;
}

interface ExistingAsset {
  id: string;
  symbol: string;
  shares: number;
  avgCost: number;
  currency: string;
}

interface Props {
  portfolioId: string;
  existingAssets?: ExistingAsset[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function AddAssetModal({ portfolioId, existingAssets = [], onSuccess, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [duplicate, setDuplicate] = useState<ExistingAsset | null>(null); // 중복 감지
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [form, setForm] = useState({ shares: "", avgCost: "", currency: "USD" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Search debounce */
  useEffect(() => {
    if (searchQuery.length < 1) { setSearchResults([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/portfolio/market/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) setSearchResults(await res.json());
      setSearching(false);
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  async function fetchPrice(symbol: string) {
    setFetchingPrice(true);
    try {
      const res = await fetch(`/api/portfolio/market/quote?symbols=${encodeURIComponent(symbol)}`);
      if (!res.ok) return null;
      return (await res.json())[symbol]?.price ?? null;
    } finally { setFetchingPrice(false); }
  }

  function checkDuplicate(symbol: string) {
    const dup = existingAssets.find((a) => a.symbol === symbol);
    setDuplicate(dup ?? null);
  }

  async function handleSelectResult(r: SearchResult) {
    setSelected(r);
    setForm((f) => ({ ...f, currency: r.currency }));
    setSearchResults([]);
    checkDuplicate(r.symbol);
    const price = await fetchPrice(r.symbol);
    setCurrentPrice(price);
    if (price) setForm((f) => ({ ...f, avgCost: price.toFixed(price >= 100 ? 2 : 4) }));
  }

  async function handleDirectInput() {
    const symbol = searchQuery.trim().toUpperCase();
    if (!symbol) return;
    setFetchingPrice(true);
    const res = await fetch(`/api/portfolio/market/quote?symbols=${encodeURIComponent(symbol)}`);
    setFetchingPrice(false);
    if (res.ok) {
      const q = (await res.json())[symbol];
      if (q) {
        const result: SearchResult = { symbol, name: q.name ?? symbol, exchange: q.exchange ?? "", assetType: "STOCK", currency: q.currency ?? "USD" };
        setSelected(result);
        setForm((f) => ({ ...f, currency: q.currency ?? "USD", avgCost: q.price ? q.price.toFixed(q.price >= 100 ? 2 : 4) : "" }));
        setCurrentPrice(q.price ?? null);
        checkDuplicate(symbol);
        return;
      }
    }
    setSelected({ symbol, name: symbol, exchange: "", assetType: "STOCK", currency: "USD" });
    setCurrentPrice(null);
    checkDuplicate(symbol);
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setSubmitError("");

    const newShares  = Number(form.shares);
    const newAvgCost = Number(form.avgCost);

    let res: Response;

    if (duplicate) {
      // 중복: 기존 레코드에 합산 (PUT)
      const totalShares  = duplicate.shares + newShares;
      const weightedAvg  =
        (duplicate.shares * duplicate.avgCost + newShares * newAvgCost) / totalShares;
      res = await fetch(`/api/portfolio/${portfolioId}/assets/${duplicate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shares: totalShares, avgCost: weightedAvg, currency: form.currency }),
      });
    } else {
      // 신규 추가 (POST)
      res = await fetch(`/api/portfolio/${portfolioId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selected.symbol,
          name: selected.name,
          assetType: selected.assetType,
          exchange: selected.exchange || "",
          currency: form.currency,
          shares: newShares,
          avgCost: newAvgCost,
        }),
      });
    }

    if (res.ok) { onSuccess(); onClose(); }
    else { const err = await res.json().catch(() => ({})); setSubmitError(err?.error ?? "추가 실패"); }
    setSubmitting(false);
  }

  const priceFmt = (n: number, cur: string) =>
    (cur === "KRW" || cur === "JPY")
      ? n.toLocaleString("ko-KR", { maximumFractionDigits: 0 })
      : n.toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-paper-2 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
          <h2 className="text-lg font-bold text-ink">자산 추가</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-paper transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-8 pb-8 flex-1">
          <div className="space-y-4">
            {!selected ? (
              <>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDirectInput()}
                    placeholder="AAPL, 삼성전자, BTC-USD …"
                    autoFocus
                    className="w-full border border-line rounded-xl px-4 py-3 pr-10 text-sm text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  {searching && <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
                </div>

                {searchResults.length > 0 && (
                  <div className="border border-line rounded-xl overflow-hidden shadow-sm">
                    {searchResults.map((r) => (
                      <button key={r.symbol} onClick={() => handleSelectResult(r)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent-soft transition-colors border-b border-line last:border-0">
                        <div>
                          <div className="font-semibold text-ink text-sm">{r.symbol}</div>
                          <div className="text-xs text-muted truncate max-w-[240px]">{r.name}</div>
                        </div>
                        <div className="text-right ml-2 shrink-0">
                          <div className="text-xs text-muted">{r.exchange}</div>
                          <div className="text-xs text-accent font-medium">{r.assetType}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 1 && !searching && searchResults.length === 0 && (
                  <button onClick={handleDirectInput} disabled={fetchingPrice}
                    className="w-full border border-dashed border-line rounded-xl px-4 py-3 text-sm text-muted hover:border-accent hover:text-accent hover:bg-accent-soft transition-colors flex items-center justify-center gap-2">
                    {fetchingPrice
                      ? <><div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />조회 중…</>
                      : <>&ldquo;{searchQuery.toUpperCase()}&rdquo; 직접 입력</>}
                  </button>
                )}
                <p className="text-xs text-muted text-center">검색 후 선택하거나 Enter로 직접 입력</p>
                <button onClick={onClose} className="w-full border border-line text-ink-soft py-2.5 rounded-xl text-sm font-medium hover:bg-paper">취소</button>
              </>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                {/* Ticker card */}
                <div className="bg-paper rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-ink">{selected.symbol}</div>
                    <div className="text-xs text-muted truncate max-w-[260px]">{selected.name}</div>
                  </div>
                  <button type="button" onClick={() => { setSelected(null); setCurrentPrice(null); setDuplicate(null); }}
                    className="text-muted hover:text-ink-soft w-6 h-6 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 중복 경고 배너 */}
                {duplicate && (
                  <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-xs font-semibold text-amber-700">이미 포트폴리오에 있는 종목</p>
                    </div>
                    <p className="text-xs text-amber-600">
                      기존: {duplicate.shares}주 · 평균매입가 {duplicate.avgCost.toLocaleString()} {duplicate.currency}
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      아래 수량·매입가를 입력하면 기존과 <strong>가중 평균으로 합산</strong>됩니다.
                    </p>
                  </div>
                )}

                {/* Current price */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted text-xs">현재가 (Yahoo Finance)</span>
                  {fetchingPrice
                    ? <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    : currentPrice !== null
                      ? <span className="font-semibold text-accent text-sm">{selected.currency === "KRW" ? "₩" : "$"}{priceFmt(currentPrice, selected.currency)}</span>
                      : <span className="text-xs text-muted">조회 실패</span>}
                </div>

                {/* Shares */}
                <div>
                  <label className="block text-sm font-medium text-ink-soft mb-1.5">수량 <span className="text-red-500">*</span></label>
                  <input type="number" value={form.shares} onChange={(e) => setForm({ ...form, shares: e.target.value })}
                    placeholder="0.00" required min="0.000001" step="any" autoFocus
                    className="w-full border border-line rounded-xl px-4 py-3 text-sm text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>

                {/* Currency + AvgCost */}
                <div>
                  <label className="block text-sm font-medium text-ink-soft mb-1.5">평균 매입가 <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value, avgCost: "" })}
                      className="border border-line rounded-xl px-3 py-3 text-sm text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent bg-paper">
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">
                        <CurrencyTag c={form.currency} />
                      </span>
                      <input type="number" value={form.avgCost} onChange={(e) => setForm({ ...form, avgCost: e.target.value })}
                        placeholder="0.00" required min="0.000001" step="any"
                        className="w-full border border-line rounded-xl pl-8 pr-4 py-3 text-sm text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                  </div>
                  {/* Return preview */}
                  {currentPrice !== null && form.avgCost && form.currency === selected.currency && (
                    <p className="text-xs text-muted mt-1.5">
                      현재가 대비{" "}
                      <span className={Number(form.avgCost) <= currentPrice ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                        {(((currentPrice - Number(form.avgCost)) / Number(form.avgCost)) * 100).toFixed(2)}%
                      </span>
                    </p>
                  )}
                </div>

                {submitError && <p className="text-sm text-red-600 bg-red-500/10 rounded-lg px-3 py-2">{submitError}</p>}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={onClose} className="flex-1 border border-line text-ink-soft py-3 rounded-xl text-sm font-medium hover:bg-paper">취소</button>
                  <button type="submit" disabled={submitting || !form.shares || !form.avgCost}
                    className="flex-1 bg-accent hover:opacity-90 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity">
                    {submitting ? (duplicate ? "합산 중…" : "추가 중…") : duplicate ? "합산하기" : "추가"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
