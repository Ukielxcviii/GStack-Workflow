import { logout } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/dal";
import { getCollections } from "@/lib/data/collections";

export default async function AdminDashboardPage() {
  const { user } = await requireAdmin();
  const collections = await getCollections();

  return (
    <main>
      <h1>Admin dashboard</h1>
      <p>Signed in as {user.email}.</p>

      <ul>
        <li>Total collections: {collections.length}</li>
      </ul>
      <p>
        Piece and scan counts arrive with Phases 5 and 8, once that data exists.
      </p>

      <form action={logout}>
        <button type="submit">Log out</button>
      </form>
    </main>
  );
}
