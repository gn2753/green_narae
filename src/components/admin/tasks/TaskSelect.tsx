"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface TaskSelectOption { value: string; label: string }

/** 업무 화면 공용 선택 상자(보이는 글자 = label). */
export function TaskSelect({ value, onChange, options, label, id, disabled, className }: {
  value: string; onChange: (v: string) => void; options: TaskSelectOption[]; label: string; id?: string; disabled?: boolean; className?: string;
}) {
  return (
    <Select value={value} onValueChange={v => { if (typeof v === "string") onChange(v); }} items={options} disabled={disabled}>
      <SelectTrigger id={id} aria-label={label} className={cn("h-11 w-full bg-white md:h-10", className)}><SelectValue /></SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {options.map(o => <SelectItem key={o.value} value={o.value} className="min-h-10">{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
