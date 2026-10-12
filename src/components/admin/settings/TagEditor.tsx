"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { fieldCls, primaryBtn } from "./settingsUi";

/** 태그 추가·삭제 편집기. 빈 값·중복은 막고, 삭제하면 기존 기록은 옛 값을 유지한다는 안내를 보여준다. */
export function TagEditor({ id, title, hint, values, onChange, busy }: {
  id: string; title: string; hint?: string; values: string[]; onChange: (next: string[]) => Promise<unknown>; busy?: boolean;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [removed, setRemoved] = useState(false);

  const add = async () => {
    const v = text.trim();
    if (!v) { setError("추가할 이름을 입력해주세요."); return; }
    if (values.some(x => x.trim().toLowerCase() === v.toLowerCase())) { setError("이미 있는 항목이에요."); return; }
    setError(""); setRemoved(false);
    const r = await onChange([...values, v]);
    if (r !== undefined) setText("");
  };
  const remove = async (v: string) => {
    if (values.length <= 1) { setError("항목이 최소 1개는 있어야 해요."); return; }
    setError("");
    const r = await onChange(values.filter(x => x !== v));
    if (r !== undefined) { setRemoved(true); toast.message(`'${v}'을(를) 목록에서 뺐어요`, { description: "이미 저장된 기록에는 기존 값이 그대로 남아요." }); }
  };

  return (
    <section className="rounded-lg border border-[#E3E8E4] p-3">
      <h3 className="text-sm font-bold">{title}</h3>
      {hint && <p className="text-xs text-[#56645C]">{hint}</p>}
      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={title}>
        {values.map(v => (
          <li key={v} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[#EEF1EF] pl-3 pr-1 text-sm">
            {v}
            <button type="button" aria-label={`${v} 삭제`} disabled={busy} onClick={() => remove(v)} className="inline-flex size-8 items-center justify-center rounded-full text-[#56645C] hover:bg-white hover:text-[#B3402A] disabled:opacity-50"><X className="size-4" aria-hidden /></button>
          </li>
        ))}
      </ul>
      <form className="mt-2 flex gap-2" onSubmit={e => { e.preventDefault(); void add(); }}>
        <label htmlFor={`${id}-new`} className="sr-only">{title} 추가</label>
        <input id={`${id}-new`} className={fieldCls} value={text} maxLength={20} placeholder="새 항목 이름" disabled={busy} onChange={e => { setText(e.target.value); setError(""); }} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} />
        <button type="submit" disabled={busy} className={primaryBtn}><Plus className="size-4" aria-hidden />추가</button>
      </form>
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-bold text-[#B3402A]">{error}</p>}
      {removed && <p className="mt-1 text-xs text-[#8A6A00]">삭제해도 이미 저장된 기록에는 기존 값이 그대로 남아요.</p>}
    </section>
  );
}
