// Seeded demo data modeled on the client's real NRD spreadsheets.
// Deterministic so the demo looks identical on every reload.

import type {
  ActivityUpdate,
  Contractor,
  Floor,
  PaymentRequest,
  Project,
  Unit,
  User,
  WorkItem,
  WorkStatus,
} from "./types";

export const USERS: User[] = [
  { id: "u-admin", name: "Soumya Chakraborty", title: "Chairman / Owner", role: "super_admin", initials: "SC", email: "soumya@nrdprojects.com", active: true },
  { id: "u-pm", name: "Minhaz Uddin Fahim", title: "Project Manager", role: "project_manager", initials: "MF", email: "minhaz@nrdprojects.com", active: true },
  { id: "u-eng", name: "Arjun Das", title: "Project Engineer", role: "engineer", initials: "AD", email: "arjun@nrdprojects.com", active: true },
  { id: "u-sales", name: "Nusrat Jahan", title: "Sales Manager", role: "sales", initials: "NJ", email: "nusrat@nrdprojects.com", active: true },
];

// Standard construction work items with relative weights (sum = 100).
// Weights generalize the meeting's "ceiling cluster ~15%, tile ~1%" notion.
const WORK_TEMPLATE: { name: string; weight: number }[] = [
  { name: "Bricks Layout", weight: 8 },
  { name: "Lintel / False Slab", weight: 10 },
  { name: "Brick Works", weight: 10 },
  { name: "Ceiling Plaster", weight: 15 },
  { name: "Plastering", weight: 12 },
  { name: "Door Frame Setting", weight: 6 },
  { name: "Window Grill Setting", weight: 5 },
  { name: "Washroom Grill Setting", weight: 4 },
  { name: "Electrical Wiring", weight: 12 },
  { name: "Sanitary", weight: 8 },
  { name: "Tiles Work", weight: 6 },
  { name: "Gas Line", weight: 4 },
];

// Small deterministic PRNG (mulberry32) for stable but organic-looking demo data.
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeWorkItems(seed: number, completeness: number): WorkItem[] {
  const rand = rng(seed);
  return WORK_TEMPLATE.map((t, i) => {
    const r = rand();
    let status: WorkStatus = "pending";
    if (r < completeness) status = "complete";
    else if (r < completeness + 0.18) status = "in_progress";
    return { id: `wi-${seed}-${i}`, name: t.name, weight: t.weight, status };
  });
}

let unitCounter = 0;
function makeUnit(floorId: string, name: string, type: Unit["type"], seed: number, completeness: number, sale: Unit["saleStatus"], price?: number, buyer?: string): Unit {
  unitCounter += 1;
  return {
    id: `${floorId}-u${unitCounter}`,
    name,
    type,
    saleStatus: sale,
    salePrice: price,
    buyer,
    workItems: makeWorkItems(seed, completeness),
  };
}

interface FloorSpec {
  name: string;
  code: string;
  units: { name: string; type: Unit["type"]; completeness: number; sale: Unit["saleStatus"]; price?: number; buyer?: string }[];
}

function makeFloors(projectCode: string, specs: FloorSpec[]): Floor[] {
  return specs.map((spec, fi) => {
    const floorId = `${projectCode}-f${fi}`;
    return {
      id: floorId,
      name: spec.name,
      code: spec.code,
      order: fi,
      units: spec.units.map((u, ui) =>
        makeUnit(floorId, u.name, u.type, (fi + 1) * 1000 + ui * 7 + projectCode.length, u.completeness, u.sale, u.price, u.buyer),
      ),
    };
  });
}

const RES_UNITS = (completBase: number): FloorSpec["units"] =>
  ["A", "B", "C", "D", "E", "F"].map((u, i) => ({
    name: `Unit ${u}`,
    type: "residential" as const,
    completeness: Math.max(0, completBase - i * 0.04),
    sale: (i < 2 ? "sold" : i === 2 ? "after_sold" : "available") as Unit["saleStatus"],
    price: i < 3 ? 6800000 + i * 250000 : undefined,
    buyer: i === 0 ? "Rahman Family" : i === 1 ? "K. Ahmed" : undefined,
  }));

// ---- Tarulata 1: the fully fleshed-out flagship project (matches MasterFILE) ----
const tarulata1 = (): Project => {
  unitCounter = 0;
  return {
    id: "p-tarulata-1",
    name: "Tarulata 1",
    code: "001",
    kind: "mixed",
    location: "Uttara, Sector 11",
    managerId: "u-pm",
    startedOn: "2025-01-12",
    floors: makeFloors("001", [
      {
        name: "Ground Floor",
        code: "T1000G",
        units: [
          { name: "Shop 1", type: "commercial", completeness: 0.42, sale: "sold", price: 9200000, buyer: "Meena Bazar" },
          { name: "Shop 2", type: "commercial", completeness: 0.3, sale: "sold", price: 8800000, buyer: "Aarong" },
          { name: "Shop 3", type: "commercial", completeness: 0.2, sale: "available" },
          { name: "Shop 4", type: "commercial", completeness: 0.15, sale: "available" },
        ],
      },
      { name: "1st Floor", code: "T10001", units: RES_UNITS(0.34) },
      { name: "2nd Floor", code: "T10002", units: RES_UNITS(0.24) },
      { name: "3rd Floor", code: "T10003", units: RES_UNITS(0.16) },
      { name: "4th Floor", code: "T10004", units: RES_UNITS(0.08) },
    ]),
    contractors: [
      { id: "c1", name: "Karim Civil Works", scope: "Civil", isPartner: true, contractValue: 42000000, billedPct: 0.5, securityDeposit: 2100000, verifiedProgress: 0.33 },
      { id: "c2", name: "Bright Electric", scope: "Electrical", isPartner: false, contractValue: 9500000, billedPct: 0.28, securityDeposit: 475000, verifiedProgress: 0.26 },
      { id: "c3", name: "AquaFlow Sanitary", scope: "Sanitary", isPartner: false, contractValue: 7200000, billedPct: 0.4, securityDeposit: 360000, verifiedProgress: 0.31 },
      { id: "c4", name: "Deep Foundation Co.", scope: "Piling", isPartner: false, contractValue: 12000000, billedPct: 1.0, securityDeposit: 600000, verifiedProgress: 1.0 },
    ],
  };
};

// ---- Other projects: lighter but realistic, drive the portfolio Command Center ----
interface MiniSpec {
  id: string;
  name: string;
  code: string;
  kind: Project["kind"];
  location: string;
  startedOn: string;
  floorCount: number;
  base: number; // base completeness
  contractors: Omit<Contractor, "id">[];
}

const MINI: MiniSpec[] = [
  { id: "p-tarulata-2", name: "Tarulata 2", code: "002", kind: "residential", location: "Uttara, Sector 11", startedOn: "2025-06-01", floorCount: 4, base: 0.12, contractors: [
    { name: "Karim Civil Works", scope: "Civil", isPartner: true, contractValue: 38000000, billedPct: 0.15, securityDeposit: 1900000, verifiedProgress: 0.1 },
    { name: "Bright Electric", scope: "Electrical", isPartner: false, contractValue: 8800000, billedPct: 0.08, securityDeposit: 440000, verifiedProgress: 0.07 },
  ] },
  { id: "p-azmeer", name: "Azmeer Manzil", code: "003", kind: "residential", location: "Mirpur DOHS", startedOn: "2024-08-15", floorCount: 5, base: 0.5, contractors: [
    { name: "Standard Builders", scope: "Civil", isPartner: false, contractValue: 51000000, billedPct: 0.58, securityDeposit: 2550000, verifiedProgress: 0.5 },
    { name: "Volt Electricals", scope: "Electrical", isPartner: false, contractValue: 10200000, billedPct: 0.5, securityDeposit: 510000, verifiedProgress: 0.48 },
  ] },
  { id: "p-mozaffor", name: "Mozaffor Trade Center", code: "004", kind: "commercial", location: "Motijheel C/A", startedOn: "2024-11-02", floorCount: 6, base: 0.3, contractors: [
    { name: "Apex Construction", scope: "Civil", isPartner: true, contractValue: 88000000, billedPct: 0.42, securityDeposit: 4400000, verifiedProgress: 0.3 },
    { name: "Deep Foundation Co.", scope: "Piling", isPartner: false, contractValue: 22000000, billedPct: 1.0, securityDeposit: 1100000, verifiedProgress: 1.0 },
  ] },
  { id: "p-alam", name: "Alam Villa", code: "005", kind: "residential", location: "Bashundhara R/A", startedOn: "2024-09-20", floorCount: 4, base: 0.5, contractors: [
    { name: "Standard Builders", scope: "Civil", isPartner: false, contractValue: 36000000, billedPct: 0.52, securityDeposit: 1800000, verifiedProgress: 0.5 },
  ] },
  { id: "p-ghosh", name: "Ghosh Palace", code: "006", kind: "mixed", location: "Dhanmondi 27", startedOn: "2024-05-10", floorCount: 6, base: 0.33, contractors: [
    { name: "Apex Construction", scope: "Civil", isPartner: true, contractValue: 64000000, billedPct: 0.5, securityDeposit: 3200000, verifiedProgress: 0.33 },
    { name: "AquaFlow Sanitary", scope: "Sanitary", isPartner: false, contractValue: 9000000, billedPct: 0.45, securityDeposit: 450000, verifiedProgress: 0.3 },
  ] },
  { id: "p-memory", name: "Memory Valley", code: "007", kind: "residential", location: "Savar", startedOn: "2024-10-01", floorCount: 5, base: 0.5, contractors: [
    { name: "Standard Builders", scope: "Civil", isPartner: false, contractValue: 47000000, billedPct: 0.5, securityDeposit: 2350000, verifiedProgress: 0.5 },
  ] },
  { id: "p-hasna", name: "Hasna Valley", code: "008", kind: "residential", location: "Tongi", startedOn: "2024-12-12", floorCount: 4, base: 0.4, contractors: [
    { name: "Karim Civil Works", scope: "Civil", isPartner: true, contractValue: 33000000, billedPct: 0.46, securityDeposit: 1650000, verifiedProgress: 0.4 },
  ] },
  { id: "p-bagan", name: "Bagan Bilash", code: "009", kind: "residential", location: "Gazipur", startedOn: "2024-03-18", floorCount: 5, base: 0.9, contractors: [
    { name: "Apex Construction", scope: "Civil", isPartner: true, contractValue: 55000000, billedPct: 0.9, securityDeposit: 2750000, verifiedProgress: 0.9 },
  ] },
  { id: "p-monir", name: "Monir Tower", code: "010", kind: "commercial", location: "Banani", startedOn: "2025-02-25", floorCount: 7, base: 0.35, contractors: [
    { name: "Apex Construction", scope: "Civil", isPartner: true, contractValue: 96000000, billedPct: 0.48, securityDeposit: 4800000, verifiedProgress: 0.35 },
  ] },
];

function makeMini(spec: MiniSpec): Project {
  unitCounter = 0;
  const floors: FloorSpec[] = [];
  const floorNames = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor", "5th Floor", "6th Floor"];
  for (let i = 0; i < spec.floorCount; i++) {
    const isGround = i === 0;
    const commercial = spec.kind === "commercial" || (spec.kind === "mixed" && isGround);
    const units = commercial
      ? [1, 2, 3, 4].map((n, ui) => ({ name: `Shop ${n}`, type: "commercial" as const, completeness: Math.max(0, spec.base - ui * 0.03), sale: (ui < 2 ? "sold" : "available") as Unit["saleStatus"], price: ui < 2 ? 8500000 : undefined }))
      : RES_UNITS(Math.max(0.04, spec.base - i * 0.05));
    floors.push({ name: floorNames[i], code: `${spec.code}-${i}`, units });
  }
  return {
    id: spec.id,
    name: spec.name,
    code: spec.code,
    kind: spec.kind,
    location: spec.location,
    managerId: "u-pm",
    startedOn: spec.startedOn,
    floors: makeFloors(spec.code, floors),
    contractors: spec.contractors.map((c, i) => ({ ...c, id: `${spec.code}-c${i}` })),
  };
}

export function buildSeedProjects(): Project[] {
  return [tarulata1(), ...MINI.map(makeMini)];
}

export function buildSeedPayments(projects: Project[]): PaymentRequest[] {
  const out: PaymentRequest[] = [];
  let i = 0;
  for (const p of projects) {
    for (const c of p.contractors) {
      if (c.billedPct >= 0.95 || out.length >= 4) continue;
      i += 1;
      out.push({
        id: `pay-${i}`,
        projectId: p.id,
        projectName: p.name,
        contractorId: c.id,
        contractorName: c.name,
        contractorScope: c.scope,
        amount: Math.round(c.contractValue * 0.1),
        contractValue: c.contractValue,
        billedBefore: c.billedPct,
        verifiedAtRequest: c.verifiedProgress,
        note: i % 2 === 0 ? "Next milestone installment" : "Material + labour for current phase",
        status: "pending",
        requestedByName: "Minhaz Uddin Fahim",
        createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
      });
    }
    if (out.length >= 4) break;
  }
  return out;
}

export function buildSeedActivity(): ActivityUpdate[] {
  const now = Date.now();
  const min = 60_000;
  const mk = (i: number, projectId: string, projectName: string, kind: ActivityUpdate["kind"], message: string, agoMin: number, author = "Minhaz Uddin Fahim", authorId = "u-pm"): ActivityUpdate => ({
    id: `act-${i}`,
    projectId,
    projectName,
    authorId,
    authorName: author,
    kind,
    message,
    createdAt: new Date(now - agoMin * min).toISOString(),
  });
  return [
    mk(1, "p-tarulata-1", "Tarulata 1", "progress", "4th floor ceiling cluster ongoing", 22),
    mk(2, "p-tarulata-1", "Tarulata 1", "billing", "Karim Civil Works billed 50% — verified progress 33%", 65, "System", "u-admin"),
    mk(3, "p-ghosh", "Ghosh Palace", "issue", "Gas line leaked on 2nd floor — flagged for inspection", 95),
    mk(4, "p-tarulata-1", "Tarulata 1", "sale", "Unit A (1st floor) sold to Rahman Family", 140, "Nusrat Jahan", "u-sales"),
    mk(5, "p-monir", "Monir Tower", "progress", "3rd floor brick masonry ongoing", 180),
    mk(6, "p-azmeer", "Azmeer Manzil", "progress", "Tiles work completed on 2nd floor Unit B", 240, "Arjun Das", "u-eng"),
    mk(7, "p-mozaffor", "Mozaffor Trade Center", "billing", "Piling contractor fully paid — 100% verified", 320),
    mk(8, "p-bagan", "Bagan Bilash", "progress", "Handover prep — 90% complete", 410),
  ];
}
