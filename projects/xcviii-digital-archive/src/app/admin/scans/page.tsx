import { requireAdmin } from "@/lib/dal";

export default async function AdminScansPage() {
  await requireAdmin();

  return (
    <main>
      <h1>Scan activity</h1>
      <p>Placeholder — scan-tracking dashboard arrives in Phase 8.</p>
    </main>
  );
}
