import { requireAdmin } from "@/lib/dal";

export default async function NewPiecePage() {
  await requireAdmin();

  return (
    <main>
      <h1>New piece</h1>
      <p>Placeholder — create-piece form arrives in Phase 5.</p>
    </main>
  );
}
