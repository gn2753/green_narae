"use client";
import { useState } from "react";
import { Eye, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AttachmentPicker } from "@/components/common/AttachmentPicker";
import { DateField } from "@/components/common/DateField";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { TaskSelect } from "@/components/admin/tasks/TaskSelect";
import { NewsArticleBody } from "@/components/site/news/NewsDetail";
import { useMutation, useRepo, useToday } from "@/data/hooks";
import { ConflictError } from "@/data/errors";
import { NEWS_CATEGORY_LABEL } from "@/domain/defaults";
import type { Attachment, ISODate, News, NewsCategory } from "@/domain/types";
import { saveNews } from "@/services/contentService";
import { asset } from "@/lib/asset";

const FORM_ID = "news-form";
const ghost = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] disabled:opacity-50";
const CATS = (Object.keys(NEWS_CATEGORY_LABEL) as NewsCategory[]).map(k => ({ value: k, label: NEWS_CATEGORY_LABEL[k] }));

/** 소식 편집기. news = null 이면 새 글. */
export function NewsEditor({ news, onClose }: { news: News | null; onClose: () => void }) {
  const repo = useRepo();
  const today = useToday();
  const { run, busy } = useMutation();
  const [base] = useState(news); // 열 때의 버전을 기준으로 저장(다른 탭·사람이 그 사이 고치면 충돌 안내)
  const [category, setCategory] = useState<NewsCategory>(news?.category ?? "news");
  const [title, setTitle] = useState(news?.title ?? "");
  const [summary, setSummary] = useState(news?.summary ?? "");
  const [body, setBody] = useState(news?.body ?? "");
  const [cover, setCover] = useState<Attachment | null>(news?.cover ?? null);
  const [publishedOn, setPublishedOn] = useState<ISODate | "">(news?.publishedOn ?? today);
  const [pinned, setPinned] = useState(news?.pinned ?? false);
  const [published, setPublished] = useState(news?.published ?? true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    const saved = await run(
      () => saveNews(repo, { category, title, summary, body, cover, publishedOn, pinned, published }, base).catch(er => {
        // 충돌이면 편집기를 닫고, 다시 열어 최신 내용으로 고치도록 안내한다
        if (er instanceof ConflictError) { onClose(); throw new Error("다른 곳에서 먼저 수정되었어요. 편집 창을 닫았으니 다시 열어 최신 내용으로 수정해주세요."); }
        setError(er instanceof Error ? er.message : "저장하지 못했어요.");
        throw er;
      }),
      news ? "소식을 저장했어요" : "소식을 등록했어요", { exclusive: true });
    if (saved) onClose();
  };
  const openPreview = () => { if (!title.trim() || !body.trim()) { toast.error("제목과 본문을 입력하면 미리볼 수 있어요."); return; } setPreview(true); };

  return (
    <>
      <ResponsiveDialog open onOpenChange={v => { if (!v && !busy) onClose(); }} size="xl" title={news ? "소식 수정" : "소식 등록"}
        footer={<>
          <button type="button" onClick={openPreview} className={ghost}><Eye className="size-4" aria-hidden />미리보기</button>
          <button type="button" onClick={onClose} disabled={busy} className={ghost}>취소</button>
          <button type="submit" form={FORM_ID} disabled={busy} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
            {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{busy ? "저장 중…" : "저장"}
          </button>
        </>}>
        <form id={FORM_ID} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="nw-cat">분류</Label><TaskSelect id="nw-cat" label="분류" value={category} options={CATS} disabled={busy} onChange={v => setCategory(v as NewsCategory)} /></div>
          <div className="space-y-1.5"><Label htmlFor="nw-date">게시일 *</Label><DateField id="nw-date" value={publishedOn} disabled={busy} onChange={setPublishedOn} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="nw-title">제목 *</Label><Input id="nw-title" className="h-11 bg-white md:h-10" value={title} maxLength={80} disabled={busy} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="nw-sum">요약 * (목록 카드에 보여요)</Label><Input id="nw-sum" className="h-11 bg-white md:h-10" value={summary} maxLength={120} disabled={busy} onChange={e => setSummary(e.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="nw-body">본문 * (빈 줄로 문단을 나눠요)</Label><Textarea id="nw-body" className="min-h-40 bg-white" value={body} disabled={busy} onChange={e => setBody(e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2">
            <Label>대표 이미지 (선택)</Label>
            {cover && (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(cover.url)} alt="대표 이미지" className="h-20 w-32 rounded-md bg-[#EEF1EF] object-cover" />
                <button type="button" onClick={() => setCover(null)} disabled={busy} className={`${ghost} h-11 md:h-10`}>이미지 빼기</button>
              </div>
            )}
            <AttachmentPicker accept="image/*" label={cover ? "대표 이미지 교체" : "대표 이미지 선택"} disabled={busy} onAdd={a => setCover(a[0])} />
            <p className="text-xs text-[#8A6400]">데모에서는 사진을 이 브라우저에만 저장해요. 저장 공간이 부족하면 알려드려요.</p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E1E7E3] bg-white p-3"><Label htmlFor="nw-pin" className="font-bold">상단 고정</Label><Switch id="nw-pin" checked={pinned} disabled={busy} onCheckedChange={setPinned} aria-label="상단 고정" /></div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E1E7E3] bg-white p-3"><Label htmlFor="nw-pub" className="font-bold">홈페이지에 공개</Label><Switch id="nw-pub" checked={published} disabled={busy} onCheckedChange={setPublished} aria-label="홈페이지에 공개" /></div>
          {error && <p role="alert" className="text-sm font-bold text-[#B42323] sm:col-span-2">{error}</p>}
        </form>
      </ResponsiveDialog>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent showCloseButton={false} className="top-0 left-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 content-start overflow-y-auto rounded-none bg-cream p-0 sm:max-w-none md:top-1/2 md:left-1/2 md:h-auto md:max-h-[92dvh] md:w-full md:max-w-3xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:sm:max-w-3xl">
          <DialogTitle className="sr-only">소식 미리보기</DialogTitle>
          <DialogDescription className="sr-only">홈페이지에 보이는 모습입니다.</DialogDescription>
          <DialogClose className="absolute top-2 right-2 z-10 inline-flex size-11 items-center justify-center rounded-lg bg-white/80 text-[#56645C]" aria-label="미리보기 닫기"><X className="size-5" /></DialogClose>
          <article className="px-4 py-10 md:px-8"><NewsArticleBody item={{ category, publishedOn: publishedOn || today, title, cover: cover ?? undefined, body }} /></article>
        </DialogContent>
      </Dialog>
    </>
  );
}
