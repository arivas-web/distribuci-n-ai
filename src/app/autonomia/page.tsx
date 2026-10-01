import type { Metadata } from "next";
import { AutonomyView } from "@/components/autonomy/autonomy-view";
import { getAutonomy } from "@/lib/data";

export const metadata: Metadata = { title: "Autonomía" };

export default function Page() {
  const { actions, rules } = getAutonomy();
  return <AutonomyView actions={actions} rules={rules} />;
}
