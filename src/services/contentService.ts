import type { Repository } from "@/data/repository";
import type { AdminId, Attachment, ISODate, News, NewsCategory, Portfolio } from "@/domain/types";
import { portfolioDraftFromProject } from "@/domain/portfolio";
import { koreaDate } from "@/domain/dates";
import { NotFoundError } from "@/data/errors";
import { log } from "./projectService";

/** 주소 첫 단어 → 지역 표시명 ("세종특별자치시 ○○로" → "세종", "청주시 …" → "청주"). 없으면 "세종". */
export function regionFromAddress(address?: string): string {
  const first = address?.trim().split(/\s+/)[0] ?? "";
  const short = first.replace(/(특별자치시|특별자치도|광역시|특별시|시|군)$/, "");
  return short || first || "세종";
}

/** 의뢰 → 시공사례 비공개 초안(시공 후 사진·시안 이미지로 채움) + 의뢰에 연결 */
export async function registerPortfolioFromProject(repo: Repository, projectId: string, actorId: AdminId): Promise<Portfolio> {
  const p = await repo.get("projects", projectId); if (!p) throw new NotFoundError("의뢰");
  if (p.portfolioId) {
    const existing = await repo.get("portfolios", p.portfolioId);
    if (existing) return existing; // 이미 등록된 시공사례는 다시 만들지 않는다
  }
  const c = await repo.get("customers", p.customerId); if (!c) throw new NotFoundError("고객");
  const draft = portfolioDraftFromProject(p, c, koreaDate(), regionFromAddress(c.sites[0] ?? p.siteAddress));
  const order = Math.max(0, ...(await repo.list("portfolios")).map(x => x.order)) + 1;
  const pf = await repo.create("portfolios", { ...draft, order });
  await repo.update("projects", projectId, { portfolioId: pf.id }, p.version);
  await log(repo, projectId, actorId, "edit", "시공사례 초안 등록 (비공개)");
  return pf;
}

/** 노출 순서 저장: 전달한 순서대로 order = 1, 2, 3 … */
export async function reorderPortfolios(repo: Repository, idsInOrder: string[]): Promise<void> {
  const current = new Map((await repo.list("portfolios")).map(p => [p.id, p]));
  for (const [i, id] of idsInOrder.entries()) {
    const p = current.get(id);
    if (p && p.order !== i + 1) await repo.update("portfolios", id, { order: i + 1 });
  }
}

export interface PortfolioInput {
  title: string; signType: string; region: string; completedOn: ISODate | ""; clientDisplayName: string; description: string;
  cover: Attachment | null; images: Attachment[]; published: boolean;
}

/** 시공사례 저장(등록·수정). 새 사례는 맨 뒤 순서(max+1)로 들어간다. */
export async function savePortfolio(repo: Repository, input: PortfolioInput, existing: Portfolio | null): Promise<Portfolio> {
  const title = input.title.trim(), signType = input.signType.trim(), region = input.region.trim();
  if (!title) throw new Error("제목을 입력해주세요.");
  if (!signType) throw new Error("간판 종류를 선택해주세요.");
  if (!region) throw new Error("지역을 입력해주세요.");
  if (!input.completedOn) throw new Error("시공일을 입력해주세요.");
  if (!input.cover) throw new Error("대표 이미지를 선택해주세요.");
  if (input.published && input.cover.id === "placeholder") throw new Error("공개하려면 실제 사진을 대표 이미지로 지정해주세요.");
  const data = {
    title, signType, region, completedOn: input.completedOn, clientDisplayName: input.clientDisplayName.trim(),
    description: input.description.trim(), cover: input.cover, images: input.images, published: input.published,
  };
  if (existing) return repo.update("portfolios", existing.id, data, existing.version);
  const order = Math.max(0, ...(await repo.list("portfolios")).map(x => x.order)) + 1;
  return repo.create("portfolios", { ...data, order });
}

/** 공개 여부 전환(목록 스위치). 임시 대표 이미지 상태로는 공개할 수 없다. */
export async function setPortfolioPublished(repo: Repository, p: Portfolio, published: boolean): Promise<Portfolio> {
  if (published && p.cover.id === "placeholder") throw new Error("공개하려면 실제 사진을 대표 이미지로 먼저 지정해주세요.");
  return repo.update("portfolios", p.id, { published }, p.version);
}

export async function setNewsPublished(repo: Repository, n: News, published: boolean): Promise<News> {
  return repo.update("news", n.id, { published }, n.version);
}

/** 시공사례 삭제. 연결된 의뢰의 portfolioId도 지운다. */
export async function deletePortfolio(repo: Repository, id: string): Promise<void> {
  const linked = (await repo.list("projects")).filter(p => p.portfolioId === id);
  for (const p of linked) await repo.update("projects", p.id, { portfolioId: undefined });
  await repo.remove("portfolios", id);
}

export interface NewsInput {
  category: NewsCategory; title: string; summary: string; body: string; cover: Attachment | null;
  publishedOn: ISODate | ""; pinned: boolean; published: boolean;
}

/** 소식 저장(등록·수정) */
export async function saveNews(repo: Repository, input: NewsInput, existing: News | null): Promise<News> {
  const title = input.title.trim(), summary = input.summary.trim(), body = input.body.trim();
  if (!title) throw new Error("제목을 입력해주세요.");
  if (!summary) throw new Error("요약을 입력해주세요.");
  if (!body) throw new Error("본문을 입력해주세요.");
  if (!input.publishedOn) throw new Error("게시일을 입력해주세요.");
  const { cover, ...rest } = input;
  const data = { ...rest, title, summary, body, publishedOn: input.publishedOn, cover: cover ?? undefined };
  if (existing) return repo.update("news", existing.id, data, existing.version);
  return repo.create("news", data);
}

export async function deleteNews(repo: Repository, id: string): Promise<void> {
  await repo.remove("news", id);
}

const MAX_PDF = 1024 * 1024;
const MAX_SIDE = 1200;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("파일을 읽지 못했어요."));
    r.readAsDataURL(file);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("이미지를 읽지 못했어요.")); };
    img.src = url;
  });
}

async function resizeToJpeg(file: File): Promise<string> {
  const img = await loadImage(file);
  const w = img.naturalWidth || MAX_SIDE, h = img.naturalHeight || MAX_SIDE;
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("이미지를 줄이지 못했어요.");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); // 투명 배경 → 흰색(JPEG)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

/**
 * 브라우저 전용: 파일 → 첨부(data URL).
 * 이미지는 최대 1200px JPEG(품질 0.8)로 줄이고, PDF는 1MB 이하만 허용한다.
 */
export async function fileToAttachment(file: File, by: AdminId): Promise<Attachment> {
  if (typeof window === "undefined") throw new Error("브라우저에서만 파일을 첨부할 수 있어요.");
  const id = globalThis.crypto?.randomUUID?.() ?? `att-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const at = new Date().toISOString();
  if (file.type.startsWith("image/")) {
    const url = await resizeToJpeg(file);
    return { id, name: file.name, mime: "image/jpeg", url, size: Math.round(((url.length - url.indexOf(",") - 1) * 3) / 4), uploadedBy: by, at };
  }
  if (file.type === "application/pdf") {
    if (file.size > MAX_PDF) throw new Error("1MB 이하 파일만 데모에서 첨부할 수 있어요");
    return { id, name: file.name, mime: file.type, url: await readAsDataUrl(file), size: file.size, uploadedBy: by, at };
  }
  throw new Error("이미지 또는 PDF 파일만 첨부할 수 있어요.");
}
