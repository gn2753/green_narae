"use client";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { formatMoneyInput, parseMoneyInput } from "@/domain/adminNav";
import { cn } from "@/lib/utils";

export interface MoneyInputProps extends Omit<ComponentProps<"input">, "value" | "onChange" | "type" | "inputMode"> {
  /** 원 단위 정수 */
  value: number;
  /** 바뀐 금액(원 단위 정수, 빈칸은 0) */
  onChange: (value: number) => void;
}

/** 금액 입력칸: 천 단위 콤마 표시, 숫자 키패드, 뒤에 "원". `id`·`aria-invalid` 등 input 속성은 그대로 전달된다. */
export function MoneyInput({ value, onChange, className, ...rest }: MoneyInputProps) {
  return (
    <div className="relative">
      <Input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value ? formatMoneyInput(value) : ""}
        placeholder={rest.placeholder ?? "0"}
        onChange={e => onChange(parseMoneyInput(e.target.value))}
        className={cn("h-11 bg-white pr-8 text-right tabular-nums md:h-10", className)}
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[#7A867F]">원</span>
    </div>
  );
}
