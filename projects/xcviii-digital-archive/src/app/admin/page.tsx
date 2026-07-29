import { logout } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/dal";
import { getCollections } from "@/lib/data/collections";
import { getPieceCounts } from "@/lib/data/pieces";
import { getScanTotals } from "@/lib/data/scans";

export default async function AdminDashboardPage() {
  const { user } = await requireAdmin();
  const [collections, pieceCounts, scanTotals] = await Promise.all([
    getCollections(),
    getPieceCounts(),
    getScanTotals(),
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
        <li>Total scans: {scanTotals.total}</li>
        <li>Scans in last 30 days: {scanTotals.last30Days}</li>
      </ul>

      <form action={logout}>
        <button type="submit">Log out</button>
      </form>
    </main>
  );
}
