import { logout } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/dal";

export default async function AdminDashboardPage() {
  const { user } = await requireAdmin();

  return (
    <main>
      <h1>Admin dashboard</h1>
      <p>Signed in as {user.email}.</p>
      <form action={logout}>
        <button type="submit">Log out</button>
      </form>
    </main>
  );
}
