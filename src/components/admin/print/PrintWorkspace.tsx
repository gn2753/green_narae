"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { useCollection, useSettings } from "@/data/hooks";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { ExportPanel } from "./ExportPanel";
import PrintReport, { preparePrintReport } from "./PrintReport";
import { applyPrintFilter, EMPTY_FILTER, PrintFilters, type PrintFilterState, type PrintScope } from "./PrintFilters";

// 용지 전체(여백 8mm 포함) 210mm x 295mm 를 96dpi 로 환산
const PAPER_W = (210 / 25.4) * 96;
const PAPER_H = (295 / 25.4) * 96;

export function PrintWorkspace() {
  const params = useSearchParams();
  const tab = params.get("tab") === "export" ? "export" : "print";
  const tabs = [
    { label: "업무 인쇄", href: "/admin/print", active: tab === "print" },
    { label: "자료 내보내기", href: "/admin/print?tab=export", active: tab === "export" },
  ];
  return (
    <>
      <PageHeader title="자료·인쇄" description="업무 목록을 A4 한 장으로 인쇄하거나, 자료를 CSV로 내려받아요." tabs={tabs} />
      {tab === "print" ? <PrintTab /> : <ExportPanel />}
    </>
  );
}

function PrintTab() {
  const { items: tasks, loading } = useCollection("tasks");
  const settings = useSettings();
  const [scope, setScope] = useState<PrintScope>("all");
  const [filter, setFilter] = useState<PrintFilterState>(EMPTY_FILTER);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [generatedAt, setGeneratedAt] = useState(() => new Date().toISOString());
  const [portalReady, setPortalReady] = useState(false);

  const selected = useMemo(() => scope === "all" ? tasks : scope === "filter" ? applyPrintFilter(tasks, filter) : tasks.filter(t => picked.has(t.id)), [scope, tasks, filter, picked]);
  const scopeLabel = scope === "all" ? "전체 기간" : scope === "filter" ? "필터 적용" : "직접 선택";

  // 인쇄할 때는 이 페이지에서만 body 클래스를 달아 나머지 화면을 숨긴다.
  useEffect(() => {
    document.body.classList.add("printing-report");
    const t = setTimeout(() => setPortalReady(true), 0);
    return () => { clearTimeout(t); document.body.classList.remove("printing-report"); };
  }, []);

  // 미리보기 한 장 맞춤
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / PAPER_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, settings]);
  useLayoutEffect(() => {
    if (!settings) return;
    try { preparePrintReport("print-preview"); } catch { /* 아직 그려지지 않음 */ }
  }, [selected, settings]);

  const print = () => {
    if (!selected.length) { toast.error("인쇄할 업무가 없어요. 범위를 확인해주세요."); return; }
    setGeneratedAt(new Date().toISOString());
    // 새 출력 시각이 반영된 뒤 측정하고 인쇄
    requestAnimationFrame(() => requestAnimationFrame(() => {
      try { preparePrintReport("print-report"); preparePrintReport("print-preview"); window.print(); }
      catch (e) { toast.error(e instanceof Error ? e.message : "인쇄를 준비하지 못했어요."); }
    }));
  };

  if (loading || !settings) return <p className="py-10 text-center text-sm text-[#5F6B64]">업무를 불러오는 중이에요.</p>;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <PrintFilters tasks={tasks} settings={settings} scope={scope} onScope={setScope} filter={filter} onFilter={setFilter} picked={picked} onPicked={setPicked} />
        <div className="rounded-xl border border-[#E3E8E4] bg-white p-4">
          <p className="text-sm font-bold text-[#1F2A24]">인쇄 대상 {selected.length}건</p>
          <p className="mt-1 text-sm text-[#5F6B64]">A4 세로 한 장에 맞춰 자동으로 줄여서 인쇄해요. 인쇄 창에서 &apos;배경 그래픽&apos;을 켜면 파트별 색이 함께 나와요.</p>
          <button type="button" onClick={print} disabled={!selected.length}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[#2F8F57] px-4 text-sm font-bold text-white hover:bg-[#287A4A] disabled:opacity-50 sm:w-auto">
            <Printer className="size-4" aria-hidden />인쇄하기
          </button>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-bold text-[#1F2A24]">미리보기 (A4 세로)</p>
        <div ref={boxRef} className="overflow-hidden rounded-xl bg-[#E9EDEA] p-0">
          <div style={{ width: PAPER_W * scale, height: PAPER_H * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: PAPER_W, height: PAPER_H }}>
              <PrintReport id="print-preview" preview tasks={selected} settings={settings} generatedAt={generatedAt} scopeLabel={scopeLabel} />
            </div>
          </div>
        </div>
      </div>
      {portalReady && createPortal(
        <div className="print-portal"><PrintReport id="print-report" tasks={selected} settings={settings} generatedAt={generatedAt} scopeLabel={scopeLabel} /></div>,
        document.body,
      )}
    </div>
  );
}
