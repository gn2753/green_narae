"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, LoaderCircle, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AttachmentPicker } from "@/components/common/AttachmentPicker";
import { DateField } from "@/components/common/DateField";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { PortfolioDialog } from "@/components/site/portfolio/PortfolioDialog";
import { useCollection, useMutation, useRepo, useSettings, useToday } from "@/data/hooks";
import { ConflictError } from "@/data/errors";
import { maskName } from "@/domain/portfolio";
import type { Attachment, ISODate, Portfolio } from "@/domain/types";
import { savePortfolio } from "@/services/contentService";
import { asset } from "@/lib/asset";
import { ImageOrderList } from "./ImageOrderList";

const FORM_ID = "portfolio-form";
const ghost = "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50 md:min-h-10";

/** 시공사례 편집기(전체 화면). portfolio = null 이면 새 사례. */
export function PortfolioEditor({ portfolio, onClose }: { portfolio: Portfolio | null; onClose: () => void }) {
  const repo = useRepo();
  const today = useToday();
  const settings = useSettings();
  const projects = useCollection("projects");
  const customers = useCollection("customers");
  const { run, busy } = useMutation();
  const project = portfolio?.projectId ? projects.items.find(p => p.id === portfolio.projectId) : undefined;
  const linkedCustomer = project ? customers.items.find(c => c.id === project.customerId) : undefined;

  const [base] = useState(portfolio); // 열 때의 버전을 기준으로 저장(다른 탭·사람이 그 사이 고치면 충돌 안내)
  const [title, setTitle] = useState(portfolio?.title ?? "");
  const [signType, setSignType] = useState(portfolio?.signType ?? "");
  const [region, setRegion] = useState(portfolio?.region ?? "세종");
  const [completedOn, setCompletedOn] = useState<ISODate | "">(portfolio?.completedOn ?? today);
  const [client, setClient] = useState(portfolio?.clientDisplayName ?? "");
  const [realName, setRealName] = useState("");
  const [description, setDescription] = useState(portfolio?.description ?? "");
  const [cover, setCover] = useState<Attachment | null>(portfolio?.cover ?? null);
  const [images, setImages] = useState<Attachment[]>(portfolio?.images ?? []);
  const [published, setPublished] = useState(portfolio?.published ?? false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  const signOptions = [{ value: "", label: "종류 선택" }, ...Array.from(new Set([...(settings?.signTypes ?? []), ...(signType ? [signType] : [])])).map(v => ({ value: v, label: v }))];
  const isPlaceholder = cover?.id === "placeholder";

  const suggest = () => {
    const name = realName.trim() || (linkedCustomer ? linkedCustomer.company ?? linkedCustomer.name : "");
    if (!name) { toast.error("실제 거래처 이름을 먼저 입력해주세요."); return; }
    setClient(`${region.trim() ? region.trim() + " " : ""}${maskName(name)}`);
  };
  const makeCover = (i: number) => {
    const picked = images[i]; if (!picked) return;
    const next = [...images];
    if (cover) next[i] = cover; else next.splice(i, 1);
    setImages(next); setCover(picked);
    toast.success("대표 이미지를 바꿨어요");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    const saved = await run(
      () => savePortfolio(repo, { title, signType, region, completedOn, clientDisplayName: client, description, cover, images, published }, base).catch(er => {
        // 충돌이면 편집기를 닫고, 다시 열어 최신 내용으로 고치도록 안내한다
        if (er instanceof ConflictError) { onClose(); throw new Error("다른 곳에서 먼저 수정되었어요. 편집 창을 닫았으니 다시 열어 최신 내용으로 수정해주세요."); }
        setError(er instanceof Error ? er.message : "저장하지 못했어요.");
        throw er;
      }),
      portfolio ? "시공사례를 저장했어요" : "시공사례를 등록했어요", { exclusive: true });
    if (saved) onClose();
  };

  const draft: Portfolio | null = cover ? {
    id: portfolio?.id ?? "preview", createdAt: "", updatedAt: "", version: 0, order: portfolio?.order ?? 0,
    title: title.trim() || "(제목 없음)", signType: signType || "-", region: region || "-", completedOn: completedOn || today,
    clientDisplayName: client, description, cover, images, published,
  } : null;
  const openPreview = () => { if (!draft) { toast.error("대표 이미지를 먼저 선택해주세요."); return; } setPreview(true); };

  return (
    <Dialog open onOpenChange={v => { if (!v && !busy) onClose(); }}>
      <DialogContent showCloseButton={false} className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-none">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b bg-white px-4 py-2 md:px-6">
          <div className="min-w-0">
            <DialogTitle className="truncate text-lg font-bold">{portfolio ? "시공사례 수정" : "시공사례 등록"}</DialogTitle>
            <DialogDescription className="sr-only">홈페이지에 보여줄 시공사례를 편집합니다.</DialogDescription>
          </div>
          <DialogClose className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-[#56645C] hover:bg-[#F6F7F5]" aria-label="닫기"><X className="size-5" /></DialogClose>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F6F7F5] px-4 py-4 md:px-6">
          <form id={FORM_ID} onSubmit={submit} className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="pf-title">제목 *</Label><Input id="pf-title" className="h-11 bg-white md:h-10" value={title} maxLength={80} disabled={busy} onChange={e => setTitle(e.target.value)} placeholder="예: 세종 ○○카페 채널간판" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="pf-type">간판 종류 *</Label><TaskSelect id="pf-type" label="간판 종류" value={signType} options={signOptions} disabled={busy} onChange={setSignType} /></div>
                <div className="space-y-1.5"><Label htmlFor="pf-region">지역 *</Label><Input id="pf-region" className="h-11 bg-white md:h-10" value={region} maxLength={20} disabled={busy} onChange={e => setRegion(e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="pf-date">시공일 *</Label><DateField id="pf-date" value={completedOn} disabled={busy} onChange={setCompletedOn} /></div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-client">거래처 표시명</Label>
                <Input id="pf-client" className="h-11 bg-white md:h-10" value={client} maxLength={40} disabled={busy} onChange={e => setClient(e.target.value)} placeholder="홈페이지에 보이는 이름 (예: 세종 ○○카페)" />
                <div className="flex items-center gap-2">
                  <Input aria-label="실제 거래처 이름 (공개되지 않음)" className="h-11 min-w-0 flex-1 bg-white md:h-10" value={realName} maxLength={40} disabled={busy} onChange={e => setRealName(e.target.value)} placeholder={linkedCustomer ? `${linkedCustomer.company ?? linkedCustomer.name} (연결된 고객)` : "실제 거래처 이름 (공개 안 됨)"} />
                  <button type="button" onClick={suggest} disabled={busy} className={`${ghost} shrink-0 gap-1 whitespace-nowrap`}><Sparkles className="size-4" aria-hidden />자동 제안</button>
                </div>
                <p className="text-xs text-[#56645C]">실제 이름은 저장하지 않고, 가린 표시명만 만들어요.</p>
              </div>
              <div className="space-y-1.5"><Label htmlFor="pf-desc">작업 설명</Label><Textarea id="pf-desc" className="min-h-28 bg-white" value={description} maxLength={1000} disabled={busy} onChange={e => setDescription(e.target.value)} placeholder="어떤 작업이었는지 짧게 적어주세요." /></div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E1E7E3] bg-white p-3">
                <div><Label htmlFor="pf-pub" className="font-bold">홈페이지에 공개</Label><p className="text-xs text-[#56645C]">공개한 사례 중 순서 상위 10개가 메인에 보여요.</p></div>
                <Switch id="pf-pub" checked={published} disabled={busy} onCheckedChange={setPublished} aria-label="홈페이지에 공개" />
              </div>
              <p className="text-sm text-[#56645C]">연결 의뢰: {project ? <Link href={`/admin/projects?id=${project.id}`} className="font-bold text-[#1E6E41] hover:underline">{project.title}</Link> : "없음"}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>대표 이미지 * (1장)</Label>
                {cover ? (
                  <div className="overflow-hidden rounded-lg border border-[#E1E7E3] bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset(cover.url)} alt="대표 이미지" className="aspect-[4/3] w-full bg-[#EEF1EF] object-cover" />
                  </div>
                ) : <p className="rounded-lg border border-dashed border-[#D5DDD8] bg-white px-3 py-6 text-center text-sm text-[#56645C]">대표 이미지를 선택해주세요.</p>}
                {isPlaceholder && <p className="text-sm font-bold text-[#8A6400]">지금은 임시 이미지예요. 실제 사진으로 바꿔야 공개할 수 있어요.</p>}
                <AttachmentPicker accept="image/*" label={cover ? "대표 이미지 교체" : "대표 이미지 선택"} disabled={busy} onAdd={a => setCover(a[0])} />
              </div>
              <div className="space-y-2">
                <Label>추가 이미지 ({images.length}장)</Label>
                <ImageOrderList items={images} onChange={setImages} onMakeCover={makeCover} disabled={busy} />
                <AttachmentPicker accept="image/*" multiple label="추가 이미지 더하기" disabled={busy} onAdd={a => setImages(x => [...x, ...a])} />
              </div>
              <p className="rounded-lg bg-[#FFF4D6] px-3 py-2 text-xs text-[#8A6400]">데모에서는 사진을 이 브라우저에만 저장해요. 많이 올리면 저장 공간이 부족할 수 있어요(사진은 자동으로 줄여요).</p>
            </div>
            {error && <p role="alert" className="text-sm font-bold text-[#B42323] lg:col-span-2">{error}</p>}
          </form>
        </div>
        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
          <button type="button" onClick={openPreview} className={`${ghost} gap-1.5`}><Eye className="size-4" aria-hidden />미리보기</button>
          <button type="button" onClick={onClose} disabled={busy} className={ghost}>취소</button>
          <button type="submit" form={FORM_ID} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60 md:min-h-10">
            {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "저장 중…" : "저장"}
          </button>
        </footer>
        <PortfolioDialog item={preview ? draft : null} open={preview} onOpenChange={setPreview} />
      </DialogContent>
    </Dialog>
  );
}
