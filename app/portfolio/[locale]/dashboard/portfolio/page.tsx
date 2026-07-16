"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface Portfolio {
  id: string;
  name: string;
  currency: string;
  assets: { symbol: string; shares: number; avgCost: number }[];
}

export default function PortfolioPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ name: "", currency: "USD" });
  const [loading, setLoading]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId]   = useState<string | null>(null);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [renaming, setRenaming]     = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  async function fetchPortfolios() {
    const res = await fetch("/api/portfolio");
    if (res.ok) setPortfolios(await res.json());
  }

  useEffect(() => { fetchPortfolios(); }, []);
  useEffect(() => { if (editingId) editInputRef.current?.focus(); }, [editingId]);

  function startEdit(p: Portfolio) {
    setEditingId(p.id);
    setEditingName(p.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function handleRename(id: string) {
    const name = editingName.trim();
    if (!name) { cancelEdit(); return; }
    setRenaming(true);
    const res = await fetch(`/api/portfolio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setPortfolios((prev) => prev.map((p) => p.id === id ? { ...p, name } : p));
    }
    setEditingId(null);
    setEditingName("");
    setRenaming(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    setConfirmId(null);
    setDeletingId(null);
    await fetchPortfolios();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", currency: "USD" });
      await fetchPortfolios();
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">{t("portfolio.title")}</h1>
          <p className="text-sm text-muted mt-1">자산을 그룹별로 관리하세요</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-accent hover:opacity-90 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">{t("portfolio.create")}</span>
          <span className="sm:hidden">추가</span>
        </button>
      </div>

      {/* 생성 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-paper-2 border border-line rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-ink">{t("portfolio.create")}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-paper hover:text-ink transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1.5">{t("portfolio.name")}</label>
                <input
                  type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("portfolio.namePlaceholder")} required autoFocus
                  className="w-full bg-paper border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1.5">{t("portfolio.currency")}</label>
                <select
                  value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full bg-paper border border-line rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                >
                  <option value="USD">USD — 미국 달러</option>
                  <option value="KRW">KRW — 한국 원</option>
                  <option value="JPY">JPY — 일본 엔</option>
                  <option value="EUR">EUR — 유로</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-line text-muted py-3 rounded-xl text-sm font-medium hover:bg-paper hover:text-ink-soft transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 bg-accent hover:opacity-90 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
                >
                  {loading ? t("common.loading") : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-paper-2 border border-line rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-ink text-center mb-2">포트폴리오 삭제</h2>
            <p className="text-sm text-muted text-center mb-6">삭제하면 포트폴리오와 모든 자산 데이터가 영구적으로 삭제됩니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 border border-line text-muted py-3 rounded-xl text-sm font-medium hover:bg-paper hover:text-ink-soft transition-colors"
              >취소</button>
              <button
                onClick={() => handleDelete(confirmId)} disabled={deletingId === confirmId}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {deletingId === confirmId ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {portfolios.length === 0 ? (
        <div className="bg-paper-2 rounded-2xl border border-line p-12 sm:p-16 text-center">
          <div className="w-14 h-14 bg-paper rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-ink-soft font-medium mb-1">{t("dashboard.noPortfolio")}</p>
          <p className="text-muted text-sm mb-6">미국 주식, 한국 주식 등 테마별로 포트폴리오를 구성해보세요</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
          >
            + {t("portfolio.create")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolios.map((p, i) => {
            const colors = ["bg-accent", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
            const color = colors[i % colors.length];
            const isEditing = editingId === p.id;

            return (
              <div key={p.id} className="relative group">
                {isEditing ? (
                  <div className="bg-paper-2 rounded-2xl border border-accent/40 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                        {editingName.slice(0, 1).toUpperCase() || p.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(p.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="flex-1 min-w-0 font-semibold text-ink text-sm border-b-2 border-accent focus:outline-none bg-transparent py-0.5"
                          maxLength={100}
                        />
                        <button
                          onClick={() => handleRename(p.id)} disabled={renaming}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent hover:opacity-90 text-white shrink-0 disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-paper hover:text-ink-soft shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="h-px bg-line mb-4" />
                    <p className="text-xs text-muted">{p.assets.length}개 종목 · {p.currency}</p>
                  </div>
                ) : (
                  <Link href={`/portfolio/${locale}/dashboard/portfolio/${p.id}`}>
                    <div className="bg-paper-2 rounded-2xl border border-line p-6 hover:border-accent/40 transition-all cursor-pointer">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-ink group-hover:text-accent transition-colors truncate">{p.name}</h3>
                          <p className="text-xs text-muted">{p.assets.length}개 종목 · {p.currency}</p>
                        </div>
                        <svg className="w-4 h-4 text-muted group-hover:text-accent transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="h-px bg-line mb-4" />
                      <p className="text-xs text-muted">자산 추가하여 수익률을 추적하세요</p>
                    </div>
                  </Link>
                )}

                {!isEditing && (
                  <>
                    <button
                      onClick={(e) => { e.preventDefault(); startEdit(p); }}
                      className="absolute top-3 right-12 w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-accent hover:bg-accent-soft opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); setConfirmId(p.id); }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
