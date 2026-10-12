import type { AdminId } from "@/domain/types";
import { ADMINS } from "@/domain/defaults";
import { cn } from "@/lib/utils";

const SIZE = { xs: "size-5 text-[10px]", sm: "size-6 text-[11px]", md: "size-8 text-sm", lg: "size-10 text-base" } as const;

export interface AdminAvatarProps {
  /** 관리자 ID(`kim` · `choi`) */
  id: AdminId;
  /** xs 20px · sm 24px(기본) · md 32px · lg 40px */
  size?: keyof typeof SIZE;
  /** 아바타 옆에 이름을 함께 표시 */
  withName?: boolean;
  className?: string;
}

/** 담당자 원형 아바타(담당자 색 + 이니셜 "김"/"최"). 마우스를 올리면 이름·직함이 보인다. */
export function AdminAvatar({ id, size = "sm", withName, className }: AdminAvatarProps) {
  const a = ADMINS[id];
  if (!a) return null;
  const label = `${a.name} ${a.title}`;
  const circle = (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none text-white", SIZE[size], !withName && className)}
      style={{ backgroundColor: a.color }}
      title={label}
      aria-label={withName ? undefined : label}
      role={withName ? undefined : "img"}
      aria-hidden={withName ? true : undefined}
    >
      {a.initial}
    </span>
  );
  if (!withName) return circle;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {circle}
      <span className="font-medium">{a.name}</span>
    </span>
  );
}
