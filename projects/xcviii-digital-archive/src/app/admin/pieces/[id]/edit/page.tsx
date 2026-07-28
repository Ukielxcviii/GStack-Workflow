import { requireAdmin } from "@/lib/dal";

export default async function EditPiecePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  return (
    <main>
      <h1>Edit piece: {id}</h1>
      <p>Placeholder — edit-piece form arrives in Phase 5.</p>
    </main>
  );
}
