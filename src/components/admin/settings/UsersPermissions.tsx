"use client";
import { Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ADMINS, ADMIN_IDS } from "@/domain/defaults";
import { AdminAvatar } from "@/components/common/AdminAvatar";
import { Checkbox } from "@/components/ui/checkbox";
import { cardCls, primaryBtn } from "./settingsUi";

const PERMS = [
  { key: "view", label: "조회" }, { key: "edit", label: "수정" }, { key: "money", label: "금액" }, { key: "publish", label: "게시" },
] as const;

export function UsersPermissions() {
  return (
    <>
      <section className={cardCls}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">허용 사용자 {ADMIN_IDS.length}명</h2>
          <button type="button" className={primaryBtn} onClick={() => toast.info("로그인 사용자는 두 대표로 확정되어 있어요")}><Plus className="size-4" aria-hidden />사용자 추가</button>
        </div>
        <ul className="divide-y divide-[#EEF1EF]">
          {ADMIN_IDS.map(id => {
            const a = ADMINS[id];
            return (
              <li key={id} className="flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0">
                <AdminAvatar id={id} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{a.name} <span className="text-sm font-medium text-[#56645C]">{a.title}</span></p>
                  <p className="break-all text-sm text-[#56645C]">{a.email}</p>
                  <p className="mt-0.5 text-sm text-[#3B4A41]">담당: {a.roles.join(" · ")}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={cardCls}>
        <h2 className="mb-1 text-sm font-bold">권한</h2>
        <p className="mb-3 text-sm text-[#56645C]">현재는 두 대표 모두 전체 권한입니다. 직원 계정이 필요해지면 여기서 권한을 나눌 수 있어요.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] text-sm"><caption className="sr-only">사용자별 권한</caption>
            <thead><tr className="text-xs text-[#56645C]"><th className="py-1.5 pr-2 text-left font-bold">사용자</th>{PERMS.map(p => <th key={p.key} className="px-2 py-1.5 text-center font-bold">{p.label}</th>)}</tr></thead>
            <tbody>
              {ADMIN_IDS.map(id => (
                <tr key={id} className="border-t border-[#EEF1EF]">
                  <th scope="row" className="py-2 pr-2 text-left font-medium">{ADMINS[id].name}</th>
                  {PERMS.map(p => (
                    <td key={p.key} className="px-2 py-2 text-center">
                      <Checkbox checked={ADMINS[id].permissions[p.key]} disabled aria-label={`${ADMINS[id].name} ${p.label} 권한`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-4 flex min-w-0 items-start gap-3 rounded-xl border border-[#BDE8C9] bg-[#F2FAF5] p-3 md:p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
        <div>
          <h2 className="text-sm font-bold">접근 제한</h2>
          <p className="text-sm text-[#3B4A41]">허용 목록에 없는 계정은 관리자 화면과 자료에 접근할 수 없습니다.</p>
        </div>
      </section>
    </>
  );
}
