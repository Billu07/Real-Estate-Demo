"use client";

// The live client store. Initializes from seeded data for an instant UI, then
// hydrates from Supabase when configured. Every mutation updates local state
// optimistically and writes through to Supabase (fire-and-forget). Realtime
// (see components/supabase-sync.tsx) patches the store from other clients.

import { create } from "zustand";
import type { ActivityUpdate, PaymentRequest, PaymentStatus, Project, Role, SaleStatus, Unit, User, WorkItem, WorkStatus } from "./data/types";
import { buildSeedActivity, buildSeedPayments, buildSeedProjects, USERS } from "./data/seed";
import { db } from "./data/supabase-repo";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const uuid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

const NEW_UNIT_TEMPLATE: { name: string; weight: number }[] = [
  { name: "Bricks Layout", weight: 8 },
  { name: "Lintel / False Slab", weight: 10 },
  { name: "Brick Works", weight: 10 },
  { name: "Ceiling Plaster", weight: 15 },
  { name: "Plastering", weight: 12 },
  { name: "Electrical Wiring", weight: 12 },
  { name: "Sanitary", weight: 8 },
  { name: "Tiles Work", weight: 6 },
];

type Source = "seed" | "supabase";

interface PintechState {
  projects: Project[];
  activity: ActivityUpdate[];
  users: User[];
  payments: PaymentRequest[];
  currentRole: Role;
  source: Source;
  ready: boolean;
  authProfileId: string | null;
  touched: Record<string, number>;

  setRole: (role: Role) => void;
  setAuthProfile: (user: User) => void;
  currentUser: () => User;

  hydrate: (data: { projects: Project[]; activity: ActivityUpdate[]; users: User[]; payments: PaymentRequest[] }) => void;
  useSeedFallback: () => void;
  applyRemoteWorkItem: (id: string, status: WorkStatus) => void;
  applyRemoteActivity: (update: ActivityUpdate) => void;

  addUser: (u: Omit<User, "id" | "initials"> & { initials?: string }) => void;
  upsertUserLocal: (user: User) => void;
  updateUser: (id: string, patch: Partial<Pick<User, "name" | "title" | "role" | "email" | "active">>) => void;
  createProject: (project: Project, managerId: string | null) => void;
  requestPayment: (projectId: string, contractorId: string, amount: number, note: string) => void;
  decidePayment: (id: string, status: Exclude<PaymentStatus, "pending">) => void;

  setWorkItemStatus: (projectId: string, unitId: string, workItemId: string, status: WorkStatus) => void;
  addWorkItem: (projectId: string, unitId: string, name: string, weight: number) => void;
  addFloor: (projectId: string, name: string, code: string) => void;
  addUnit: (projectId: string, floorId: string, name: string, type: Unit["type"]) => void;
  setUnitSale: (projectId: string, unitId: string, saleStatus: SaleStatus, salePrice?: number, buyer?: string) => void;
  postUpdate: (update: Omit<ActivityUpdate, "id" | "createdAt">) => void;
}

function touch(ids: string[]): Record<string, number> {
  const now = Date.now();
  const out: Record<string, number> = {};
  for (const id of ids) out[id] = now;
  return out;
}

const mapUnits = (project: Project, unitId: string, fn: (u: Unit) => Unit): Project => ({
  ...project,
  floors: project.floors.map((f) => ({ ...f, units: f.units.map((u) => (u.id === unitId ? fn(u) : u)) })),
});

// When Supabase is configured we load live data instead of flashing seed data
// (which carries different ids). Otherwise the seeded store is the source of truth.
const SUPA = isSupabaseConfigured();
const seedProjects = SUPA ? [] : buildSeedProjects();

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

export const usePintech = create<PintechState>((set, get) => ({
  projects: seedProjects,
  activity: SUPA ? [] : buildSeedActivity(),
  users: SUPA ? [] : USERS,
  payments: SUPA ? [] : buildSeedPayments(seedProjects),
  currentRole: "super_admin",
  source: "seed",
  ready: !SUPA,
  authProfileId: null,
  touched: {},

  setRole: (role) => set({ currentRole: role }),

  setAuthProfile: (user) =>
    set((state) => ({
      users: state.users.some((u) => u.id === user.id) ? state.users.map((u) => (u.id === user.id ? user : u)) : [...state.users, user],
      authProfileId: user.id,
      currentRole: user.role,
    })),

  currentUser: () => {
    const { authProfileId, users, currentRole } = get();
    if (authProfileId) {
      const me = users.find((u) => u.id === authProfileId);
      if (me) return me;
    }
    return users.find((u) => u.role === currentRole && u.active !== false) ?? users.find((u) => u.role === currentRole) ?? USERS.find((u) => u.role === currentRole) ?? USERS[0];
  },

  hydrate: ({ projects, activity, users, payments }) => set({ projects, activity, users, payments, source: "supabase", ready: true }),

  // Used when Supabase is configured but unreachable / not yet migrated.
  useSeedFallback: () => {
    if (get().ready) return;
    const seed = buildSeedProjects();
    set({ projects: seed, activity: buildSeedActivity(), users: USERS, payments: buildSeedPayments(seed), source: "seed", ready: true });
  },

  applyRemoteWorkItem: (id, status) =>
    set((state) => ({
      touched: { ...state.touched, ...touch([id]) },
      projects: state.projects.map((p) => ({
        ...p,
        floors: p.floors.map((f) => ({
          ...f,
          units: f.units.map((u) => ({ ...u, workItems: u.workItems.map((w) => (w.id === id ? { ...w, status } : w)) })),
        })),
      })),
    })),

  applyRemoteActivity: (update) =>
    set((state) => (state.activity.some((a) => a.id === update.id) ? state : { activity: [update, ...state.activity] })),

  setWorkItemStatus: (projectId, unitId, workItemId, status) => {
    set((state) => ({
      touched: { ...state.touched, ...touch([workItemId, unitId, projectId]) },
      projects: state.projects.map((p) =>
        p.id !== projectId ? p : mapUnits(p, unitId, (u) => ({ ...u, workItems: u.workItems.map((w) => (w.id === workItemId ? { ...w, status } : w)) })),
      ),
    }));
    if (get().source === "supabase") void db.setWorkItemStatus(workItemId, status);
  },

  addWorkItem: (projectId, unitId, name, weight) => {
    const id = uuid();
    const newItem: WorkItem = { id, name, weight, status: "pending", custom: true };
    set((state) => ({
      touched: { ...state.touched, ...touch([unitId]) },
      projects: state.projects.map((p) => (p.id !== projectId ? p : mapUnits(p, unitId, (u) => ({ ...u, workItems: [...u.workItems, newItem] })))),
    }));
    if (get().source === "supabase") void db.addWorkItem(id, unitId, name, weight);
  },

  addFloor: (projectId, name, code) => {
    const id = uuid();
    let sortOrder = 0;
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        sortOrder = p.floors.length;
        return { ...p, floors: [...p.floors, { id, name, code, order: sortOrder, units: [] }] };
      }),
    }));
    if (get().source === "supabase") void db.addFloor(id, projectId, name, code, sortOrder);
  },

  addUnit: (projectId, floorId, name, type) => {
    const id = uuid();
    const items = NEW_UNIT_TEMPLATE.map((t) => ({ id: uuid(), name: t.name, weight: t.weight, status: "pending" as WorkStatus }));
    const newUnit: Unit = { id, name, type, saleStatus: "available", workItems: items };
    set((state) => ({
      touched: { ...state.touched, ...touch([floorId]) },
      projects: state.projects.map((p) =>
        p.id !== projectId ? p : { ...p, floors: p.floors.map((f) => (f.id !== floorId ? f : { ...f, units: [...f.units, newUnit] })) },
      ),
    }));
    if (get().source === "supabase") void db.addUnit(id, floorId, name, type, items.map((i) => ({ id: i.id, name: i.name, weight: i.weight })));
  },

  setUnitSale: (projectId, unitId, saleStatus, salePrice, buyer) => {
    set((state) => ({
      touched: { ...state.touched, ...touch([unitId]) },
      projects: state.projects.map((p) =>
        p.id !== projectId
          ? p
          : mapUnits(p, unitId, (u) => ({
              ...u,
              saleStatus,
              salePrice: saleStatus === "available" ? undefined : salePrice ?? u.salePrice,
              buyer: saleStatus === "available" ? undefined : buyer ?? u.buyer,
            })),
      ),
    }));
    if (get().source === "supabase") void db.setUnitSale(unitId, saleStatus, salePrice, buyer);
  },

  postUpdate: (update) => {
    const id = uuid();
    set((state) => ({ activity: [{ ...update, id, createdAt: new Date().toISOString() }, ...state.activity] }));
    if (get().source === "supabase") void db.postUpdate(id, update.projectId, update.kind, update.message);
  },

  addUser: (u) => {
    const id = uuid();
    const user: User = { id, name: u.name, title: u.title, role: u.role, email: u.email, active: u.active ?? true, initials: u.initials ?? initials(u.name) };
    set((state) => ({ users: [...state.users, user] }));
    if (get().source === "supabase") void db.addUser(user);
  },

  // Adds a user record to local state without a DB write (used after the
  // server route has already created the auth account + profile).
  upsertUserLocal: (user) =>
    set((state) => ({ users: state.users.some((u) => u.id === user.id) ? state.users.map((u) => (u.id === user.id ? user : u)) : [...state.users, user] })),

  updateUser: (id, patch) => {
    const next = patch.name ? { ...patch, initials: initials(patch.name) } : patch;
    set((state) => ({ users: state.users.map((u) => (u.id === id ? { ...u, ...next } : u)) }));
    if (get().source === "supabase") void db.updateUser(id, next);
  },

  createProject: (project, managerId) => {
    set((state) => ({ projects: [...state.projects, project].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })) }));
    if (get().source === "supabase") void db.createProject(project, managerId);
  },

  requestPayment: (projectId, contractorId, amount, note) => {
    const id = uuid();
    const state = get();
    const project = state.projects.find((p) => p.id === projectId);
    const contractor = project?.contractors.find((c) => c.id === contractorId);
    if (!project || !contractor) return;
    const user = state.currentUser();
    const req: PaymentRequest = {
      id,
      projectId,
      projectName: project.name,
      contractorId,
      contractorName: contractor.name,
      contractorScope: contractor.scope,
      amount,
      contractValue: contractor.contractValue,
      billedBefore: contractor.billedPct,
      verifiedAtRequest: contractor.verifiedProgress,
      note,
      status: "pending",
      requestedByName: user.name,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ payments: [req, ...s.payments] }));
    if (state.source === "supabase") void db.createPaymentRequest(id, { projectId, contractorId, amount, billedBefore: contractor.billedPct, verifiedAtRequest: contractor.verifiedProgress, note, requestedById: user.id });
  },

  decidePayment: (id, status) => {
    const state = get();
    const req = state.payments.find((p) => p.id === id);
    if (!req) return;
    const user = state.currentUser();
    const newBilled = Math.min(1, req.billedBefore + req.amount / Math.max(1, req.contractValue));

    set((s) => ({
      payments: s.payments.map((p) => (p.id === id ? { ...p, status, decidedByName: user.name, decidedAt: new Date().toISOString() } : p)),
      projects:
        status === "approved"
          ? s.projects.map((p) =>
              p.id !== req.projectId ? p : { ...p, contractors: p.contractors.map((c) => (c.id === req.contractorId ? { ...c, billedPct: newBilled } : c)) },
            )
          : s.projects,
    }));

    if (state.source === "supabase") void db.decidePayment(id, status, user.id, status === "approved" ? { id: req.contractorId, newBilledPct: newBilled } : undefined);
  },
}));
