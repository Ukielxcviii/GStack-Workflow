import { requireAdmin } from "@/lib/dal";

export default async function AdminCollectionsPage() {
  await requireAdmin();

  return (
    <main>
      <h1>Collections</h1>
      <p>Placeholder — collection list arrives in Phase 4.</p>
    </main>
  );
}
