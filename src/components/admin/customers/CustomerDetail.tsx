"use client";
import { useState } from "react";
import { Building2, Mail, MapPin, Pencil, Phone, StickyNote } from "lucide-react";
import { splitMemo } from "@/domain/customers";
import type { Customer } from "@/domain/types";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { formatPhone } from "@/lib/format";
import { CustomerForm } from "./CustomerForm";
import { CustomerTabs } from "./CustomerTabs";

/** 고객 상세: 기본 정보 카드(수정) + 탭 4개. */
export function CustomerDetail({ customer: c, tab, onTab }: { customer: Customer; tab: string | null; onTab: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const memo = splitMemo(c.memo).rest;
  return (
    <>
      <PageHeader title={c.name} description={c.company} back={{ href: "/admin/customers", label: "고객 목록" }}
        actions={<button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#D5DDD8] bg-white px-4 text-sm font-medium hover:bg-[#F6F7F5] md:min-h-10"><Pencil className="size-4" aria-hidden />정보 수정</button>} />
      <section aria-label="기본 정보" className="mb-5 grid gap-x-8 gap-y-3 rounded-xl border border-[#E3E8E4] bg-white p-4 text-sm md:grid-cols-2 md:p-5">
        <div className="flex items-center gap-2"><Phone className="size-4 shrink-0 text-[#7A867F]" aria-hidden /><a href={`tel:${c.phone.replace(/\D/g, "")}`} className="font-medium text-brand hover:underline">{formatPhone(c.phone)}</a></div>
        <div className="flex items-center gap-2"><Mail className="size-4 shrink-0 text-[#7A867F]" aria-hidden />{c.email ? <a href={`mailto:${c.email}`} className="break-all hover:underline">{c.email}</a> : <span className="text-[#9AA59F]">이메일 없음</span>}</div>
        <div className="flex items-center gap-2"><Building2 className="size-4 shrink-0 text-[#7A867F]" aria-hidden />{c.company ?? <span className="text-[#9AA59F]">업체명 없음</span>}</div>
        <div className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-[#7A867F]" aria-hidden />
          {c.sites.length ? <ul className="space-y-0.5">{c.sites.map(s => <li key={s}>{s}</li>)}</ul> : <span className="text-[#9AA59F]">현장 주소 없음</span>}
        </div>
        {memo && <div className="flex items-start gap-2 md:col-span-2"><StickyNote className="mt-0.5 size-4 shrink-0 text-[#7A867F]" aria-hidden /><p className="whitespace-pre-wrap">{memo}</p></div>}
      </section>
      <CustomerTabs customer={c} tab={tab} onTab={onTab} />
      <CustomerForm open={editing} customer={c} onOpenChange={setEditing} onSaved={() => setEditing(false)} />
    </>
  );
}
