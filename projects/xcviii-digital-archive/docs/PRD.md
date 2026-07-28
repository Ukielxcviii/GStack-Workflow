# XCVIII Studio Digital Archive — Product Requirements Document

## 1. Project Overview

### Product name

XCVIII Studio Digital Archive

### Product type

A web application connected to a database that gives every physical XCVIII Studio hat a unique digital record.

Each hat will contain an NFC tag sewn into the XCVIII Studio brand label. When the tag is scanned with a phone, it will open a unique public webpage containing information about that specific hat.

### Primary goal

Build the functional skeleton of the product before designing the final visual experience.

The first version should allow an authorized administrator to:

1. Create collections.
2. Create individual hat records.
3. Assign each hat a unique public URL.
4. Write that URL to an NFC tag.
5. Update hat information without reprogramming the NFC tag.
6. Display the correct hat information when the NFC tag is scanned.
7. Track basic scan activity.

The NFC tag itself should store only a URL. The hat information should remain in the database so it can be updated later.

---

# 2. Product Vision

Every XCVIII Studio hat should have a permanent digital identity.

The physical hat and its NFC-enabled label will connect to a digital record showing:

- The hat’s name
- Its collection
- Its edition number
- Its authenticity status
- Its materials
- Its completion date
- Its craftsmanship information
- Its unique piece ID
- Its current status

The long-term vision is to create a permanent digital archive of every XCVIII Studio piece.

The initial release should not attempt to build the entire long-term platform. It should establish a reliable foundation that future features can build on.

---

# 3. Current Development Priority

Focus on:

- Application structure
- Database structure
- Authentication
- CRUD functionality
- Unique hat URLs
- NFC-compatible routing
- Public record retrieval
- Basic scan tracking
- Validation
- Security
- Mobile functionality

Do not prioritize:

- Advanced visual design
- Elaborate animation
- Owner profiles
- Resale functionality
- Ownership transfers
- Rewards programs
- Community features
- Collection gamification
- Blockchain
- Complex anti-counterfeit technology
- E-commerce functionality

Use basic, clean interface components for now.

---

# 4. Target Users

## 4.1 Administrator

The administrator is the XCVIII Studio team.

For the first version, assume there is only one administrator.

The administrator must be able to:

- Sign in securely
- Create collections
- Edit collections
- Archive collections
- Create individual hat records
- Edit hat records
- Publish or unpublish hat records
- Assign edition numbers
- View each hat’s public URL
- Copy the NFC URL
- Preview the public page
- View basic scan information

## 4.2 Public visitor

A public visitor is anyone who scans the NFC tag or opens a hat’s URL.

The visitor must be able to:

- Open the page without signing in
- View the hat’s public information
- See whether the piece is authentic
- See the collection name
- See the edition number
- See craftsmanship details
- See the hat’s status

The visitor must not be able to:

- Edit records
- Access the admin dashboard
- View private internal notes
- Access unpublished records
- View sensitive database information

---

# 5. Core User Flow

## 5.1 Administrator creates a collection

1. Administrator signs in.
2. Administrator opens the Collections section.
3. Administrator selects “Create collection.”
4. Administrator enters the collection information.
5. The application saves the collection.
6. The collection becomes available when creating a hat record.

## 5.2 Administrator creates a hat record

1. Administrator opens the Pieces section.
2. Administrator selects “Create piece.”
3. Administrator enters the hat information.
4. Administrator assigns the hat to a collection.
5. Administrator enters the edition number and total edition size.
6. The system generates:
   - A database ID
   - A human-readable piece ID
   - A unique public slug
   - A permanent public URL
7. The administrator reviews the record.
8. The administrator publishes the record.

## 5.3 Administrator programs the NFC tag

1. Administrator opens the hat record.
2. Administrator copies the permanent NFC URL.
3. Administrator writes that URL to the physical NFC tag using an external NFC-writing application.
4. Administrator scans the tag to test it.
5. The tag opens the correct public hat page.

The web application does not need to write directly to NFC hardware in version one.

## 5.4 Visitor scans the hat

1. Visitor holds a compatible phone near the sewn-in NFC label.
2. The phone reads the stored URL.
3. The URL opens in the phone’s browser.
4. The application retrieves the matching hat record.
5. The application records the scan event.
6. The public hat page displays the record.

---

# 6. Recommended Technical Stack

Use the following stack unless a clear technical reason requires a change:

## Front end and server

- Next.js
- TypeScript
- App Router
- Server Components where appropriate
- Tailwind CSS for basic structural styling

## Database and authentication

- Supabase
- PostgreSQL database
- Supabase Auth
- Row Level Security

## Validation

- Zod

## Forms

- React Hook Form

## Deployment

- Vercel for the Next.js application
- Supabase for the database and authentication

## Testing

- Vitest for unit tests
- React Testing Library for component tests
- Playwright for critical end-to-end flows

Keep the architecture simple. Do not introduce a separate Express server unless it becomes necessary.

---

# 7. Application Structure

The application should have two primary areas:

## 7.1 Public Archive

Public-facing routes that display individual hats and collections.

Suggested routes:

```text
/pieces/[slug]
/collections/[slug]
```

Example:

```text
https://xcviii.studio/pieces/pearl-halo-001
```

## 7.2 Admin Dashboard

Protected routes for managing database records.

Suggested routes:

```text
/admin
/admin/login
/admin/pieces
/admin/pieces/new
/admin/pieces/[id]
/admin/pieces/[id]/edit
/admin/collections
/admin/collections/new
/admin/collections/[id]/edit
/admin/scans
```

All `/admin` routes except `/admin/login` must require authentication.

---

# 8. Functional Requirements

## 8.1 Authentication

The system must:

- Allow an administrator to sign in with email and password
- Allow an administrator to sign out
- Protect all admin routes
- Redirect unauthenticated users to the login page
- Prevent public account registration
- Use secure session handling
- Restrict database write operations to authenticated administrators

For version one, create administrator accounts manually through Supabase.

## 8.2 Collection management

The administrator must be able to:

- Create a collection
- View all collections
- Open a collection
- Edit a collection
- Publish or unpublish a collection
- Archive a collection
- View all pieces connected to a collection

Required collection fields:

- Collection ID
- Collection name
- Collection slug
- Short description
- Full story
- Release date
- Status
- Created date
- Updated date

Optional collection fields:

- Internal notes
- Cover image URL
- Total planned pieces

Collection statuses:

- Draft
- Published
- Archived

Deleting collections should not be supported initially. Archiving should be used instead.

A collection cannot be archived without warning the administrator if active pieces are attached to it.

## 8.3 Hat record management

The administrator must be able to:

- Create a hat record
- View all hat records
- Search records
- Filter records
- Edit a record
- Publish or unpublish a record
- Archive a record
- Copy the public URL
- Preview the public page
- View scan totals

Required piece fields:

- Database ID
- Piece ID
- Piece name
- Public slug
- Collection ID
- Edition number
- Edition total
- Authenticity status
- Publication status
- Created date
- Updated date

Recommended piece fields:

- Product tier
- Base hat brand
- Base hat model
- Team
- Hat size
- Primary color
- Materials
- Craft technique
- Number of pearls
- Number of rhinestones or crystals
- Build time in minutes
- Completion date
- Public description
- Care instructions
- Main image URL
- Internal notes
- Current piece status

Product tier values:

- Pearl Halo
- Rhinestone Halo
- Constellation
- Other

Authenticity status values:

- Authentic
- Pending verification
- Revoked

Publication status values:

- Draft
- Published
- Archived

Piece status values:

- In production
- Available
- Collected
- Reserved
- Archived

## 8.4 Piece ID generation

Every hat must receive a permanent human-readable piece ID.

Recommended format:

```text
XCVIII-[COLLECTION CODE]-[YEAR]-[NUMBER]
```

Example:

```text
XCVIII-PH-2026-001
```

Requirements:

- Piece IDs must be unique.
- Piece IDs must never change after creation.
- A database constraint must enforce uniqueness.
- Archived pieces must retain their original piece IDs.
- Piece IDs must not expose sensitive database IDs.

The administrator may enter a collection code when creating a collection.

## 8.5 Slug generation

Every published hat must have a permanent public slug.

Recommended format:

```text
[collection-slug]-[edition-number]
```

Example:

```text
midnight-bloom-012
```

Requirements:

- Slugs must be unique.
- Slugs should be generated automatically.
- The administrator may edit a slug before first publication.
- After publication, changing the slug should require a warning.
- If a published slug changes, the old slug should ideally redirect to the new slug.
- NFC tags must use a stable URL.

For the first version, preventing slug changes after publication is acceptable and simpler than creating redirects.

## 8.6 Public piece page

The public page must retrieve the hat using its slug.

The page must display:

- XCVIII Studio name
- Piece name
- Piece ID
- Collection name
- Edition number and edition total
- Authenticity status
- Product tier
- Team
- Hat size
- Materials
- Craft technique
- Build time
- Completion date
- Public description
- Care instructions
- Main image, when available
- Current piece status

Example edition display:

```text
Piece 12 of 50
```

Example authenticity display:

```text
Verified Authentic
```

The page must:

- Work on mobile devices
- Load without authentication
- Handle missing optional fields gracefully
- Return a proper not-found state for an invalid slug
- Return an unavailable state for unpublished or archived records
- Avoid exposing internal notes
- Avoid exposing raw database IDs
- Record a scan or page-view event

For the skeleton version, use plain sections and basic typography.

## 8.7 Public collection page

The public collection page should display:

- Collection name
- Collection story
- Release date
- Published pieces belonging to that collection

Each piece should link to its public record.

This page is secondary to the individual piece page, but it should be included in the first functional version if it does not delay the core NFC workflow.

## 8.8 Admin pieces table

The pieces dashboard should display:

- Piece ID
- Piece name
- Collection
- Edition number
- Piece status
- Publication status
- Authenticity status
- Total scans
- Last updated date

The administrator should be able to:

- Search by piece name or piece ID
- Filter by collection
- Filter by publication status
- Filter by piece status
- Sort by creation date
- Open a record
- Create a new record

Pagination should be added if the implementation is straightforward. Otherwise, structure the data-fetching layer so pagination can be added later.

## 8.9 NFC URL section

Each admin piece page must contain an NFC section showing:

- Permanent public URL
- Copy URL button
- Open public page button
- NFC status
- Last tested date, if entered
- Instructions stating that only the URL should be written to the NFC tag

NFC status values:

- Not assigned
- Ready to program
- Programmed
- Tested
- Replaced

The administrator should be able to manually update the NFC status.

The system does not need to communicate directly with an NFC reader or writer.

## 8.10 Scan tracking

Every visit to a public piece page should create a scan event or page-view event.

Store:

- Scan event ID
- Piece ID
- Timestamp
- Referrer, when available
- User agent
- Device category, when reasonably detectable
- Country or approximate location only if it can be collected legally and without unnecessary personal data
- A privacy-safe hash or anonymous session identifier, if needed for basic duplicate reduction

Do not store precise GPS location.

The admin record should display:

- Total scans
- Scans in the last 7 days
- Scans in the last 30 days
- Most recent scan date

Perfect bot detection and exact unique-user measurement are not required.

The public page should still load if scan tracking fails.

## 8.11 Data validation

The system must validate:

- Required fields
- Unique piece IDs
- Unique slugs
- Positive edition numbers
- Positive edition totals
- Edition number cannot exceed edition total
- Build time cannot be negative
- Pearl and crystal counts cannot be negative
- Valid dates
- Valid URLs
- Valid status values

Validation should occur:

- In the client form for usability
- On the server for security
- At the database level where appropriate

## 8.12 Error handling

The system must provide clear error states for:

- Failed login
- Unauthorized access
- Failed database query
- Duplicate slug
- Duplicate piece ID
- Missing collection
- Invalid form input
- Invalid public slug
- Unpublished record
- Failed scan-event creation

Errors should be logged without exposing secrets or private data to visitors.

---

# 9. Database Model

Use UUIDs as internal primary keys.

## 9.1 Users

Supabase Auth should manage users.

A separate profile table may be added if required.

Suggested fields:

```text
id: uuid, primary key, references auth.users
role: text
created_at: timestamp
updated_at: timestamp
```

Allowed roles:

```text
admin
```

## 9.2 Collections table

Suggested name:

```text
collections
```

Fields:

```text
id: uuid, primary key
name: text, required
slug: text, required, unique
collection_code: text, required, unique
short_description: text, nullable
story: text, nullable
release_date: date, nullable
cover_image_url: text, nullable
planned_piece_total: integer, nullable
status: text, required, default 'draft'
internal_notes: text, nullable
created_at: timestamp, required
updated_at: timestamp, required
```

## 9.3 Pieces table

Suggested name:

```text
pieces
```

Fields:

```text
id: uuid, primary key
piece_id: text, required, unique
name: text, required
slug: text, required, unique
collection_id: uuid, required, foreign key to collections.id
product_tier: text, required
edition_number: integer, required
edition_total: integer, required
base_hat_brand: text, nullable
base_hat_model: text, nullable
team: text, nullable
hat_size: text, nullable
primary_color: text, nullable
materials: text, nullable
craft_technique: text, nullable
pearl_count: integer, nullable
crystal_count: integer, nullable
build_time_minutes: integer, nullable
completion_date: date, nullable
public_description: text, nullable
care_instructions: text, nullable
main_image_url: text, nullable
authenticity_status: text, required, default 'authentic'
publication_status: text, required, default 'draft'
piece_status: text, required, default 'in_production'
nfc_status: text, required, default 'not_assigned'
nfc_last_tested_at: timestamp, nullable
first_published_at: timestamp, nullable
internal_notes: text, nullable
created_at: timestamp, required
updated_at: timestamp, required
```

Recommended unique constraint:

```text
collection_id + edition_number
```

This prevents two hats in the same collection from receiving the same edition number.

## 9.4 Scan events table

Suggested name:

```text
scan_events
```

Fields:

```text
id: uuid, primary key
piece_id: uuid, required, foreign key to pieces.id
scanned_at: timestamp, required
referrer: text, nullable
user_agent: text, nullable
device_category: text, nullable
country_code: text, nullable
anonymous_identifier: text, nullable
```

Consider automatically deleting or aggregating old raw scan records later if the table becomes large.

## 9.5 Slug redirects table

This table is optional for version one.

Suggested name:

```text
slug_redirects
```

Fields:

```text
id: uuid, primary key
piece_id: uuid, required
old_slug: text, required, unique
new_slug: text, required
created_at: timestamp, required
```

If this table is not implemented, prevent published slugs from being edited.

---

# 10. Database Security

Implement Supabase Row Level Security.

## Public permissions

Public users may:

- Read published collections
- Read published pieces that are not archived
- Create limited scan-event records through a secure server endpoint

Public users may not:

- Read internal notes
- Read drafts
- Read archived records
- Update records
- Delete records
- Read administrator profile data
- Query unrestricted scan-event data

## Administrator permissions

Authenticated administrators may:

- Create records
- Read all records
- Update records
- Archive records
- View scan analytics

Avoid exposing the Supabase service-role key to the browser.

Sensitive operations should occur on the server.

---

# 11. API and Server Actions

Use server actions or route handlers where appropriate.

Suggested operations:

## Collections

```text
createCollection
updateCollection
archiveCollection
getCollections
getCollectionById
getPublicCollectionBySlug
```

## Pieces

```text
createPiece
updatePiece
publishPiece
unpublishPiece
archivePiece
getPieces
getPieceById
getPublicPieceBySlug
generatePieceId
generatePieceSlug
```

## Scans

```text
recordPieceScan
getPieceScanSummary
getRecentScans
```

Server-side authorization must be checked for every admin mutation.

Do not rely only on hiding buttons in the interface.

---

# 12. Admin Dashboard Requirements

## Dashboard home

Display basic counts:

- Total pieces
- Published pieces
- Draft pieces
- Total collections
- Total scans
- Scans during the last 30 days

## Collections screen

Display:

- Name
- Collection code
- Status
- Number of pieces
- Release date
- Last updated

## Pieces screen

Display the searchable and filterable pieces table.

## Piece details screen

Display:

- Full piece information
- Publication status
- Authenticity status
- NFC URL
- NFC status
- Scan summary
- Edit button
- Preview button

## Create and edit forms

Forms should be divided into functional sections:

1. Identity
2. Collection and edition
3. Hat specifications
4. Craftsmanship
5. Public information
6. Authenticity and status
7. NFC information
8. Internal information

Visual polish is not required, but forms must be understandable and usable.

---

# 13. Public Page Requirements

The public piece page should use a simple vertical structure:

```text
Piece identity
Authenticity
Collection and edition
Hat details
Craftsmanship
Story
Care instructions
Piece status
```

The page should include basic metadata for sharing and search engines:

- Page title
- Meta description
- Open Graph title
- Open Graph description
- Open Graph image, when available

Draft and archived pages should not be indexed.

---

# 14. Image Handling

For the initial version:

- Store image URLs in the database.
- Use Supabase Storage for image uploads.
- Support one main image per piece.
- Support one cover image per collection.
- Validate allowed image formats.
- Limit file size.
- Generate unique filenames.
- Restrict uploads to authenticated administrators.

A multi-image gallery can be added later.

The application should continue working when no image has been uploaded.

---

# 15. NFC Technical Requirements

The NFC tag should contain a standard HTTPS URL.

Example:

```text
https://xcviii.studio/pieces/midnight-bloom-012
```

Requirements:

- Do not store all product information directly on the NFC tag.
- Do not store personal owner information on the NFC tag.
- Keep the URL short enough for common NFC tag capacity.
- Use HTTPS.
- Test the tag on both iPhone and Android.
- Test the scan before sewing the NFC label permanently into the hat.
- The physical tag must not be placed directly against material that significantly interferes with NFC performance.
- The application should not depend on a custom mobile app.

The NFC writing process remains external to the web application in version one.

---

# 16. Non-Functional Requirements

## Performance

- Public pages should load quickly on mobile connections.
- Avoid unnecessary JavaScript on public pages.
- Optimize database queries.
- Use server rendering where appropriate.
- Optimize uploaded images.

## Accessibility

- Use semantic HTML.
- Associate labels with form controls.
- Ensure keyboard navigation works.
- Provide meaningful alt text for images.
- Do not communicate authenticity only through color.

## Responsiveness

- Public pages must work on mobile first.
- Admin pages must work on desktop and remain usable on mobile.
- Test common phone screen sizes.

## Reliability

- Updating database information must update the public page without requiring the NFC tag to be rewritten.
- Scan-tracking failures must not prevent the page from loading.
- Published URLs should remain stable.

## Privacy

- Collect only data needed for basic functionality.
- Do not store precise visitor location.
- Do not expose internal notes.
- Do not expose private administrator information.
- Include a basic privacy notice before launching publicly.

---

# 17. Out of Scope for Version One

Do not build the following unless all MVP requirements are complete:

- Customer accounts
- Owner registration
- Ownership transfer
- Resale marketplace
- Owner names on public pages
- Public collector profiles
- Loyalty points
- Rewards
- Drop access
- Email marketing
- Push notifications
- Social features
- Comments
- Direct NFC writing from the browser
- Blockchain verification
- Cryptocurrency
- Shopify integration
- Payment processing
- Inventory management
- Shipping
- Order fulfillment
- Augmented reality
- Dynamic NFC cryptographic verification
- Advanced counterfeit detection

---

# 18. MVP Acceptance Criteria

The MVP is complete when all of the following work:

1. An administrator can sign in.
2. An unauthenticated visitor cannot access admin routes.
3. An administrator can create a collection.
4. An administrator can edit a collection.
5. An administrator can create a piece.
6. Every piece receives a unique piece ID.
7. Every piece receives a unique public slug.
8. Edition numbers cannot be duplicated within the same collection.
9. An administrator can publish a piece.
10. A published piece is available through its public URL.
11. A draft piece is not publicly accessible.
12. The public page displays the correct database information.
13. An administrator can edit a published piece’s information.
14. The public page reflects database updates without changing the NFC URL.
15. An administrator can copy the NFC URL.
16. The URL can be written to a standard NFC tag.
17. Scanning the NFC tag opens the correct page.
18. A scan event is recorded.
19. Scan totals are visible in the admin dashboard.
20. Internal notes never appear publicly.
21. The application works on current iPhone and Android browsers.
22. The application can be deployed successfully.

---

# 19. Testing Requirements

## Unit tests

Test:

- Piece ID generation
- Slug generation
- Edition validation
- Status validation
- Public-data filtering
- Scan-summary calculations

## Integration tests

Test:

- Creating a collection
- Creating a piece
- Publishing a piece
- Retrieving a public piece
- Updating a piece
- Recording a scan
- Preventing unauthorized database writes

## End-to-end tests

Test these critical flows:

### Flow one: Create and publish

1. Sign in.
2. Create a collection.
3. Create a piece.
4. Publish the piece.
5. Open the public URL.
6. Confirm that the correct information appears.

### Flow two: Update without changing NFC URL

1. Open an existing published piece.
2. Change its public description.
3. Save it.
4. Open the same public URL.
5. Confirm that the updated description appears.

### Flow three: Authorization

1. Sign out.
2. Attempt to open an admin route.
3. Confirm redirection to login.
4. Attempt an unauthorized mutation.
5. Confirm rejection.

### Flow four: Invalid scan

1. Open a nonexistent public slug.
2. Confirm that a proper not-found page appears.
3. Confirm that the application does not crash.

---

# 20. Suggested Development Phases

## Phase 1: Project setup

- Create Next.js TypeScript project.
- Configure Tailwind CSS.
- Configure linting and formatting.
- Create Supabase project.
- Add environment-variable validation.
- Connect the application to Supabase.
- Create the initial route structure.

## Phase 2: Database and security

- Create database tables.
- Add enums or database constraints.
- Add foreign keys.
- Add unique constraints.
- Add timestamps.
- Enable Row Level Security.
- Add public read policies.
- Add administrator policies.
- Seed a development administrator.

## Phase 3: Authentication

- Create login page.
- Add login and logout functionality.
- Protect admin routes.
- Add server-side authorization checks.

## Phase 4: Collection management

- Build collections list.
- Build create form.
- Build edit form.
- Add archive behavior.
- Add validation.

## Phase 5: Piece management

- Build pieces list.
- Build create form.
- Generate piece IDs.
- Generate slugs.
- Build edit form.
- Add publishing and archiving.
- Add search and filters.

## Phase 6: Public archive

- Build public piece route.
- Retrieve records by slug.
- Display all public fields.
- Add loading, unavailable and not-found states.
- Build basic public collection route.

## Phase 7: NFC workflow

- Add permanent URL section.
- Add copy button.
- Add NFC status.
- Add test-date field.
- Test URLs with physical NFC tags.

## Phase 8: Scan tracking

- Create secure scan endpoint.
- Record scan events.
- Add scan totals.
- Add recent scan information.
- Ensure tracking failures do not block page loading.

## Phase 9: Images

- Configure Supabase Storage.
- Add image upload.
- Add image validation.
- Display images publicly.

## Phase 10: Testing and deployment

- Add automated tests.
- Test permissions.
- Test mobile behavior.
- Test physical NFC scans.
- Deploy to Vercel.
- Configure production environment variables.
- Confirm production database policies.

---

# 21. Seed Data

Create development seed data containing:

## Collection

```text
Name: First Light
Slug: first-light
Collection code: FL
Short description: The first official XCVIII Studio collection.
Status: Published
```

## Piece

```text
Piece ID: XCVIII-FL-2026-001
Name: Pearl Halo — Navy
Slug: first-light-001
Collection: First Light
Product tier: Pearl Halo
Edition number: 1
Edition total: 25
Base hat brand: New Era
Base hat model: 59FIFTY
Team: New York Yankees
Hat size: 7 1/2
Primary color: Navy
Materials: Faux pearls, thread and authentic New Era fitted hat
Craft technique: Hand stitched
Pearl count: 120
Build time: 300 minutes
Authenticity status: Authentic
Publication status: Published
Piece status: Collected
NFC status: Tested
```

---

# 22. Development Rules for Claude Code

Follow these rules while implementing the project:

1. Build the MVP before adding optional features.
2. Do not focus on visual polish.
3. Use TypeScript strict mode.
4. Avoid using `any`.
5. Validate all environment variables.
6. Validate all incoming form and API data with Zod.
7. Check authorization on the server.
8. Never expose the Supabase service-role key to the client.
9. Use database constraints in addition to application validation.
10. Keep public and private record fields clearly separated.
11. Prefer small, reusable functions.
12. Avoid premature abstraction.
13. Avoid unnecessary dependencies.
14. Do not implement features listed as out of scope.
15. Add loading, empty and error states.
16. Keep the public NFC URL stable.
17. Write tests for business-critical logic.
18. Run type checking, linting and tests after each major phase.
19. Document setup instructions in the README.
20. Update the README when architecture or setup changes.

---

# 23. Required Project Documentation

Create a README containing:

- Project overview
- Technical stack
- Local setup instructions
- Required environment variables
- Supabase setup instructions
- Database migration instructions
- Seed instructions
- Development commands
- Testing commands
- Deployment instructions
- NFC programming instructions
- Known limitations

Create an `.env.example` file with placeholder values only.

Never commit real secrets.

---

# 24. Initial Claude Code Instruction

Use this PRD as the source of truth.

Begin by:

1. Reviewing the requirements.
2. Creating an implementation plan divided into phases.
3. Identifying any technical risks or contradictions.
4. Proposing the project folder structure.
5. Listing the required database migrations.
6. Listing the required environment variables.
7. Creating the Next.js project foundation.
8. Implementing only Phase 1 after presenting the plan.
9. Running validation checks after implementation.
10. Summarizing what was built, what remains and any decisions made.

Do not begin with visual design.

Do not add functionality outside this PRD without explaining why it is necessary.

When a requirement is ambiguous, choose the simplest implementation that preserves future extensibility and record the decision in the README.

---

# Important MVP Note

An ordinary NFC tag confirms that the hat contains a tag programmed with the correct URL, but it does not provide strong counterfeit protection because basic NFC URLs can be copied.

For the MVP, label the public page as an **XCVIII Studio Record** or **Registered Piece** rather than claiming that the NFC scan alone guarantees authenticity.

Stronger tag-level verification can be considered later.
