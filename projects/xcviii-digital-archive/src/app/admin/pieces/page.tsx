import { requireAdmin } from "@/lib/dal";

export default async function AdminPiecesPage() {
  await requireAdmin();

  return (
    <main>
      <h1>Pieces</h1>
      <p>Placeholder — piece list arrives in Phase 5.</p>
    </main>
  );
}
