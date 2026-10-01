import type { Metadata } from "next";
import { ResultsView } from "@/components/results/results-view";
import { getMeta, getResults } from "@/lib/data";

export const metadata: Metadata = { title: "Resultados" };

export default function Page() {
  return <ResultsView results={getResults()} agentStart={getMeta().agentStart} />;
}
