import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = { title: "회원 서비스" };

export default function MemberPage() {
  return (
    <SiteShell>
      <ComingSoon
        title="회원 서비스 준비 중"
        description="회원가입·로그인과 마이페이지 의뢰 진행 확인은 2차에 열립니다. 지금은 회원가입 없이 문의하실 수 있어요."
      />
    </SiteShell>
  );
}
