import { LayoutDashboard, Building2, ClipboardCheck, Tag, ShoppingBag, Wallet, Users } from "lucide-react";
import type { Role } from "./data/types";

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Owner",
  project_manager: "Project Manager",
  engineer: "Engineer",
  sales: "Sales Officer",
};

/** Where each role lands on login / role switch. */
export const ROLE_HOME: Record<Role, string> = {
  super_admin: "/command-center",
  project_manager: "/dashboard/pm",
  engineer: "/dashboard/engineer",
  sales: "/dashboard/sales",
};

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

export const NAV: NavItem[] = [
  { href: "/command-center", label: "Command Center", icon: LayoutDashboard, roles: ["super_admin"] },
  { href: "/dashboard/pm", label: "My Dashboard", icon: LayoutDashboard, roles: ["project_manager"] },
  { href: "/dashboard/engineer", label: "Field Tasks", icon: ClipboardCheck, roles: ["engineer"] },
  { href: "/dashboard/sales", label: "Sales Desk", icon: ShoppingBag, roles: ["sales"] },
  { href: "/projects", label: "Projects", icon: Building2, roles: ["super_admin", "project_manager", "engineer"] },
  { href: "/payments", label: "Approvals", icon: Wallet, roles: ["super_admin"] },
  { href: "/inventory", label: "Inventory", icon: Tag, roles: ["super_admin", "sales"] },
  { href: "/team", label: "Team", icon: Users, roles: ["super_admin"] },
];
