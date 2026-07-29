import Link from "next/link";

import {
  archivePiece,
  publishPiece,
  unpublishPiece,
} from "@/lib/actions/pieces";
import { getCollections } from "@/lib/data/collections";
import { getPieces } from "@/lib/data/pieces";
import { PIECE_STATUSES, PUBLICATION_STATUSES } from "@/lib/validation/pieces";

export default async function AdminPiecesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    collection?: string;
    publication_status?: string;
    piece_status?: string;
  }>;
}) {
  const params = await searchParams;
  const [pieces, collections] = await Promise.all([
    getPieces({
      query: params.q,
      collectionId: params.collection,
      publicationStatus: params.publication_status,
      pieceStatus: params.piece_status,
    }),
    getCollections(),
  ]);

  return (
    <main>
      <h1>Pieces</h1>
      <p>
        <Link href="/admin/pieces/new">New piece</Link>
      </p>

      {/* Plain GET form — filters live in the URL, no client JS needed. */}
      <form method="GET">
        <label htmlFor="q">Search (name or piece ID)</label>
        <input id="q" name="q" defaultValue={params.q} />
        <label htmlFor="collection">Collection</label>
        <select
          id="collection"
          name="collection"
          defaultValue={params.collection ?? ""}
        >
          <option value="">All collections</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
        <label htmlFor="publication_status">Publication status</label>
        <select
          id="publication_status"
          name="publication_status"
          defaultValue={params.publication_status ?? ""}
        >
          <option value="">All</option>
          {PUBLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <label htmlFor="piece_status">Piece status</label>
        <select
          id="piece_status"
          name="piece_status"
          defaultValue={params.piece_status ?? ""}
        >
          <option value="">All</option>
          {PIECE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button type="submit">Filter</button>{" "}
        <Link href="/admin/pieces">Reset</Link>
      </form>

      {pieces.length === 0 ? (
        <p>No pieces match.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Piece ID</th>
              <th>Name</th>
              <th>Collection</th>
              <th>Edition</th>
              <th>Piece status</th>
              <th>Publication status</th>
              <th>Authenticity</th>
              <th>Total scans</th>
              <th>Last updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pieces.map((piece) => (
              <tr key={piece.id}>
                <td>{piece.piece_id}</td>
                <td>
                  <Link href={`/admin/pieces/${piece.id}`}>{piece.name}</Link>
                </td>
                <td>{piece.collections?.name ?? "—"}</td>
                <td>
                  {piece.edition_number} of {piece.edition_total}
                </td>
                <td>{piece.piece_status}</td>
                <td>{piece.publication_status}</td>
                <td>{piece.authenticity_status}</td>
                <td>{piece.scanCount}</td>
                <td>{new Date(piece.updated_at).toLocaleDateString()}</td>
                <td>
                  {piece.publication_status === "published" ? (
                    <form action={unpublishPiece} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={piece.id} />
                      <button type="submit">Unpublish</button>
                    </form>
                  ) : (
                    <form action={publishPiece} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={piece.id} />
                      <button type="submit">Publish</button>
                    </form>
                  )}{" "}
                  {piece.publication_status !== "archived" && (
                    <form action={archivePiece} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={piece.id} />
                      <button type="submit">Archive</button>
                    </form>
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
