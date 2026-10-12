import type { Activity, Base, Contract, Customer, Inquiry, LedgerEntry, News, Payment, Portfolio, Project, PurchaseOrder, Settings, Task, Vendor, Visit } from "@/domain/types";

export interface CollectionMap { customers: Customer; inquiries: Inquiry; projects: Project; activities: Activity; tasks: Task; contracts: Contract; payments: Payment; vendors: Vendor; orders: PurchaseOrder; ledger: LedgerEntry; portfolios: Portfolio; news: News; visits: Visit; }
export type CollectionName = keyof CollectionMap;
export type NewDoc<T extends Base> = Omit<T, keyof Base> & { id?: string };
export interface DemoSnapshot { schema: 1; collections: { [K in CollectionName]: CollectionMap[K][] }; settings: Settings; }
export interface Repository {
  list<K extends CollectionName>(c: K): Promise<CollectionMap[K][]>;
  get<K extends CollectionName>(c: K, id: string): Promise<CollectionMap[K] | null>;
  create<K extends CollectionName>(c: K, data: NewDoc<CollectionMap[K]>): Promise<CollectionMap[K]>;
  update<K extends CollectionName>(c: K, id: string, patch: Partial<Omit<CollectionMap[K], keyof Base>>, expectedVersion?: number): Promise<CollectionMap[K]>;
  remove<K extends CollectionName>(c: K, id: string): Promise<void>;
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
  subscribe(cb: () => void): () => void;
  exportAll(): Promise<DemoSnapshot>;
  importAll(s: DemoSnapshot): Promise<void>;
  reset(): Promise<void>;
}
