import Link from "next/link";

import {
  publishCollection,
  unpublishCollection,
} from "@/lib/actions/collections";
import { getCollections } from "@/lib/data/collections";

import { ArchiveButton } from "./ArchiveButton";

export default async function AdminCollectionsPage() {
  const collections = await getCollections();

  return (
    <main>
      <h1>Collections</h1>
      <p>
        <Link href="/admin/collections/new">New collection</Link>
      </p>

      {collections.length === 0 ? (
        <p>No collections yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Status</th>
              <th>Pieces</th>
              <th>Release date</th>
              <th>Last updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((collection) => (
              <tr key={collection.id}>
                <td>
                  <Link href={`/admin/collections/${collection.id}/edit`}>
                    {collection.name}
                  </Link>
                </td>
                <td>{collection.collection_code}</td>
                <td>{collection.status}</td>
                <td>{collection.pieceCount}</td>
                <td>{collection.release_date ?? "—"}</td>
                <td>{new Date(collection.updated_at).toLocaleDateString()}</td>
                <td>
                  {collection.status === "published" ? (
                    <form
                      action={unpublishCollection}
                      style={{ display: "inline" }}
                    >
                      <input type="hidden" name="id" value={collection.id} />
                      <button type="submit">Unpublish</button>
                    </form>
                  ) : (
                    <form
                      action={publishCollection}
                      style={{ display: "inline" }}
                    >
                      <input type="hidden" name="id" value={collection.id} />
                      <button type="submit">Publish</button>
                    </form>
                  )}{" "}
                  {collection.status !== "archived" && (
                    <ArchiveButton collectionId={collection.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
