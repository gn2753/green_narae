import type { Base, Customer, ISODate, Portfolio, Project } from "./types";
export function maskName(name: string): string {
  const s = name.trim();
  return s.length <= 2 ? s[0] + "○" : "○".repeat(s.length - 2) + s.slice(-2);
}
export function portfolioDraftFromProject(p: Project, c: Customer, today: ISODate, region: string): Omit<Portfolio, keyof Base | "order"> {
  const photos = [...(p.stageRecords.install?.attachments ?? []), ...(p.stageRecords.design?.designVersions?.flatMap(v => v.attachments) ?? [])].filter(a => a.mime.startsWith("image/"));
  const installedOn = p.stageRecords.install?.fields.installedOn;
  const placeholder = { id: "placeholder", name: "대표 이미지", mime: "image/svg+xml", url: "/samples/placeholder.svg", size: 0, uploadedBy: "web" as const, at: p.updatedAt };
  return {
    title: `${c.company ?? c.name} ${p.signType}`, signType: p.signType, region,
    completedOn: typeof installedOn === "string" ? installedOn : today,
    clientDisplayName: `${region} ${maskName(c.company ?? c.name)}`, description: "",
    cover: photos[0] ?? placeholder, images: photos.slice(1), published: false, projectId: p.id,
  };
}
