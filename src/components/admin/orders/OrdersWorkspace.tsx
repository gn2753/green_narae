"use client";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useCollection } from "@/data/hooks";
import type { PurchaseOrder, Vendor } from "@/domain/types";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { OrderForm } from "./OrderForm";
import { isOrderFilter, OrderList } from "./OrderList";
import { VendorForm } from "./VendorForm";
import { VendorList } from "./VendorList";

const btn = "inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark md:min-h-10";

/** A05 제작업체·발주. `?tab=orders|vendors`, `?status=`, `?id=`(발주 강조), `?new=1&project=`(발주 등록 열기). */
export function OrdersWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const orders = useCollection("orders");
  const vendors = useCollection("vendors");
  const tab = params.get("tab") === "vendors" ? "vendors" : "orders";
  const sp = params.get("status");
  const filter = isOrderFilter(sp) ? sp : "all";
  const highlightId = params.get("id");
  const wantNew = params.get("new") === "1";
  const prefillProject = params.get("project") ?? undefined;

  const [editOrder, setEditOrder] = useState<PurchaseOrder | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [vendorOpen, setVendorOpen] = useState(false);
  // `?new=1` 로 들어오면 발주 등록 창을 한 번 연다(렌더 중 상태 조정). 닫을 때 쿼리를 지운다.
  const [handledNew, setHandledNew] = useState(false);
  if (wantNew && !handledNew) { setHandledNew(true); setEditOrder(null); setOrderOpen(true); }
  if (!wantNew && handledNew) setHandledNew(false);

  const openOrder = (o: PurchaseOrder | null) => { setEditOrder(o); setOrderOpen(true); };
  const openVendor = (v: Vendor | null) => { setEditVendor(v); setVendorOpen(true); };
  const closeOrder = (o: boolean) => { setOrderOpen(o); if (!o && wantNew) router.replace(tab === "vendors" ? `${pathname}?tab=vendors` : pathname, { scroll: false }); };

  const tabs = [
    { label: `발주 ${orders.items.length}`, href: pathname, active: tab === "orders" },
    { label: `제작업체 ${vendors.items.length}`, href: `${pathname}?tab=vendors`, active: tab === "vendors" },
  ];
  const actions = tab === "orders"
    ? <button type="button" onClick={() => openOrder(null)} className={btn}><Plus className="size-4" aria-hidden />발주 등록</button>
    : <button type="button" onClick={() => openVendor(null)} className={btn}><Plus className="size-4" aria-hidden />업체 등록</button>;

  return (
    <>
      <PageHeader title="제작업체·발주" description="제작업체와 발주 진행, 수령 확인까지 관리해요." actions={actions} tabs={tabs} />
      {tab === "orders"
        ? <OrderList filter={filter} highlightId={highlightId} onEdit={openOrder} onAdd={() => openOrder(null)} />
        : <VendorList onEdit={openVendor} onAdd={() => openVendor(null)} />}
      <OrderForm open={orderOpen} order={editOrder} prefillProjectId={editOrder ? undefined : prefillProject} onOpenChange={closeOrder} />
      <VendorForm open={vendorOpen} vendor={editVendor} onOpenChange={setVendorOpen} />
    </>
  );
}
