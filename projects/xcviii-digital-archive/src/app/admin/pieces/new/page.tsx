import { createPiece } from "@/lib/actions/pieces";
import { getCollections } from "@/lib/data/collections";
import { requireAdmin } from "@/lib/dal";

import { PieceForm } from "../PieceForm";

export default async function NewPiecePage() {
  await requireAdmin();
  const collections = await getCollections();

  return (
    <main>
      <h1>New piece</h1>
      <PieceForm
        action={createPiece}
        collections={collections}
        submitLabel="Create piece"
      />
    </main>
  );
}
