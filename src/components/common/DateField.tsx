"use client";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import type { ISODate } from "@/domain/types";
import { cn } from "@/lib/utils";

export interface DateFieldProps extends Omit<ComponentProps<"input">, "value" | "onChange" | "type" | "min" | "max"> {
  /** `YYYY-MM-DD`(한국 시간 기준 날짜) 또는 빈칸 "" */
  value: ISODate | "";
  /** 바뀐 날짜(`YYYY-MM-DD`, 지우면 "") */
  onChange: (value: ISODate | "") => void;
  /** 고를 수 있는 가장 이른 날짜 */
  min?: ISODate;
  /** 고를 수 있는 가장 늦은 날짜 */
  max?: ISODate;
}

/** 날짜 입력칸(브라우저 기본 달력 사용, 모바일은 OS 날짜 선택기). `id` 등 input 속성은 그대로 전달된다. */
export function DateField({ value, onChange, className, ...rest }: DateFieldProps) {
  return (
    <Input
      {...rest}
      type="date"
      value={value}
      onChange={e => onChange(e.target.value as ISODate | "")}
      className={cn("h-11 bg-white md:h-10", className)}
    />
  );
}
