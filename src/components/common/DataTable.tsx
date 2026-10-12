"use client";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "./useIsMobile";

export interface DataTableColumn<T> {
  /** 열 고유 키 */
  key: string;
  /** 머리글 */
  header: ReactNode;
  /** 셀 내용 */
  cell: (row: T) => ReactNode;
  /** 정렬(금액은 "right") */
  align?: "left" | "center" | "right";
  /** 이 폭 이상에서만 보이는 열(태블릿 768–1279px에서는 주요 열만): lg ≥1024 · xl ≥1280 */
  showFrom?: "lg" | "xl";
  /** 셀(td)에 덧붙일 클래스(폭 지정 등, 예: "w-32") */
  className?: string;
  /** 머리글(th)에 덧붙일 클래스 */
  headerClassName?: string;
}

export interface DataTableProps<T> {
  /** 표시할 행 */
  rows: T[];
  /** 열 정의(≥768px 표에서 사용) */
  columns: DataTableColumn<T>[];
  /** 행 고유 키 */
  rowKey: (row: T) => string;
  /** 행(모바일은 카드) 클릭 — 상세 열기 등. 셀 안의 버튼·링크·입력 클릭은 무시된다. */
  onRowClick?: (row: T) => void;
  /**
   * <768px에서 행 대신 그릴 카드 내용(테두리·여백은 DataTable이 `<article>`로 감싼다).
   * 카드 안에 버튼·체크박스 등 조작 요소를 넣어도 된다(그 요소를 누르면 카드 클릭으로 보지 않는다).
   */
  mobileCard: (row: T) => ReactNode;
  /** 모바일 카드의 접근성 이름(예: 고객 이름). `onRowClick`이 있으면 카드가 포커스되므로 주는 것을 권장. */
  rowLabel?: (row: T) => string;
  /** 행별 추가 클래스(예: 지연 행 강조) */
  rowClassName?: (row: T) => string | undefined;
  /** 불러오는 중이면 뼈대(Skeleton) 표시 */
  loading?: boolean;
  /** 행이 없을 때 보여줄 내용(보통 `<EmptyState />`) */
  empty?: ReactNode;
  /** 표 접근성 이름(스크린리더용 caption) */
  caption?: string;
  className?: string;
}

const ALIGN = { left: "text-left", center: "text-center", right: "text-right" } as const;
const SHOW = { lg: "hidden lg:table-cell", xl: "hidden xl:table-cell" } as const;
const INTERACTIVE = "a,button,input,select,textarea,label,[role=button],[role=checkbox],[role=switch],[role=menuitem],[data-no-row-click]";

/** 클릭이 행 안의 다른 조작 요소에서 왔는지(그렇다면 행 클릭으로 보지 않는다) */
function fromInnerControl(e: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>): boolean {
  const hit = e.target instanceof Element ? e.target.closest(INTERACTIVE) : null;
  return !!hit && hit !== e.currentTarget && e.currentTarget.contains(hit);
}

/**
 * 관리자 목록 표. ≥768px에서는 진짜 `<table>`, <768px에서는 `mobileCard` 카드 목록으로 그린다.
 * `useIsMobile()`로 둘 중 하나만 렌더한다(관리자 화면은 로그인 확인 뒤 클라이언트에서만 그려지므로 하이드레이션 불일치 없음).
 * 모바일 카드는 role 없는 `<article>`이며, `onRowClick`이 있으면 포커스 가능(Enter/Space로 열기)하다.
 */
export function DataTable<T>({ rows, columns, rowKey, onRowClick, mobileCard, rowLabel, rowClassName, loading, empty, caption, className }: DataTableProps<T>) {
  const isMobile = useIsMobile();
  if (loading) return <DataTableSkeleton />;
  if (rows.length === 0 && empty) return <>{empty}</>;

  const activate = (row: T) => (e: MouseEvent<HTMLElement>) => { if (onRowClick && !fromInnerControl(e)) onRowClick(row); };
  const keyActivate = (row: T) => (e: KeyboardEvent<HTMLElement>) => {
    if (!onRowClick || fromInnerControl(e) || e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(row); }
  };

  if (isMobile) {
    return (
      <ul className={cn("flex flex-col gap-2", className)}>
        {rows.map(row => (
          <li key={rowKey(row)}>
            <article
              onClick={onRowClick ? activate(row) : undefined}
              onKeyDown={onRowClick ? keyActivate(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={rowLabel?.(row)}
              className={cn(
                "min-h-11 rounded-xl border border-[#E3E8E4] bg-white p-3.5",
                onRowClick && "cursor-pointer outline-none active:bg-[#F6F9F7] focus-visible:ring-2 focus-visible:ring-brand/40",
                rowClassName?.(row),
              )}
            >
              {mobileCard(row)}
            </article>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={className}>
      <div className="overflow-x-auto rounded-xl border border-[#E3E8E4] bg-white">
        <table className="w-full border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-[#F3F5F3] text-xs text-[#5F6B64]">
            <tr>
              {columns.map(c => (
                <th key={c.key} scope="col" className={cn("h-10 whitespace-nowrap px-3 font-medium", ALIGN[c.align ?? "left"], c.showFrom && SHOW[c.showFrom], c.headerClassName)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? activate(row) : undefined}
                onKeyDown={onRowClick ? keyActivate(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  "border-t border-[#EEF1EF] first:border-t-0",
                  onRowClick && "cursor-pointer outline-none hover:bg-[#F6F9F7] focus-visible:bg-[#EEF6F1] focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-inset",
                  rowClassName?.(row),
                )}
              >
                {columns.map(c => (
                  <td key={c.key} className={cn("h-12 px-3 py-2 align-middle", ALIGN[c.align ?? "left"], c.showFrom && SHOW[c.showFrom], c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 표 불러오는 중 뼈대 */
export function DataTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#E3E8E4] bg-white p-3" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-[#EEF1EF]" />
      ))}
    </div>
  );
}
