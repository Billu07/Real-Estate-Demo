// The weighted completion engine — the heart of the "synergy" sync.
// A change to any WorkItem rolls up: WorkItem -> Unit -> Floor -> Project.
// Weights generalize the meeting's "ceiling cluster = 15%, tile = 1%" idea.

import type { Floor, ProgressRollup, Project, Unit, WorkItem } from "./data/types";

/** In-progress items count as half-credit toward weighted completion. */
const IN_PROGRESS_CREDIT = 0.5;

function itemCredit(item: WorkItem): number {
  if (item.status === "complete") return 1;
  if (item.status === "in_progress") return IN_PROGRESS_CREDIT;
  return 0;
}

function emptyRollup(): ProgressRollup {
  return { completed: 0, total: 0, ratio: 0 };
}

function combine(parts: ProgressRollup[]): ProgressRollup {
  const completed = parts.reduce((s, p) => s + p.completed, 0);
  const total = parts.reduce((s, p) => s + p.total, 0);
  return { completed, total, ratio: total > 0 ? completed / total : 0 };
}

export function unitRollup(unit: Unit): ProgressRollup {
  if (unit.workItems.length === 0) return emptyRollup();
  const completed = unit.workItems.reduce((s, w) => s + w.weight * itemCredit(w), 0);
  const total = unit.workItems.reduce((s, w) => s + w.weight, 0);
  return { completed, total, ratio: total > 0 ? completed / total : 0 };
}

export function floorRollup(floor: Floor): ProgressRollup {
  return combine(floor.units.map(unitRollup));
}

export function projectRollup(project: Project): ProgressRollup {
  return combine(project.floors.map(floorRollup));
}

/** Count of fully completed work items across a unit. */
export function unitItemCounts(unit: Unit) {
  const complete = unit.workItems.filter((w) => w.status === "complete").length;
  const inProgress = unit.workItems.filter((w) => w.status === "in_progress").length;
  return { complete, inProgress, total: unit.workItems.length };
}

/**
 * The control-gap metric: how far contractor billing runs ahead of verified site
 * progress. Positive = over-billed (risk). This is the spreadsheet's blind spot.
 */
export function billingGap(billedPct: number, verifiedProgress: number): number {
  return billedPct - verifiedProgress;
}
