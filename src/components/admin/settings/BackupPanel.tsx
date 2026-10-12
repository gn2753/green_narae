"use client";
import { useRef, useState } from "react";
import { CalendarClock, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRepo } from "@/data/DataProvider";
import { useToday } from "@/data/hooks";
import type { DemoSnapshot } from "@/data/repository";
import { parseSnapshot } from "@/data/snapshot";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DemoResetCard } from "./DemoResetCard";
import { cardCls, ghostBtn, primaryBtn } from "./settingsUi";

const MAX_BYTES = 10 * 1024 * 1024;
const BAD_FILE = "그린나래 백업 파일이 아니에요. ‘전체 데이터 내려받기’로 받은 .json 파일을 골라주세요.";

export function BackupPanel() {
  const repo = useRepo();
  const today = useToday();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ snap: DemoSnapshot; name: string } | null>(null);
  const [error, setError] = useState("");

  const download = async () => {
    setBusy(true);
    try {
      const snap = await repo.exportAll();
      const url = URL.createObjectURL(new Blob([JSON.stringify(snap, null, 2)], { type: "application/json;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url; a.download = `그린나래_백업_${today}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("백업 파일을 내려받았어요");
    } catch { toast.error("내려받지 못했어요. 다시 시도해주세요."); }
    finally { setBusy(false); }
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (file.size > MAX_BYTES) { setError("파일이 너무 커요. 10MB 이하의 백업 파일만 불러올 수 있어요."); if (fileRef.current) fileRef.current.value = ""; return; }
    try {
      const snap = parseSnapshot(JSON.parse(await file.text()));
      setPending({ snap, name: file.name });
    } catch (e) {
      setError(e instanceof SyntaxError || !(e instanceof Error) ? BAD_FILE : e.message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <section className={cardCls}>
        <h2 className="text-sm font-bold">전체 데이터 백업</h2>
        <p className="mb-3 text-sm text-[#56645C]">고객·의뢰·업무·장부·설정을 파일 하나로 내려받아요. 파일은 이 컴퓨터에만 저장돼요.</p>
        <button type="button" className={primaryBtn} disabled={busy} onClick={download}><Download className="size-4" aria-hidden />전체 데이터 내려받기(JSON)</button>
      </section>

      <section className={cardCls}>
        <h2 className="text-sm font-bold">백업 파일로 되돌리기</h2>
        <p className="mb-3 text-sm text-[#56645C]">내려받아 둔 백업 파일을 고르면 그 시점의 데이터로 바꿔요. 지금 입력된 내용은 덮어써져요.</p>
        <input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-label="백업 파일 선택" onChange={e => void pick(e.target.files?.[0])} />
        <button type="button" className={ghostBtn} onClick={() => fileRef.current?.click()}><Upload className="size-4" aria-hidden />백업 파일로 되돌리기</button>
        {error && <p role="alert" className="mt-2 text-sm font-bold text-[#B3402A]">{error}</p>}
      </section>

      <section className="mb-4 flex min-w-0 items-start gap-3 rounded-xl border border-dashed border-[#D5DDD8] bg-white p-3 md:p-4">
        <CalendarClock className="mt-0.5 size-5 shrink-0 text-[#7A867F]" aria-hidden />
        <div><h2 className="text-sm font-bold">자동 백업 일정 <span className="ml-1 rounded-full bg-[#EEF1EF] px-2 py-0.5 text-xs font-medium text-[#56645C]">2차</span></h2>
          <p className="text-sm text-[#56645C]">실제 서버를 연결하는 2차에서 매일 자동으로 백업하는 기능을 붙일 예정이에요. 지금은 위 버튼으로 직접 받아 두세요.</p></div>
      </section>

      <DemoResetCard />

      <ConfirmDialog open={!!pending} onOpenChange={o => { if (!o) setPending(null); }} danger title="이 백업으로 되돌릴까요?"
        description={pending ? `‘${pending.name}’의 내용으로 지금 데이터를 모두 덮어써요. 되돌릴 수 없어요.` : undefined} confirmLabel="되돌리기"
        onConfirm={async () => {
          if (!pending) return;
          try { await repo.importAll(pending.snap); toast.success("백업 파일의 데이터로 되돌렸어요"); }
          catch (e) { toast.error(e instanceof Error ? e.message : "되돌리지 못했어요."); return false; }
        }} />
    </>
  );
}
