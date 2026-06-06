"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const TEAL = "#199e98";
const NAVY = "#284567";
const ALERT = "#c0392b";

/** Horizontal progress-by-project bar. Flat colors, no gradient. */
export function ProgressByProjectChart({ data }: { data: { name: string; value: number; flagged: boolean }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }} barCategoryGap={10}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#4a5a6e", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "#f0f3f7" }}
          formatter={(v: number) => [`${v}%`, "Progress"]}
          contentStyle={{ borderRadius: 10, border: "1px solid #e3e8ef", fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[4, 4, 4, 4]} background={{ fill: "#f0f3f7", radius: 4 } as never}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.flagged ? ALERT : TEAL} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Billing vs verified progress paired bars for a project's contractors. */
export function BillingVsProgressChart({ data }: { data: { name: string; billed: number; verified: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 56)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 0, left: 0 }} barGap={2} barCategoryGap={18}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false} tick={{ fill: "#4a5a6e", fontSize: 12 }} />
        <Tooltip
          cursor={{ fill: "#f0f3f7" }}
          formatter={(v: number, k) => [`${v}%`, k === "billed" ? "Billed" : "Verified progress"]}
          contentStyle={{ borderRadius: 10, border: "1px solid #e3e8ef", fontSize: 12 }}
        />
        <Bar dataKey="billed" fill={ALERT} radius={[3, 3, 3, 3]} barSize={9} />
        <Bar dataKey="verified" fill={NAVY} radius={[3, 3, 3, 3]} barSize={9} />
      </BarChart>
    </ResponsiveContainer>
  );
}
