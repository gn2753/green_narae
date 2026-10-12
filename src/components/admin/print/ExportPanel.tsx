"use client";
import { useEffect, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useRepo, useToday } from "@/data/hooks";
import type { DemoSnapshot } from "@/data/repository";
import { toCsv } from "@/domain/csv";
import { exportSets } from "@/domain/exportSets";

type Key = keyof typeof exportSets;
const KEYS = Object.keys(exportSets) as Key[];

export function ExportPanel() {
  const repo = useRepo();
  const today = useToday();
  const [snap, setSnap] = useState<DemoSnapshot | null>(null);
  const [busy, setBusy] = useState<Key | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => { repo.exportAll().then(s => { if (alive) setSnap(s); }, () => { if (alive) toast.error("자료를 불러오지 못했어요."); }); };
    load();
    const off = repo.subscribe(load);
    return () => { alive = false; off(); };
  }, [repo]);

  const download = (k: Key) => {
    if (!snap) return;
    setBusy(k);
    try {
      const set = exportSets[k];
      const csv = toCsv(set.rows(snap.collections, snap.settings), set.columns);
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url; a.download = `그린나래_${set.label}_${today}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`${set.label} CSV를 내려받았어요.`);
    } catch { toast.error("내려받지 못했어요. 다시 시도해주세요."); }
    finally { setBusy(null); }
  };

  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {KEYS.map(k => {
          const set = exportSets[k];
          const n = snap ? set.rows(snap.collections, snap.settings).length : null;
          return (
            <li key={k} className="flex flex-col gap-3 rounded-xl border border-[#E3E8E4] bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#EAF4EE] text-[#2F8F57]"><FileSpreadsheet className="size-5" aria-hidden /></span>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#1F2A24]">{set.label}</h3>
                  <p className="mt-0.5 text-sm text-[#5F6B64]">{set.description}</p>
                  <p className="mt-1 text-sm font-semibold text-[#1F2A24]">{n === null ? "불러오는 중" : `${n.toLocaleString("ko-KR")}건`}</p>
                </div>
              </div>
              <button type="button" onClick={() => download(k)} disabled={!snap || busy === k || n === 0}
                className="mt-auto inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#2F8F57] px-3 text-sm font-bold text-white hover:bg-[#287A4A] disabled:opacity-50">
                <Download className="size-4" aria-hidden />CSV 내려받기
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-[#5F6B64]">엑셀에서 바로 열 수 있어요(한글 깨짐 없음). 금액은 숫자만, 날짜는 YYYY-MM-DD로 담겨요.</p>
    </div>
  );
}
