"use client";
import { useMemo, useState } from "react";
import { Newspaper, Pencil, Pin, Trash2 } from "lucide-react";
import { useCollection, useMutation, useRepo } from "@/data/hooks";
import { NEWS_CATEGORY_LABEL } from "@/domain/defaults";
import type { News } from "@/domain/types";
import { deleteNews, setNewsPublished } from "@/services/contentService";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { asset } from "@/lib/asset";

const iconBtn = "inline-flex size-11 items-center justify-center rounded-lg border border-[#D5DDD8] bg-white hover:bg-[#F6F7F5] md:size-9";

/** 소식 목록: 상단 고정 먼저, 게시일 최신순. */
export function NewsAdminList({ onEdit, onAdd }: { onEdit: (n: News) => void; onAdd: () => void }) {
  const repo = useRepo();
  const { items, loading } = useCollection("news");
  const { run, busy } = useMutation();
  const [del, setDel] = useState<News | null>(null);
  const rows = useMemo(() => [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedOn.localeCompare(a.publishedOn)), [items]);

  const thumb = (n: News, cls: string) => n.cover
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={asset(n.cover.url)} alt="" className={`${cls} shrink-0 rounded-md bg-[#EEF1EF] object-cover`} />
    : <span className={`${cls} flex shrink-0 items-center justify-center rounded-md bg-[#EEF1EF] text-[#9AA59F]`}><Newspaper className="size-5" aria-hidden /></span>;
  const pub = (n: News) => <Switch checked={n.published} disabled={busy} onCheckedChange={v => void run(() => setNewsPublished(repo, n, v), v ? "공개했어요" : "비공개로 바꿨어요")} aria-label={`${n.title} 공개`} />;
  const actions = (n: News) => (
    <div className="flex items-center justify-end gap-1">
      <button type="button" aria-label={`${n.title} 수정`} onClick={() => onEdit(n)} className={iconBtn}><Pencil className="size-4" aria-hidden /></button>
      <button type="button" aria-label={`${n.title} 삭제`} onClick={() => setDel(n)} className={iconBtn}><Trash2 className="size-4 text-[#B42323]" aria-hidden /></button>
    </div>
  );
  const tag = (n: News) => <span className="inline-flex items-center gap-1"><StatusBadge tone="blue">{NEWS_CATEGORY_LABEL[n.category]}</StatusBadge>{n.pinned && <StatusBadge tone="yellow"><Pin className="mr-0.5 size-3" aria-hidden />고정</StatusBadge>}</span>;

  const columns: DataTableColumn<News>[] = [
    { key: "cover", header: "대표", cell: n => thumb(n, "h-12 w-16") },
    { key: "cat", header: "분류", cell: tag },
    { key: "title", header: "제목", cell: n => <span className="font-bold">{n.title}</span> },
    { key: "date", header: "게시일", cell: n => n.publishedOn.replaceAll("-", ".") },
    { key: "pub", header: "공개", cell: pub },
    { key: "act", header: "", align: "right", cell: actions },
  ];
  return (
    <>
      <DataTable rows={rows} columns={columns} rowKey={n => n.id} loading={loading} caption="소식" rowLabel={n => n.title}
        empty={<EmptyState icon={Newspaper} title="등록된 소식이 없어요" description="공지나 새 소식을 올려 홈페이지에 보여주세요." action={<button type="button" onClick={onAdd} className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark">소식 등록</button>} />}
        mobileCard={n => (
          <div className="space-y-2">
            <div className="flex gap-3">
              {thumb(n, "size-16")}
              <div className="min-w-0 flex-1">
                <div className="mb-0.5">{tag(n)}</div>
                <p className="font-bold">{n.title}</p>
                <p className="text-sm text-[#56645C]">{n.publishedOn.replaceAll("-", ".")}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><span className="text-sm text-[#56645C]">공개</span>{pub(n)}</div>
              {actions(n)}
            </div>
          </div>
        )} />
      <ConfirmDialog open={!!del} onOpenChange={o => { if (!o) setDel(null); }} danger title="이 소식을 삭제할까요?" description="삭제하면 되돌릴 수 없어요."
        confirmLabel="삭제" onConfirm={() => del ? run(() => deleteNews(repo, del.id), "삭제했어요") : undefined} />
    </>
  );
}
