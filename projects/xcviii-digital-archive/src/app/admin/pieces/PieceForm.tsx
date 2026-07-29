"use client";

import { useActionState } from "react";

import type { PieceFormState } from "@/lib/actions/pieces";
import {
  AUTHENTICITY_STATUSES,
  NFC_STATUSES,
  PIECE_STATUSES,
  PRODUCT_TIERS,
} from "@/lib/validation/pieces";

type Defaults = {
  name?: string;
  collection_id?: string;
  product_tier?: string;
  edition_number?: number;
  edition_total?: number;
  slug?: string;
  base_hat_brand?: string | null;
  base_hat_model?: string | null;
  team?: string | null;
  hat_size?: string | null;
  primary_color?: string | null;
  materials?: string | null;
  craft_technique?: string | null;
  pearl_count?: number | null;
  crystal_count?: number | null;
  build_time_minutes?: number | null;
  completion_date?: string | null;
  public_description?: string | null;
  care_instructions?: string | null;
  main_image_url?: string | null;
  authenticity_status?: string;
  piece_status?: string;
  nfc_status?: string;
  nfc_last_tested_at?: string | null;
  internal_notes?: string | null;
};

/** PRD §12's eight form sections. */
export function PieceForm({
  action,
  collections,
  defaultValues,
  submitLabel,
  slugLocked,
}: {
  action: (
    state: PieceFormState,
    formData: FormData,
  ) => Promise<PieceFormState> | PieceFormState;
  collections: { id: string; name: string }[];
  defaultValues?: Defaults;
  submitLabel: string;
  /** True once the piece has ever been published — see §8.5. */
  slugLocked?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const fieldError = (field: string) => state?.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction}>
      <fieldset>
        <legend>1. Identity</legend>

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
            disabled={slugLocked}
            placeholder={
              slugLocked ? undefined : "Leave blank to auto-generate"
            }
          />
          {slugLocked && <p>Published — this URL is locked (PRD §8.5).</p>}
          {fieldError("slug") && <p role="alert">{fieldError("slug")}</p>}
        </div>
      </fieldset>

      <fieldset>
        <legend>2. Collection and edition</legend>

        <div>
          <label htmlFor="collection_id">Collection</label>
          <select
            id="collection_id"
            name="collection_id"
            defaultValue={defaultValues?.collection_id ?? ""}
            required
          >
            <option value="" disabled>
              Select a collection
            </option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
          {fieldError("collection_id") && (
            <p role="alert">{fieldError("collection_id")}</p>
          )}
        </div>

        <div>
          <label htmlFor="product_tier">Product tier</label>
          <select
            id="product_tier"
            name="product_tier"
            defaultValue={defaultValues?.product_tier ?? "other"}
          >
            {PRODUCT_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {tier}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="edition_number">Edition number</label>
          <input
            id="edition_number"
            name="edition_number"
            type="number"
            min={1}
            defaultValue={defaultValues?.edition_number}
            required
          />
          {fieldError("edition_number") && (
            <p role="alert">{fieldError("edition_number")}</p>
          )}
        </div>

        <div>
          <label htmlFor="edition_total">Edition total</label>
          <input
            id="edition_total"
            name="edition_total"
            type="number"
            min={1}
            defaultValue={defaultValues?.edition_total}
            required
          />
          {fieldError("edition_total") && (
            <p role="alert">{fieldError("edition_total")}</p>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend>3. Hat specifications</legend>

        <div>
          <label htmlFor="base_hat_brand">Base hat brand</label>
          <input
            id="base_hat_brand"
            name="base_hat_brand"
            defaultValue={defaultValues?.base_hat_brand ?? undefined}
          />
        </div>

        <div>
          <label htmlFor="base_hat_model">Base hat model</label>
          <input
            id="base_hat_model"
            name="base_hat_model"
            defaultValue={defaultValues?.base_hat_model ?? undefined}
          />
        </div>

        <div>
          <label htmlFor="team">Team</label>
          <input
            id="team"
            name="team"
            defaultValue={defaultValues?.team ?? undefined}
          />
        </div>

        <div>
          <label htmlFor="hat_size">Hat size</label>
          <input
            id="hat_size"
            name="hat_size"
            defaultValue={defaultValues?.hat_size ?? undefined}
          />
        </div>

        <div>
          <label htmlFor="primary_color">Primary color</label>
          <input
            id="primary_color"
            name="primary_color"
            defaultValue={defaultValues?.primary_color ?? undefined}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>4. Craftsmanship</legend>

        <div>
          <label htmlFor="materials">Materials</label>
          <textarea
            id="materials"
            name="materials"
            defaultValue={defaultValues?.materials ?? undefined}
          />
        </div>

        <div>
          <label htmlFor="craft_technique">Craft technique</label>
          <input
            id="craft_technique"
            name="craft_technique"
            defaultValue={defaultValues?.craft_technique ?? undefined}
          />
        </div>

        <div>
          <label htmlFor="pearl_count">Pearl count</label>
          <input
            id="pearl_count"
            name="pearl_count"
            type="number"
            min={0}
            defaultValue={defaultValues?.pearl_count ?? undefined}
          />
          {fieldError("pearl_count") && (
            <p role="alert">{fieldError("pearl_count")}</p>
          )}
        </div>

        <div>
          <label htmlFor="crystal_count">Crystal count</label>
          <input
            id="crystal_count"
            name="crystal_count"
            type="number"
            min={0}
            defaultValue={defaultValues?.crystal_count ?? undefined}
          />
          {fieldError("crystal_count") && (
            <p role="alert">{fieldError("crystal_count")}</p>
          )}
        </div>

        <div>
          <label htmlFor="build_time_minutes">Build time (minutes)</label>
          <input
            id="build_time_minutes"
            name="build_time_minutes"
            type="number"
            min={0}
            defaultValue={defaultValues?.build_time_minutes ?? undefined}
          />
          {fieldError("build_time_minutes") && (
            <p role="alert">{fieldError("build_time_minutes")}</p>
          )}
        </div>

        <div>
          <label htmlFor="completion_date">Completion date</label>
          <input
            id="completion_date"
            name="completion_date"
            type="date"
            defaultValue={defaultValues?.completion_date ?? undefined}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>5. Public information</legend>

        <div>
          <label htmlFor="public_description">Public description</label>
          <textarea
            id="public_description"
            name="public_description"
            defaultValue={defaultValues?.public_description ?? undefined}
          />
        </div>

        <div>
          <label htmlFor="care_instructions">Care instructions</label>
          <textarea
            id="care_instructions"
            name="care_instructions"
            defaultValue={defaultValues?.care_instructions ?? undefined}
          />
        </div>

        <div>
          <label htmlFor="main_image_file">Main image</label>
          {defaultValues?.main_image_url && (
            // Plain <img>, matching this phase's "structural only" scope
            // (see AGENTS.md's Phase 9 note on next/image).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={defaultValues.main_image_url}
              alt=""
              width={120}
              height={120}
            />
          )}
          <input
            id="main_image_file"
            name="main_image_file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
          />
          {fieldError("main_image_file") && (
            <p role="alert">{fieldError("main_image_file")}</p>
          )}
          {defaultValues?.main_image_url && (
            <label>
              <input type="checkbox" name="remove_main_image" />
              Remove current image
            </label>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend>6. Authenticity and status</legend>

        <div>
          <label htmlFor="authenticity_status">Authenticity status</label>
          <select
            id="authenticity_status"
            name="authenticity_status"
            defaultValue={defaultValues?.authenticity_status ?? "authentic"}
          >
            {AUTHENTICITY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="piece_status">Piece status</label>
          <select
            id="piece_status"
            name="piece_status"
            defaultValue={defaultValues?.piece_status ?? "in_production"}
          >
            {PIECE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend>7. NFC information</legend>

        <div>
          <label htmlFor="nfc_status">NFC status</label>
          <select
            id="nfc_status"
            name="nfc_status"
            defaultValue={defaultValues?.nfc_status ?? "not_assigned"}
          >
            {NFC_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="nfc_last_tested_at">Last tested date</label>
          <input
            id="nfc_last_tested_at"
            name="nfc_last_tested_at"
            type="date"
            defaultValue={defaultValues?.nfc_last_tested_at ?? undefined}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>8. Internal information</legend>

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
