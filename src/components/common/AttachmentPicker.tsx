"use client";
import { useRef, useState } from "react";
import { LoaderCircle, Paperclip } from "lucide-react";
import { toast } from "sonner";
import type { AdminId, Attachment } from "@/domain/types";
import { fileToAttachment } from "@/services/contentService";
import { useAdmin } from "@/data/hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AttachmentPickerProps {
  /** 받을 파일 형식(기본: 이미지와 PDF) */
  accept?: string;
  /** 여러 파일 한 번에 선택 */
  multiple?: boolean;
  /** 변환이 끝난 첨부 목록(실패한 파일은 빠지고 토스트로 알린다) */
  onAdd: (atts: Attachment[]) => void;
  /** 버튼 글자(기본 "파일 첨부") */
  label?: string;
  disabled?: boolean;
  /** 올린 사람. 생략하면 로그인한 관리자(확인되기 전에는 버튼 비활성). */
  by?: AdminId;
  className?: string;
}

/**
 * 파일 선택 버튼. 고른 파일을 `fileToAttachment`로 데이터 URL 첨부로 바꿔 `onAdd`로 넘긴다.
 * 이미지는 축소·JPEG 변환, PDF는 1MB까지. 실패하면 파일 이름과 함께 오류 토스트.
 */
export function AttachmentPicker({ accept = "image/*,application/pdf", multiple, onAdd, label = "파일 첨부", disabled, by, className }: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { admin } = useAdmin();
  const uploader = by ?? admin?.id ?? null;

  const handle = async (files: FileList | null) => {
    if (!files || files.length === 0 || !uploader) return;
    setBusy(true);
    const added: Attachment[] = [];
    for (const file of Array.from(files)) {
      try {
        added.push(await fileToAttachment(file, uploader));
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error ? e.message : "첨부하지 못했어요."}`);
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (added.length) onAdd(added);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={e => handle(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        className={cn("h-11 gap-1.5 bg-white md:h-10", className)}
        disabled={disabled || busy || !uploader}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : <Paperclip aria-hidden />}
        {busy ? "첨부하는 중…" : label}
      </Button>
    </>
  );
}
