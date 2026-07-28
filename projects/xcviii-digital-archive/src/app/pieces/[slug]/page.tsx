export default async function PiecePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main>
      <h1>Piece: {slug}</h1>
      <p>Placeholder — public piece record renders here (Phase 6).</p>
    </main>
  );
}
