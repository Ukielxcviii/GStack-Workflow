import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicCollectionBySlug } from "@/lib/data/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getPublicCollectionBySlug(slug);

  if (!collection) {
    return { title: "Collection not found", robots: { index: false } };
  }

  return {
    title: `${collection.name} — XCVIII Studio`,
    description: collection.story ?? `${collection.name}, XCVIII Studio.`,
    openGraph: {
      title: collection.name,
      description: collection.story ?? undefined,
      ...(collection.cover_image_url
        ? { images: [collection.cover_image_url] }
        : {}),
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getPublicCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  return (
    <main>
      <h1>{collection.name}</h1>

      {collection.release_date && <p>Released {collection.release_date}</p>}

      {collection.story && <p>{collection.story}</p>}

      <h2>Pieces</h2>
      {collection.pieces.length === 0 ? (
        <p>No published pieces yet.</p>
      ) : (
        <ul>
          {collection.pieces.map((piece) => (
            <li key={piece.slug}>
              <Link href={`/pieces/${piece.slug}`}>
                {piece.name} — {piece.edition_number} of {piece.edition_total}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
