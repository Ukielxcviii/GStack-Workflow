import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>XCVIII Studio Digital Archive</h1>
      <p>
        Every XCVIII Studio piece has a permanent digital record, reachable by
        scanning its NFC tag or opening its piece page directly.
      </p>
      <p>
        <Link href="/admin/login">Administrator sign in</Link>
      </p>
    </main>
  );
}
