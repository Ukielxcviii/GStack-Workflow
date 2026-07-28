"use client";

import { useActionState } from "react";

import type { CollectionFormState } from "@/lib/actions/collections";

type Defaults = {
  name?: string;
  slug?: string;
  collection_code?: string;
  short_description?: string | null;
  story?: string | null;
  release_date?: string | null;
  cover_image_url?: string | null;
  planned_piece_total?: number | null;
  internal_notes?: string | null;
};

export function CollectionForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (
    state: CollectionFormState,
    formData: FormData,
  ) => Promise<CollectionFormState> | CollectionFormState;
  defaultValues?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const fieldError = (field: string) => state?.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction}>
      <fieldset>
        <legend>Collection details</legend>

        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            defaultValue={defaultValues?.name}
            required
          />
          {fieldError("name") && <p role="alert">{fieldError("name")}</p>}
        </div>

        <div>
          <label htmlFor="slug">Slug</label>
          <input
            id="slug"
            name="slug"
            defaultValue={defaultValues?.slug}
            required
          />
          {fieldError("slug") && <p role="alert">{fieldError("slug")}</p>}
        </div>

        <div>
          <label htmlFor="collection_code">Collection code</label>
          <input
            id="collection_code"
            name="collection_code"
            defaultValue={defaultValues?.collection_code}
            required
          />
          {fieldError("collection_code") && (
            <p role="alert">{fieldError("collection_code")}</p>
          )}
        </div>

        <div>
          <label htmlFor="short_description">Short description</label>
          <input
            id="short_description"
            name="short_description"
            defaultValue={defaultValues?.short_description ?? undefined}
          />
        </div>

        <div>
          <label htmlFor="story">Story</label>
          <textarea
            id="story"
            name="story"
            defaultValue={defaultValues?.story ?? undefined}
          />
        </div>

        <div>
          <label htmlFor="release_date">Release date</label>
          <input
            id="release_date"
            name="release_date"
            type="date"
            defaultValue={defaultValues?.release_date ?? undefined}
          />
        </div>

        <div>
          <label htmlFor="cover_image_url">Cover image URL</label>
          <input
            id="cover_image_url"
            name="cover_image_url"
            type="url"
            defaultValue={defaultValues?.cover_image_url ?? undefined}
          />
          {fieldError("cover_image_url") && (
            <p role="alert">{fieldError("cover_image_url")}</p>
          )}
        </div>

        <div>
          <label htmlFor="planned_piece_total">Planned piece total</label>
          <input
            id="planned_piece_total"
            name="planned_piece_total"
            type="number"
            min={0}
            defaultValue={defaultValues?.planned_piece_total ?? undefined}
          />
          {fieldError("planned_piece_total") && (
            <p role="alert">{fieldError("planned_piece_total")}</p>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend>Internal notes</legend>
        <div>
          <label htmlFor="internal_notes">Internal notes</label>
          <textarea
            id="internal_notes"
            name="internal_notes"
            defaultValue={defaultValues?.internal_notes ?? undefined}
          />
        </div>
      </fieldset>

      {state?.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
