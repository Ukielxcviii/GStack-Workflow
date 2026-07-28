import { createCollection } from "@/lib/actions/collections";
import { requireAdmin } from "@/lib/dal";

import { CollectionForm } from "../CollectionForm";

export default async function NewCollectionPage() {
  await requireAdmin();

  return (
    <main>
      <h1>New collection</h1>
      <CollectionForm
        action={createCollection}
        submitLabel="Create collection"
      />
    </main>
  );
}
