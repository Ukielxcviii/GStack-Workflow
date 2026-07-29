import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — XCVIII Studio",
  description: "What information this site collects when you view a piece.",
};

export default function PrivacyPage() {
  return (
    <main>
      <h1>Privacy</h1>

      <p>
        This notice covers the public pages of the XCVIII Studio Digital Archive
        — the pages you reach by scanning a piece&apos;s NFC tag or opening its
        link directly. It does not cover the administrator dashboard.
      </p>

      <section>
        <h2>What we collect when you view a piece</h2>
        <p>
          Opening a published piece&apos;s page records a scan event so we can
          show basic activity totals to the administrator. That event may
          include:
        </p>
        <ul>
          <li>The time of the visit</li>
          <li>
            The referring page, when your browser provides one (this is usually
            blank for a direct NFC tap)
          </li>
          <li>Your browser&apos;s user agent string</li>
          <li>A general device category (e.g. mobile or desktop)</li>
          <li>An approximate country, when it can be determined</li>
          <li>
            A daily-rotating anonymous identifier, used only to reduce duplicate
            counting
          </li>
        </ul>
      </section>

      <section>
        <h2>What we don&apos;t collect</h2>
        <ul>
          <li>Your precise location (no GPS)</li>
          <li>Your name, email, or any other personal information</li>
          <li>Any owner or collector information</li>
        </ul>
      </section>

      <section>
        <h2>Failures don&apos;t block the page</h2>
        <p>
          If recording a scan fails for any reason, the piece&apos;s page still
          loads normally.
        </p>
      </section>
    </main>
  );
}
