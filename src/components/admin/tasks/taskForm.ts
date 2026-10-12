import type { Task, TaskCategory } from "@/domain/types";
import type { TaskInput } from "@/domain/tasks";
import { TASK_STATUS_LABEL } from "@/domain/defaults";
import type { TaskSelectOption } from "./TaskSelect";

export const CATEGORY_EXAMPLE: Record<TaskCategory, string> = {
  design: "예: 비주얼카 세종 로고 수정", meeting: "예: 매장 간판 실측 및 고객 미팅",
  owner: "예: 간판 시공 및 납품", estimate: "예: 신규 간판 견적서 발송",
  waiting: "예: 고객 시안 확정 회신 대기", admin: "예: 세금계산서 발행 및 정산",
};

export const HANDOFF_MESSAGE = "디자인을 완료하고 시공 및 납품으로 넘겼습니다. 일정과 마감일을 확인해주세요.";
export const QUOTE_MESSAGE = "실측미팅을 완료하고 견적으로 넘겼습니다. 일정과 마감일을 확인해주세요.";

/** 진행 상태 선택지(디자인은 완료 라벨이 다르다). */
export function statusOptions(category: TaskCategory): TaskSelectOption[] {
  return (Object.keys(TASK_STATUS_LABEL) as Task["status"][]).map(v => ({ value: v, label: v === "done" && category === "design" ? "디자인 완료·시공으로" : TASK_STATUS_LABEL[v] }));
}

export function taskToInput(t: Task): TaskInput {
  return { title: t.title, category: t.category, assignee: t.assignee, assigneeId: t.assigneeId, priority: t.priority, workDate: t.workDate, dueDate: t.dueDate, status: t.status, projectId: t.projectId, customerId: t.customerId };
}

/** 저장 결과에 맞는 안내 문구(디자인 → 시공 인계 여부 포함). */
export function savedMessage(input: TaskInput, saved: Task, editing: boolean) {
  return input.category === "design" && input.status === "done" && saved.category === "owner" ? HANDOFF_MESSAGE : editing ? "변경 내용을 저장했습니다." : "업무를 등록했습니다.";
}
