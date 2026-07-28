"use client";

import { useState, useTransition } from "react";

import { archiveCollection } from "@/lib/actions/collections";

export function ArchiveButton({ collectionId }: { collectionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await archiveCollection(collectionId, false);

      if (result.status === "requires_confirmation") {
        const confirmed = window.confirm(
          `This collection has ${result.activePieceCount} active piece(s) attached. Archive anyway?`,
        );
        if (!confirmed) return;

        const confirmedResult = await archiveCollection(collectionId, true);
        if (confirmedResult.status === "error") {
          setError(confirmedResult.error);
        }
      } else if (result.status === "error") {
        setError(result.error);
      }
    });
  }

  return (
    <span>
      <button type="button" onClick={handleClick} disabled={isPending}>
        {isPending ? "Archiving…" : "Archive"}
      </button>
      {error && <span role="alert">{error}</span>}
    </span>
  );
}
