import { notFound } from "next/navigation";

import { updateCollection } from "@/lib/actions/collections";
import { getCollectionById } from "@/lib/data/collections";

import { CollectionForm } from "../../CollectionForm";

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await getCollectionById(id);

  if (!collection) {
    notFound();
  }

  return (
    <main>
      <h1>Edit collection: {collection.name}</h1>
      <CollectionForm
        action={updateCollection.bind(null, id)}
        defaultValues={collection}
        submitLabel="Save changes"
      />
    </main>
  );
}
