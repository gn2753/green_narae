"use client";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ImageIcon, Pencil, Trash2 } from "lucide-react";
import { useCollection, useMutation, useRepo } from "@/data/hooks";
import type { Portfolio } from "@/domain/types";
import { deletePortfolio, reorderPortfolios, setPortfolioPublished } from "@/services/contentService";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { asset } from "@/lib/asset";

export const HOME_LIMIT = 10;
const iconBtn = "inline-flex size-11 items-center justify-center rounded-lg border border-[#D5DDD8] bg-white hover:bg-[#F6F7F5] disabled:opacity-40 md:size-9";

/** 시공사례 목록: 순서 위/아래, 공개 스위치, 메인 노출(공개 순서 상위 10) 표시. */
export function PortfolioAdminList({ onEdit, onAdd }: { onEdit: (p: Portfolio) => void; onAdd: () => void }) {
  const repo = useRepo();
  const { items, loading } = useCollection("portfolios");
  const { run, busy } = useMutation();
  const [del, setDel] = useState<Portfolio | null>(null);
  const rows = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);
  const onHome = useMemo(() => new Set(rows.filter(p => p.published).slice(0, HOME_LIMIT).map(p => p.id)), [rows]);

  const move = (i: number, d: -1 | 1) => {
    const ids = rows.map(p => p.id); const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    void run(() => reorderPortfolios(repo, ids));
  };
  const idx = (p: Portfolio) => rows.findIndex(r => r.id === p.id);
  const toggle = (p: Portfolio, v: boolean) => { void run(() => setPortfolioPublished(repo, p, v), v ? "홈페이지에 공개했어요" : "비공개로 바꿨어요"); };

  const thumb = (p: Portfolio, cls: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={asset(p.cover.url)} alt={`${p.title} 대표 이미지`} className={`${cls} shrink-0 rounded-md bg-[#EEF1EF] object-cover`} />
  );
  const exposure = (p: Portfolio) => (onHome.has(p.id) ? <StatusBadge tone="green" dot>메인 노출</StatusBadge> : p.published ? <StatusBadge tone="gray">공개 (메인 밖)</StatusBadge> : <StatusBadge tone="yellow">비공개</StatusBadge>);
  const pub = (p: Portfolio) => <Switch checked={p.published} disabled={busy} onCheckedChange={v => toggle(p, v)} aria-label={`${p.title} 공개`} />;
  const order = (p: Portfolio) => {
    const i = idx(p);
    return (
      <div className="flex items-center gap-1">
        <span className="w-6 text-center text-sm font-bold">{i + 1}</span>
        <button type="button" aria-label={`${p.title} 순서 위로`} disabled={busy || i === 0} onClick={() => move(i, -1)} className={iconBtn}><ArrowUp className="size-4" aria-hidden /></button>
        <button type="button" aria-label={`${p.title} 순서 아래로`} disabled={busy || i === rows.length - 1} onClick={() => move(i, 1)} className={iconBtn}><ArrowDown className="size-4" aria-hidden /></button>
      </div>
    );
  };
  const actions = (p: Portfolio) => (
    <div className="flex items-center justify-end gap-1">
      <button type="button" aria-label={`${p.title} 수정`} onClick={() => onEdit(p)} className={iconBtn}><Pencil className="size-4" aria-hidden /></button>
      <button type="button" aria-label={`${p.title} 삭제`} onClick={() => setDel(p)} className={iconBtn}><Trash2 className="size-4 text-[#B42323]" aria-hidden /></button>
    </div>
  );

  const columns: DataTableColumn<Portfolio>[] = [
    { key: "order", header: "순서", cell: order },
    { key: "cover", header: "대표", cell: p => thumb(p, "h-12 w-16") },
    { key: "title", header: "제목", cell: p => <span className="font-bold">{p.title}</span> },
    { key: "type", header: "종류", cell: p => p.signType },
    { key: "region", header: "지역", showFrom: "lg", cell: p => p.region },
    { key: "date", header: "시공일", showFrom: "lg", cell: p => p.completedOn.replaceAll("-", ".") },
    { key: "home", header: "홈 노출", cell: exposure },
    { key: "pub", header: "공개", cell: pub },
    { key: "act", header: "", align: "right", cell: actions },
  ];

  return (
    <>
      <p className="mb-3 rounded-lg bg-[#E6EEF7] px-3 py-2 text-sm text-[#2D4A6E]">공개된 항목 중 순서 상위 {HOME_LIMIT}개가 메인에 보여요</p>
      <DataTable rows={rows} columns={columns} rowKey={p => p.id} loading={loading} caption="시공사례" rowLabel={p => p.title}
        empty={<EmptyState icon={ImageIcon} title="등록된 시공사례가 없어요" description="의뢰 상세에서 시공사례로 등록하거나 직접 등록해보세요." action={<button type="button" onClick={onAdd} className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark">시공사례 등록</button>} />}
        mobileCard={p => (
          <div className="space-y-2">
            <div className="flex gap-3">
              {thumb(p, "size-20")}
              <div className="min-w-0 flex-1">
                <p className="font-bold">{p.title}</p>
                <p className="text-sm text-[#56645C]">{p.signType} · {p.region} · {p.completedOn.replaceAll("-", ".")}</p>
                <div className="mt-1">{exposure(p)}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><span className="text-sm text-[#56645C]">공개</span>{pub(p)}</div>
              {order(p)}
              {actions(p)}
            </div>
          </div>
        )} />
      <ConfirmDialog open={!!del} onOpenChange={o => { if (!o) setDel(null); }} danger title="이 시공사례를 삭제할까요?"
        description={del?.projectId ? "삭제하면 되돌릴 수 없어요. 연결된 의뢰의 '시공사례 등록됨' 표시도 함께 풀려요." : "삭제하면 되돌릴 수 없어요."}
        confirmLabel="삭제" onConfirm={() => del ? run(() => deletePortfolio(repo, del.id), "삭제했어요") : undefined} />
    </>
  );
}
