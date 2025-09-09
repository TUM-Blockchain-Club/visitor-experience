import fs from "node:fs";
import path from "node:path";
import { Session } from "@/lib/model/session";
import DashboardClient from "@/components/ui/DashboardClient";

export default async function DashboardPage() {
  const sessionsFile = path.join(process.cwd(), "public", "sessions.json");
  let sessions: Session[] = [];
  try {
    const raw = await fs.promises.readFile(sessionsFile, "utf8");
    sessions = JSON.parse(raw) as Session[];
  } catch {
    sessions = [];
  }

  return <DashboardClient initialSessions={sessions} />;
}
