import { requireAdmin } from "@/lib/dal";

export default async function NewCollectionPage() {
  await requireAdmin();

  return (
    <main>
      <h1>New collection</h1>
      <p>Placeholder — create-collection form arrives in Phase 4.</p>
    </main>
  );
}
