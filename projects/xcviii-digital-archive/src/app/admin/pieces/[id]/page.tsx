import Link from "next/link";
import { notFound } from "next/navigation";

import { getPieceById } from "@/lib/data/pieces";

export default async function AdminPieceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const piece = await getPieceById(id);

  if (!piece) {
    notFound();
  }

  return (
    <main>
      <h1>{piece.name}</h1>
      <p>
        <Link href={`/admin/pieces/${piece.id}/edit`}>Edit</Link>{" "}
        <Link href={`/pieces/${piece.slug}`}>Preview public page</Link>
      </p>

      <dl>
        <dt>Piece ID</dt>
        <dd>{piece.piece_id}</dd>

        <dt>Slug</dt>
        <dd>{piece.slug}</dd>

        <dt>Collection</dt>
        <dd>{piece.collections?.name ?? "—"}</dd>

        <dt>Edition</dt>
        <dd>
          {piece.edition_number} of {piece.edition_total}
        </dd>

        <dt>Product tier</dt>
        <dd>{piece.product_tier}</dd>

        <dt>Publication status</dt>
        <dd>{piece.publication_status}</dd>

        <dt>Authenticity status</dt>
        <dd>{piece.authenticity_status}</dd>

        <dt>Piece status</dt>
        <dd>{piece.piece_status}</dd>

        <dt>Base hat</dt>
        <dd>
          {piece.base_hat_brand ?? "—"} {piece.base_hat_model ?? ""}
        </dd>

        <dt>Team</dt>
        <dd>{piece.team ?? "—"}</dd>

        <dt>Hat size</dt>
        <dd>{piece.hat_size ?? "—"}</dd>

        <dt>Primary color</dt>
        <dd>{piece.primary_color ?? "—"}</dd>

        <dt>Materials</dt>
        <dd>{piece.materials ?? "—"}</dd>

        <dt>Craft technique</dt>
        <dd>{piece.craft_technique ?? "—"}</dd>

        <dt>Pearl count</dt>
        <dd>{piece.pearl_count ?? "—"}</dd>

        <dt>Crystal count</dt>
        <dd>{piece.crystal_count ?? "—"}</dd>

        <dt>Build time (minutes)</dt>
        <dd>{piece.build_time_minutes ?? "—"}</dd>

        <dt>Completion date</dt>
        <dd>{piece.completion_date ?? "—"}</dd>

        <dt>Public description</dt>
        <dd>{piece.public_description ?? "—"}</dd>

        <dt>Care instructions</dt>
        <dd>{piece.care_instructions ?? "—"}</dd>

        <dt>Internal notes</dt>
        <dd>{piece.internal_notes ?? "—"}</dd>
      </dl>

      <h2>NFC</h2>
      <p>NFC status: {piece.nfc_status}</p>
      <p>Last tested: {piece.nfc_last_tested_at ?? "not yet tested"}</p>
      <p>NFC URL section (permanent link, copy button) arrives in Phase 7.</p>

      <h2>Scans</h2>
      <p>Scan summary arrives in Phase 8.</p>
    </main>
  );
}
