// Repository interface — the single seam between the UI and the data source.
//
// The demo is backed by the Zustand seeded store (lib/store.ts). To go live, add
// a Supabase-backed implementation of this interface and swap it in; no screen
// needs to change because every component consumes these shapes.

import type { ActivityUpdate, Project, Unit, WorkStatus } from "./types";

export interface PintechRepository {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  listActivity(): Promise<ActivityUpdate[]>;

  setWorkItemStatus(input: { projectId: string; unitId: string; workItemId: string; status: WorkStatus }): Promise<void>;
  addWorkItem(input: { projectId: string; unitId: string; name: string; weight: number }): Promise<void>;
  addFloor(input: { projectId: string; name: string; code: string }): Promise<void>;
  addUnit(input: { projectId: string; floorId: string; name: string; type: Unit["type"] }): Promise<void>;
  postUpdate(update: Omit<ActivityUpdate, "id" | "createdAt">): Promise<void>;
}
