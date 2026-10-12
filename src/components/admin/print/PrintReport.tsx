"use client";
import "@/app/admin/print/print.css";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { categoryLabel, PRIORITY_LABEL } from "@/domain/defaults";
import { sortTasksForPrint } from "@/domain/exportSets";
import type { Settings, Task } from "@/domain/types";

/** 같은 A4 고정 레이아웃을 측정해 모든 행이 한 장에 들어가도록 축소 비율을 정한다. */
export function preparePrintReport(id = "print-report") {
  const report = document.getElementById(id);
  const space = report?.querySelector<HTMLElement>(".print-table-space");
  const content = report?.querySelector<HTMLElement>(".print-fit-content");
  if (!report || !space || !content) throw new Error("인쇄 내역을 준비하지 못했습니다.");
  report.classList.add("print-measuring");
  try {
    const setScale = (scale: number) => report.style.setProperty("--print-scale", String(scale));
    setScale(1);
    const available = Math.max(1, space.clientHeight - 2);
    if (content.scrollHeight <= available) return;
    let low = Math.min(1, available / content.scrollHeight) * 0.98, high = 1;
    for (let i = 0; i < 12; i++) {
      const scale = (low + high) / 2;
      setScale(scale);
      if (content.scrollHeight * scale <= available) low = scale;
      else high = scale;
    }
    setScale(low * 0.999);
  } finally {
    report.classList.remove("print-measuring");
  }
}

export interface PrintReportProps {
  id?: string;
  tasks: Task[];
  settings: Settings;
  generatedAt: string;
  /** 범위 설명(예: 전체 기간, 필터 적용, 직접 선택) */
  scopeLabel?: string;
  preview?: boolean;
}

export default function PrintReport({ id = "print-report", tasks, settings, generatedAt, scopeLabel = "전체 기간", preview }: PrintReportProps) {
  const rows = sortTasksForPrint(tasks);
  const printedAt = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(generatedAt));
  return (
    <section id={id} className={preview ? "print-report print-preview" : "print-report"} aria-label="A4 한 장 전체 업무 인쇄 내역">
      <header className="print-heading"><div><p>그린나래디자인</p><h1>전체 업무내역</h1></div><div className="print-meta"><p>A4 세로 · {scopeLabel}</p><p>출력 {printedAt}</p></div></header>
      <div className="print-table-space"><div className="print-fit-content">
        <Table className="print-table">
          <colgroup><col style={{ width: "5%" }} /><col style={{ width: "13%" }} /><col style={{ width: "36%" }} /><col style={{ width: "11%" }} /><col style={{ width: "9%" }} /><col style={{ width: "26%" }} /></colgroup>
          <TableHeader><TableRow>{["번호", "업무파트", "업무명", "담당자", "우선순위", "비고"].map(label => <TableHead scope="col" key={label}>{label}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{rows.length ? rows.map((t, i) => (
            <TableRow key={t.id} className={i > 0 && rows[i - 1].category !== t.category ? "print-part-start" : undefined}>
              <TableCell>{i + 1}</TableCell>
              <TableCell className="print-category" data-category={t.category}>{categoryLabel(settings, t.category)}</TableCell>
              <TableCell className="print-task-title">{t.title}</TableCell>
              <TableCell>{t.assignee}</TableCell>
              <TableCell>{PRIORITY_LABEL[t.priority]}</TableCell>
              <TableCell className="print-memo" aria-label={`${i + 1}번 업무 비고 메모칸`} />
            </TableRow>
          )) : <TableRow><TableCell colSpan={6} className="print-empty">선택된 업무가 없습니다.</TableCell></TableRow>}</TableBody>
        </Table>
      </div></div>
      <footer className="print-note">전체 {rows.length}건 · 완료 업무 포함 · 그린나래디자인 내부 업무용</footer>
    </section>
  );
}
