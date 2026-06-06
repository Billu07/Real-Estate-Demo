// Read-only derivations shared by the Command Center and project workspace.

import { billingGap, projectRollup, unitRollup } from "@/lib/completion";
import type { Contractor, Floor, Project, Unit } from "./types";

export const OVER_BILL_THRESHOLD = 0.1; // 10pp ahead of verified progress = flagged

export interface ProjectSummary {
  project: Project;
  ratio: number;
  units: number;
  sold: number;
  available: number;
  contractValue: number;
  flaggedContractors: number;
}

export function summarizeProject(project: Project): ProjectSummary {
  const ratio = projectRollup(project).ratio;
  let units = 0;
  let sold = 0;
  let available = 0;
  for (const f of project.floors) {
    for (const u of f.units) {
      units += 1;
      if (u.saleStatus === "sold" || u.saleStatus === "after_sold") sold += 1;
      else available += 1;
    }
  }
  const contractValue = project.contractors.reduce((s, c) => s + c.contractValue, 0);
  const flaggedContractors = project.contractors.filter((c) => billingGap(c.billedPct, c.verifiedProgress) > OVER_BILL_THRESHOLD).length;
  return { project, ratio, units, sold, available, contractValue, flaggedContractors };
}

export interface BillingAlert {
  project: Project;
  contractor: Contractor;
  gap: number;
  exposure: number; // BDT billed beyond verified progress
}

export function billingAlerts(projects: Project[]): BillingAlert[] {
  const alerts: BillingAlert[] = [];
  for (const project of projects) {
    for (const c of project.contractors) {
      const gap = billingGap(c.billedPct, c.verifiedProgress);
      if (gap > OVER_BILL_THRESHOLD) {
        alerts.push({ project, contractor: c, gap, exposure: gap * c.contractValue });
      }
    }
  }
  return alerts.sort((a, b) => b.exposure - a.exposure);
}

export interface Portfolio {
  summaries: ProjectSummary[];
  overallRatio: number;
  totalProjects: number;
  totalUnits: number;
  totalSold: number;
  totalContractValue: number;
  alertCount: number;
  totalExposure: number;
}

// ---- Unit flattening + sales (Sales Officer / Inventory) ----

export interface FlatUnit {
  project: Project;
  floor: Floor;
  unit: Unit;
  ratio: number;
}

export function flattenUnits(projects: Project[]): FlatUnit[] {
  const out: FlatUnit[] = [];
  for (const project of projects) {
    for (const floor of project.floors) {
      for (const unit of floor.units) {
        out.push({ project, floor, unit, ratio: unitRollup(unit).ratio });
      }
    }
  }
  return out;
}

export interface SalesSummary {
  total: number;
  sold: number;
  afterSold: number;
  available: number;
  revenue: number;
  pipelineValue: number; // value of available units (est. from sold avg)
}

export function salesSummary(projects: Project[]): SalesSummary {
  const units = flattenUnits(projects);
  let sold = 0;
  let afterSold = 0;
  let available = 0;
  let revenue = 0;
  const soldPrices: number[] = [];
  for (const { unit } of units) {
    if (unit.saleStatus === "sold") sold += 1;
    else if (unit.saleStatus === "after_sold") afterSold += 1;
    else available += 1;
    if (unit.salePrice && unit.saleStatus !== "available") {
      revenue += unit.salePrice;
      soldPrices.push(unit.salePrice);
    }
  }
  const avg = soldPrices.length ? soldPrices.reduce((a, b) => a + b, 0) / soldPrices.length : 7000000;
  return { total: units.length, sold, afterSold, available, revenue, pipelineValue: available * avg };
}

// ---- Per-manager scoping (Project Manager dashboard) ----

export function projectsForManager(projects: Project[], managerId: string): Project[] {
  return projects.filter((p) => p.managerId === managerId);
}

export function buildPortfolio(projects: Project[]): Portfolio {
  const summaries = projects.map(summarizeProject);
  let completed = 0;
  let total = 0;
  for (const p of projects) {
    const r = projectRollup(p);
    completed += r.completed;
    total += r.total;
  }
  const alerts = billingAlerts(projects);
  return {
    summaries,
    overallRatio: total > 0 ? completed / total : 0,
    totalProjects: projects.length,
    totalUnits: summaries.reduce((s, x) => s + x.units, 0),
    totalSold: summaries.reduce((s, x) => s + x.sold, 0),
    totalContractValue: summaries.reduce((s, x) => s + x.contractValue, 0),
    alertCount: alerts.length,
    totalExposure: alerts.reduce((s, a) => s + a.exposure, 0),
  };
}
