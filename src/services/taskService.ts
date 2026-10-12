import type { Repository } from "@/data/repository";
import type { AdminId, Task } from "@/domain/types";
import { applyTaskWorkflow, type TaskInput } from "@/domain/tasks";
import { log } from "./projectService";

/**
 * 업무 저장(기존 업무판 규칙 적용): 디자인 완료 → 시공 및 납품, handoff "quote"면 실측미팅 → 견적.
 * 연결 의뢰가 있으면 완료·인계 시 활동 기록.
 */
export async function saveTask(repo: Repository, input: TaskInput, existing: Task | null, actorId: AdminId, handoff?: "quote"): Promise<Task> {
  const settings = await repo.getSettings(); const now = new Date().toISOString();
  const data = applyTaskWorkflow(input, existing, now, settings, handoff);
  const saved = existing ? await repo.update("tasks", existing.id, data, existing.version) : await repo.create("tasks", data);
  if (saved.projectId) {
    const designHandoff = data.designCompletedAt === now; // 이번 저장에서 새로 인계됨
    const message = designHandoff ? `디자인 완료 → 시공 및 납품으로 인계: ${saved.title}`
      : handoff === "quote" ? `실측미팅 완료 → 견적으로 인계: ${saved.title}`
      : saved.status === "done" && existing?.status !== "done" ? `업무 완료: ${saved.title}`
      : null;
    if (message) await log(repo, saved.projectId, actorId, "task", message);
  }
  return saved;
}
