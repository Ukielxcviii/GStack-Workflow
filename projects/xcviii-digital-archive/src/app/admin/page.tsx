import { logout } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/dal";
import { getCollections } from "@/lib/data/collections";
import { getPieceCounts } from "@/lib/data/pieces";

export default async function AdminDashboardPage() {
  const { user } = await requireAdmin();
  const [collections, pieceCounts] = await Promise.all([
    getCollections(),
    getPieceCounts(),
  ]);

  return (
    <main>
      <h1>Admin dashboard</h1>
      <p>Signed in as {user.email}.</p>

      <ul>
        <li>Total collections: {collections.length}</li>
        <li>Total pieces: {pieceCounts.total}</li>
        <li>Published pieces: {pieceCounts.published}</li>
        <li>Draft pieces: {pieceCounts.draft}</li>
      </ul>
      <p>Scan counts arrive with Phase 8, once that data exists.</p>

      <form action={logout}>
        <button type="submit">Log out</button>
      </form>
    </main>
  );
}
