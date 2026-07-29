-- PRD §8.11: "Edition number cannot exceed edition total." The initial schema
-- checked each column independently (> 0) but never their relationship, so
-- edition 99 of 10 was accepted. Table-level CHECK because the rule spans two
-- columns — per the project rule that DB constraints back up app validation.
alter table public.pieces
  add constraint pieces_edition_number_within_total
  check (edition_number <= edition_total);
