import { notFound } from "next/navigation";

import { updatePiece } from "@/lib/actions/pieces";
import { getCollections } from "@/lib/data/collections";
import { getPieceById } from "@/lib/data/pieces";

import { PieceForm } from "../../PieceForm";

export default async function EditPiecePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [piece, collections] = await Promise.all([
    getPieceById(id),
    getCollections(),
  ]);

  if (!piece) {
    notFound();
  }

  return (
    <main>
      <h1>Edit piece: {piece.name}</h1>
      <PieceForm
        action={updatePiece.bind(null, id)}
        collections={collections}
        defaultValues={piece}
        submitLabel="Save changes"
        slugLocked={Boolean(piece.first_published_at)}
      />
    </main>
  );
}
