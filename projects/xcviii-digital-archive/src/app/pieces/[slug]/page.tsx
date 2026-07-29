import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicPieceBySlug } from "@/lib/data/public";

function titleCase(value: string) {
  return value
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const piece = await getPublicPieceBySlug(slug);

  if (!piece) {
    return { title: "Piece not found", robots: { index: false } };
  }

  if (piece.publication_status !== "published") {
    return { title: "Piece unavailable", robots: { index: false } };
  }

  const description =
    piece.public_description ??
    `${piece.name} — edition ${piece.edition_number} of ${piece.edition_total}, XCVIII Studio.`;

  return {
    title: `${piece.name} — XCVIII Studio`,
    description,
    openGraph: {
      title: piece.name,
      description,
      ...(piece.main_image_url ? { images: [piece.main_image_url] } : {}),
    },
  };
}

export default async function PiecePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const piece = await getPublicPieceBySlug(slug);

  if (!piece) {
    notFound();
  }

  if (piece.publication_status !== "published") {
    return (
      <main>
        <h1>XCVIII Studio</h1>
        <p>This record is no longer available.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>XCVIII Studio</h1>

      <section>
        <h2>{piece.name}</h2>
        <p>{piece.piece_id}</p>
      </section>

      <section>
        <h3>Authenticity</h3>
        <p>{titleCase(piece.authenticity_status)}</p>
      </section>

      <section>
        <h3>Collection and edition</h3>
        <p>{piece.collections?.name ?? "—"}</p>
        <p>
          Piece {piece.edition_number} of {piece.edition_total}
        </p>
      </section>

      <section>
        <h3>Hat details</h3>
        <dl>
          <dt>Product tier</dt>
          <dd>{titleCase(piece.product_tier)}</dd>

          {piece.team && (
            <>
              <dt>Team</dt>
              <dd>{piece.team}</dd>
            </>
          )}

          {piece.hat_size && (
            <>
              <dt>Hat size</dt>
              <dd>{piece.hat_size}</dd>
            </>
          )}
        </dl>
      </section>

      {(piece.materials ||
        piece.craft_technique ||
        piece.build_time_minutes) && (
        <section>
          <h3>Craftsmanship</h3>
          <dl>
            {piece.materials && (
              <>
                <dt>Materials</dt>
                <dd>{piece.materials}</dd>
              </>
            )}

            {piece.craft_technique && (
              <>
                <dt>Craft technique</dt>
                <dd>{piece.craft_technique}</dd>
              </>
            )}

            {piece.build_time_minutes && (
              <>
                <dt>Build time</dt>
                <dd>{piece.build_time_minutes} minutes</dd>
              </>
            )}

            {piece.completion_date && (
              <>
                <dt>Completion date</dt>
                <dd>{piece.completion_date}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {piece.public_description && (
        <section>
          <h3>Story</h3>
          <p>{piece.public_description}</p>
        </section>
      )}

      {piece.care_instructions && (
        <section>
          <h3>Care instructions</h3>
          <p>{piece.care_instructions}</p>
        </section>
      )}

      <section>
        <h3>Piece status</h3>
        <p>{titleCase(piece.piece_status)}</p>
      </section>
    </main>
  );
}
