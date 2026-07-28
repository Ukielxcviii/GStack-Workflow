export default async function AdminPieceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main>
      <h1>Piece detail: {id}</h1>
      <p>Placeholder — piece detail/scan counts arrive in Phase 5/8.</p>
    </main>
  );
}
