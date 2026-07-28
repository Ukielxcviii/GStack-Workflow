export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main>
      <h1>Collection: {slug}</h1>
      <p>Placeholder — public collection record renders here (Phase 6).</p>
    </main>
  );
}
