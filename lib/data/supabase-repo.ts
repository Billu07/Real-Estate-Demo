"use client";

// Live Supabase data layer. Reads the full nested project tree, maps DB rows to
// domain types, and writes changes back. New entities get a client-generated
// UUID so local state and the DB row share the same id (no round-trip needed).

import { getBrowserSupabase } from "@/lib/supabase/client";
import type { ActivityUpdate, PaymentRequest, PaymentStatus, Project, Role, SaleStatus, Unit, User, WorkStatus } from "./types";

const WORK_ORDER = [
  "Bricks Layout",
  "Lintel / False Slab",
  "Brick Works",
  "Ceiling Plaster",
  "Plastering",
  "Door Frame Setting",
  "Window Grill Setting",
  "Washroom Grill Setting",
  "Electrical Wiring",
  "Sanitary",
  "Tiles Work",
  "Gas Line",
];

const naturalCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

function workOrderIndex(name: string): number {
  const i = WORK_ORDER.indexOf(name);
  return i === -1 ? WORK_ORDER.length : i;
}

const PROJECT_SELECT =
  "id,name,code,kind,location,manager_id,started_on," +
  "floor(id,name,code,sort_order,unit(id,name,type,sale_status,sale_price,buyer,work_item(id,name,weight,status,custom)))," +
  "contractor(id,name,scope,is_partner,contract_value,billed_pct,security_deposit,verified_progress)";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProject(row: any): Project {
  const floors = (row.floor ?? [])
    .slice()
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((f: any) => ({
      id: f.id,
      name: f.name,
      code: f.code,
      order: f.sort_order,
      units: (f.unit ?? [])
        .slice()
        .sort((a: any, b: any) => naturalCompare(a.name, b.name))
        .map((u: any) => ({
          id: u.id,
          name: u.name,
          type: u.type,
          saleStatus: u.sale_status,
          salePrice: u.sale_price ?? undefined,
          buyer: u.buyer ?? undefined,
          workItems: (u.work_item ?? [])
            .slice()
            .sort((a: any, b: any) => workOrderIndex(a.name) - workOrderIndex(b.name))
            .map((w: any) => ({ id: w.id, name: w.name, weight: Number(w.weight), status: w.status, custom: w.custom })),
        })),
    }));

  const contractors = (row.contractor ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    scope: c.scope,
    isPartner: c.is_partner,
    contractValue: Number(c.contract_value),
    billedPct: Number(c.billed_pct),
    securityDeposit: Number(c.security_deposit),
    verifiedProgress: Number(c.verified_progress),
  }));

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    kind: row.kind,
    location: row.location,
    managerId: row.manager_id ?? "",
    startedOn: row.started_on,
    floors,
    contractors,
  };
}

export interface HydrateData {
  projects: Project[];
  activity: ActivityUpdate[];
  users: User[];
  payments: PaymentRequest[];
}

export async function fetchAll(): Promise<HydrateData | null> {
  const sb = getBrowserSupabase();
  if (!sb) return null;

  const [
    { data: projectRows, error: pErr },
    { data: actRows, error: aErr },
    { data: userRows, error: uErr },
    { data: payRows },
  ] = await Promise.all([
    sb.from("project").select(PROJECT_SELECT).order("code"),
    sb.from("activity_update").select("id,project_id,kind,message,created_at,project(name),author:app_user(name)").order("created_at", { ascending: false }),
    sb.from("app_user").select("id,name,title,role,initials,email,active").order("role"),
    sb
      .from("payment_request")
      .select("*,project(name),contractor(name,scope,contract_value),requester:app_user!requested_by(name),decider:app_user!decided_by(name)")
      .order("created_at", { ascending: false }),
  ]);

  if (pErr || aErr || uErr) {
    console.warn("Supabase fetch failed, using seeded data:", pErr?.message ?? aErr?.message ?? uErr?.message);
    return null;
  }

  const projects = (projectRows ?? []).map(mapProject).sort((a, b) => naturalCompare(a.name, b.name));
  const activity: ActivityUpdate[] = (actRows ?? []).map((a: any) => ({
    id: a.id,
    projectId: a.project_id,
    projectName: a.project?.name ?? "",
    authorId: "",
    authorName: a.author?.name ?? "System",
    kind: a.kind,
    message: a.message,
    createdAt: a.created_at,
  }));
  const users: User[] = (userRows ?? []).map((u: any) => ({
    id: u.id,
    name: u.name,
    title: u.title,
    role: u.role,
    initials: u.initials,
    email: u.email ?? undefined,
    active: u.active ?? true,
  }));
  const payments: PaymentRequest[] = (payRows ?? []).map(mapPayment);

  return { projects, activity, users, payments };
}

function mapPayment(p: any): PaymentRequest {
  return {
    id: p.id,
    projectId: p.project_id,
    projectName: p.project?.name ?? "",
    contractorId: p.contractor_id,
    contractorName: p.contractor?.name ?? "",
    contractorScope: p.contractor?.scope ?? "",
    amount: Number(p.amount),
    contractValue: Number(p.contractor?.contract_value ?? 0),
    billedBefore: Number(p.billed_before),
    verifiedAtRequest: Number(p.verified_at_request),
    note: p.note ?? undefined,
    status: p.status,
    requestedByName: p.requester?.name ?? "—",
    decidedByName: p.decider?.name ?? undefined,
    decidedAt: p.decided_at ?? undefined,
    createdAt: p.created_at,
  };
}

// ---- Write-through helpers (fire-and-forget from the store) ----

function logErr(label: string, error: { message: string } | null) {
  if (error) console.error(`Supabase ${label}:`, error.message);
}

export const db = {
  async setWorkItemStatus(id: string, status: WorkStatus) {
    const sb = getBrowserSupabase();
    if (!sb) return;
    logErr("setWorkItemStatus", (await sb.from("work_item").update({ status }).eq("id", id)).error);
  },

  async addWorkItem(id: string, unitId: string, name: string, weight: number) {
    const sb = getBrowserSupabase();
    if (!sb) return;
    logErr("addWorkItem", (await sb.from("work_item").insert({ id, unit_id: unitId, name, weight, status: "pending", custom: true })).error);
  },

  async addFloor(id: string, projectId: string, name: string, code: string, sortOrder: number) {
    const sb = getBrowserSupabase();
    if (!sb) return;
    logErr("addFloor", (await sb.from("floor").insert({ id, project_id: projectId, name, code, sort_order: sortOrder })).error);
  },

  async addUnit(id: string, floorId: string, name: string, type: Unit["type"], workItems: { id: string; name: string; weight: number }[]) {
    const sb = getBrowserSupabase();
    if (!sb) return;
    logErr("addUnit", (await sb.from("unit").insert({ id, floor_id: floorId, name, type, sale_status: "available" })).error);
    if (workItems.length) {
      logErr("addUnit.items", (await sb.from("work_item").insert(workItems.map((w) => ({ id: w.id, unit_id: id, name: w.name, weight: w.weight, status: "pending", custom: false })))).error);
    }
  },

  async setUnitSale(id: string, saleStatus: SaleStatus, salePrice?: number, buyer?: string) {
    const sb = getBrowserSupabase();
    if (!sb) return;
    const patch = saleStatus === "available" ? { sale_status: saleStatus, sale_price: null, buyer: null } : { sale_status: saleStatus, sale_price: salePrice ?? null, buyer: buyer ?? null };
    logErr("setUnitSale", (await sb.from("unit").update(patch).eq("id", id)).error);
  },

  async postUpdate(id: string, projectId: string, kind: string, message: string) {
    const sb = getBrowserSupabase();
    if (!sb) return;
    logErr("postUpdate", (await sb.from("activity_update").insert({ id, project_id: projectId, kind, message })).error);
  },

  // ---- Team ----
  async addUser(u: User) {
    const sb = getBrowserSupabase();
    if (!sb) return;
    logErr("addUser", (await sb.from("app_user").insert({ id: u.id, name: u.name, title: u.title, role: u.role, initials: u.initials, email: u.email ?? null, active: u.active ?? true })).error);
  },
  async updateUser(id: string, patch: { name?: string; title?: string; role?: Role; email?: string; active?: boolean; initials?: string }) {
    const sb = getBrowserSupabase();
    if (!sb) return;
    logErr("updateUser", (await sb.from("app_user").update(patch).eq("id", id)).error);
  },

  // ---- Project creation ----
  async createProject(p: Project, managerId: string | null) {
    const sb = getBrowserSupabase();
    if (!sb) return;
    logErr("createProject", (await sb.from("project").insert({ id: p.id, name: p.name, code: p.code, kind: p.kind, location: p.location, manager_id: managerId, started_on: p.startedOn })).error);
    if (p.contractors.length) {
      logErr("createProject.contractors", (await sb.from("contractor").insert(p.contractors.map((c) => ({ id: c.id, project_id: p.id, name: c.name, scope: c.scope, is_partner: c.isPartner, contract_value: c.contractValue, billed_pct: c.billedPct, security_deposit: c.securityDeposit, verified_progress: c.verifiedProgress })))).error);
    }
    for (const f of p.floors) {
      logErr("createProject.floor", (await sb.from("floor").insert({ id: f.id, project_id: p.id, name: f.name, code: f.code, sort_order: f.order })).error);
      if (f.units.length) {
        logErr("createProject.units", (await sb.from("unit").insert(f.units.map((u) => ({ id: u.id, floor_id: f.id, name: u.name, type: u.type, sale_status: u.saleStatus })))).error);
        const items = f.units.flatMap((u) => u.workItems.map((w) => ({ id: w.id, unit_id: u.id, name: w.name, weight: w.weight, status: w.status, custom: Boolean(w.custom) })));
        if (items.length) logErr("createProject.items", (await sb.from("work_item").insert(items)).error);
      }
    }
  },

  // ---- Payment approvals ----
  async createPaymentRequest(id: string, r: { projectId: string; contractorId: string; amount: number; billedBefore: number; verifiedAtRequest: number; note?: string; requestedById: string | null }) {
    const sb = getBrowserSupabase();
    if (!sb) return;
    logErr("createPaymentRequest", (await sb.from("payment_request").insert({ id, project_id: r.projectId, contractor_id: r.contractorId, amount: r.amount, billed_before: r.billedBefore, verified_at_request: r.verifiedAtRequest, note: r.note ?? null, requested_by: r.requestedById, status: "pending" })).error);
  },
  async decidePayment(id: string, status: PaymentStatus, deciderId: string | null, contractor?: { id: string; newBilledPct: number }) {
    const sb = getBrowserSupabase();
    if (!sb) return;
    logErr("decidePayment", (await sb.from("payment_request").update({ status, decided_by: deciderId, decided_at: new Date().toISOString() }).eq("id", id)).error);
    if (status === "approved" && contractor) {
      logErr("decidePayment.contractor", (await sb.from("contractor").update({ billed_pct: contractor.newBilledPct }).eq("id", contractor.id)).error);
    }
  },
};
