// Domain model for Pintech ERP.
// Hierarchy: Project -> Floor -> Unit (residential) / Shop (commercial) -> WorkItem.
// Designed to map 1:1 onto Supabase tables later; the seeded adapter uses the same shapes.

export type Role = "super_admin" | "project_manager" | "engineer" | "sales";

export interface User {
  id: string;
  name: string;
  title: string;
  role: Role;
  initials: string;
  email?: string;
  active?: boolean;
}

export type PaymentStatus = "pending" | "approved" | "rejected";

export interface PaymentRequest {
  id: string;
  projectId: string;
  projectName: string;
  contractorId: string;
  contractorName: string;
  contractorScope: string;
  amount: number; // installment requested, BDT
  contractValue: number;
  billedBefore: number; // 0..1 billed at request time
  verifiedAtRequest: number; // 0..1 verified progress at request time
  note?: string;
  status: PaymentStatus;
  requestedByName: string;
  decidedByName?: string;
  decidedAt?: string;
  createdAt: string;
}

export type WorkStatus = "pending" | "in_progress" | "complete";

export type UnitType = "residential" | "commercial";

export type SaleStatus = "available" | "sold" | "after_sold";

/** A single construction task within a unit, e.g. "Ceiling Plaster". */
export interface WorkItem {
  id: string;
  name: string;
  /** Relative contribution to the unit's completion (e.g. ceiling 15, tiles 1). */
  weight: number;
  status: WorkStatus;
  /** Custom on-the-fly field flag, e.g. "Gas line leaked". */
  custom?: boolean;
}

export interface Unit {
  id: string;
  name: string;
  type: UnitType;
  saleStatus: SaleStatus;
  /** Sale price in BDT, when sold. */
  salePrice?: number;
  buyer?: string;
  workItems: WorkItem[];
}

export interface Floor {
  id: string;
  name: string;
  code: string;
  order: number;
  units: Unit[];
}

export type ProjectKind = "residential" | "commercial" | "mixed";

export interface Contractor {
  id: string;
  name: string;
  scope: string; // e.g. "Civil", "Electrical", "Piling"
  isPartner: boolean;
  contractValue: number; // BDT, total contract
  billedPct: number; // 0..1 — how much they have billed/been paid
  securityDeposit: number; // BDT held
  /** The scope of work this contractor is responsible for, used to verify progress. */
  verifiedProgress: number; // 0..1 — actual site progress for their scope
}

export interface Project {
  id: string;
  name: string;
  code: string;
  kind: ProjectKind;
  location: string;
  managerId: string;
  startedOn: string; // ISO
  floors: Floor[];
  contractors: Contractor[];
}

export type UpdateKind = "progress" | "issue" | "sale" | "billing";

export interface ActivityUpdate {
  id: string;
  projectId: string;
  projectName: string;
  authorId: string;
  authorName: string;
  kind: UpdateKind;
  message: string;
  createdAt: string; // ISO
}

// ---- Derived / computed shapes (output of the rollup engine) ----

export interface ProgressRollup {
  completed: number; // weighted completed
  total: number; // weighted total
  ratio: number; // 0..1
}
