export default async function EditPiecePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main>
      <h1>Edit piece: {id}</h1>
      <p>Placeholder — edit-piece form arrives in Phase 5.</p>
    </main>
  );
}
