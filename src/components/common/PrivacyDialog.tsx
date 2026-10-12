"use client";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export function PrivacyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>개인정보처리방침</DialogTitle>
          <DialogDescription>그린나래디자인은 상담·견적에 꼭 필요한 정보만 받습니다.</DialogDescription>
        </DialogHeader>
        <dl className="space-y-3 text-sm leading-relaxed">
          <div><dt className="font-bold">수집 항목</dt><dd>이름, 연락처, 이메일, 문의 내용</dd></div>
          <div><dt className="font-bold">수집 목적</dt><dd>상담 및 견적 회신</dd></div>
          <div><dt className="font-bold">보유 기간</dt><dd>상담 종료 후 1년 보관 뒤 파기</dd></div>
          <div><dt className="font-bold">방문 통계</dt><dd>사이트 이용 현황 파악을 위해 개인을 식별하지 않는 익명 방문 통계를 수집합니다.</dd></div>
        </dl>
        <p className="text-xs text-muted-foreground">※ 시안용 데모입니다. 입력하신 내용은 이 브라우저에만 저장되며 서버로 전송되지 않습니다.</p>
      </DialogContent>
    </Dialog>
  );
}
