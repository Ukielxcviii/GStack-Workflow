import Link from "next/link";

import { requireAdmin } from "@/lib/dal";
import { getRecentScans } from "@/lib/data/scans";

export default async function AdminScansPage() {
  await requireAdmin();
  const scans = await getRecentScans();

  return (
    <main>
      <h1>Scan activity</h1>

      {scans.length === 0 ? (
        <p>No scans recorded yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Piece</th>
              <th>Referrer</th>
              <th>Device</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan, index) => (
              <tr key={index}>
                <td>{scan.scanned_at}</td>
                <td>
                  {scan.pieces ? (
                    <Link href={`/pieces/${scan.pieces.slug}`}>
                      {scan.pieces.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{scan.referrer ?? "—"}</td>
                <td>{scan.device_category ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
