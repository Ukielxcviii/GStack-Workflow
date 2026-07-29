"use client";

import { useState } from "react";

type Status = "idle" | "copied" | "error";

export function CopyUrlButton({ url }: { url: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <button type="button" onClick={handleClick}>
      {status === "copied"
        ? "Copied"
        : status === "error"
          ? "Couldn't copy — select and copy manually"
          : "Copy URL"}
    </button>
  );
}
