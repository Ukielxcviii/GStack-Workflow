export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main>
      <h1>Edit collection: {id}</h1>
      <p>Placeholder — edit-collection form arrives in Phase 4.</p>
    </main>
  );
}
