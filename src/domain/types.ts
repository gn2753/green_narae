export type AdminId = "kim" | "choi";
export type ISODate = string;
export type ISOTime = string;

export interface Base { id: string; createdAt: ISOTime; updatedAt: ISOTime; version: number; }
export interface Attachment { id: string; name: string; mime: string; url: string; size: number; uploadedBy: AdminId | "web"; at: ISOTime; }

export interface Permissions { view: boolean; edit: boolean; money: boolean; publish: boolean; }
export interface Admin { id: AdminId; name: string; title: "대표이사" | "대표"; email: string; color: string; initial: string; roles: string[]; permissions: Permissions; }

export interface Customer extends Base { name: string; company?: string; phone: string; email?: string; sites: string[]; memo?: string; }

export type InquirySource = "web" | "phone" | "kakao" | "visit" | "email" | "etc";
export type ReplyChannel = "phone" | "sms" | "email" | "kakao" | "etc";
export interface Reply { id: string; at: ISOTime; by: AdminId; channel: ReplyChannel; message: string; }
export interface Inquiry extends Base {
  name: string; phone: string; email?: string; message: string; source: InquirySource;
  status: "open" | "answered" | "closed"; isNew: boolean; assigneeId: AdminId | null;
  customerId: string | null; projectId: string | null; replies: Reply[];
}

export type StageKey = "measure" | "quote" | "design" | "install" | "settle";
export interface DesignVersion { no: number; note?: string; attachments: Attachment[]; confirmed: boolean; }
export interface StageRecord { fields: Record<string, string | boolean>; attachments: Attachment[]; designVersions?: DesignVersion[]; }
export interface Waiting { reason: string; since: ISOTime; expectedDate?: ISODate; }
export interface Project extends Base {
  title: string; signType: string; customerId: string; inquiryId: string | null; siteAddress?: string;
  stage: StageKey; assigneeId: AdminId | null; dueDate?: ISODate; status: "active" | "done" | "closed";
  waiting: Waiting | null; stageRecords: Partial<Record<StageKey, StageRecord>>;
  taxInvoiceIssued: boolean; portfolioId?: string;
}
export type ActivityType = "create" | "stage" | "waiting" | "task" | "attach" | "note" | "edit" | "money";
/** createdAt = 발생 시각 */
export interface Activity extends Base { projectId: string; actorId: AdminId | "web"; type: ActivityType; message: string; }

export type TaskCategory = "design" | "meeting" | "owner" | "estimate" | "waiting" | "admin";
export type Priority = "urgent" | "high" | "normal" | "low";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export interface Task extends Base {
  title: string; category: TaskCategory; assignee: string; assigneeId: AdminId | null;
  priority: Priority; workDate: ISODate; dueDate: ISODate; status: TaskStatus;
  completedAt: ISOTime | null; designCompletedAt: ISOTime | null; meetingCompletedAt: ISOTime | null;
  projectId: string | null; customerId: string | null;
}

export type ContractStatus = "draft" | "sent" | "signed" | "cancelled";
export interface Contract extends Base {
  customerId: string; projectId: string | null; status: ContractStatus;
  quoteAmount: number; vatIncluded: boolean; quoteFile?: Attachment; quoteSentOn?: ISODate;
  contractAmount?: number; signedOn?: ISODate;
  deposit?: { amount: number; dueDate: ISODate }; balance?: { amount: number; dueDate: ISODate }; memo?: string;
}
export type PaymentKind = "deposit" | "balance" | "extra";
export interface Payment extends Base {
  contractId: string; customerId: string; projectId: string | null; kind: PaymentKind;
  amount: number; dueDate: ISODate; paidOn: ISODate | null; proof?: Attachment; confirmedBy?: AdminId;
}

export interface Vendor extends Base { name: string; field: string; contactName?: string; phone?: string; memo?: string; }
export type OrderStatus = "requested" | "producing" | "shipped" | "received";
export interface PurchaseOrder extends Base {
  projectId: string | null; vendorId: string; item: string; amount: number;
  orderedOn: ISODate; dueDate: ISODate; status: OrderStatus; receivedOn: ISODate | null;
}
export interface LedgerEntry extends Base {
  type: "purchase" | "sale"; date: ISODate; amount: number; vat: number; category?: string;
  vendorId?: string; customerId?: string; projectId?: string | null; memo?: string;
  sourceRef?: { kind: "order" | "payment"; id: string };
}

export interface Portfolio extends Base {
  title: string; signType: string; region: string; completedOn: ISODate; clientDisplayName: string;
  description: string; cover: Attachment; images: Attachment[]; published: boolean; order: number; projectId?: string;
}
export type NewsCategory = "news" | "notice" | "event";
export interface News extends Base {
  category: NewsCategory; title: string; summary: string; body: string; cover?: Attachment;
  publishedOn: ISODate; pinned: boolean; published: boolean;
}

export type VisitSource = "naver" | "naver_blog" | "google" | "daum" | "instagram" | "direct" | "other";
export type Device = "mobile" | "tablet" | "desktop";
/** createdAt = 그날 첫 방문 시각 */
export interface Visit extends Base { date: ISODate; visitorId: string; pages: string[]; referrer: string; source: VisitSource; device: Device; browser: string; }

export type SummaryItem = "today" | "overdue" | "inquiries" | "payments";
export interface Settings {
  taskCategories: { key: TaskCategory; label: string; description: string; defaultAssigneeId: AdminId | null }[];
  stages: { key: StageKey; label: string; color: string; defaultAssigneeId: AdminId | null }[];
  waitingReasons: string[]; signTypes: string[]; purchaseCategories: string[]; vendorFields: string[];
  notifications: { dailySummary: { enabled: boolean; time: string; recipients: AdminId[]; items: SummaryItem[] }; newInquiry: boolean };
  excludedVisitorIds: string[];
}

export interface InquiryForm { name: string; phone: string; email: string; message: string; agree: boolean; }
