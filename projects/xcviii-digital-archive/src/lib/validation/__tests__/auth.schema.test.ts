import { describe, expect, it } from "vitest";

import { loginSchema } from "@/lib/validation/auth";

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "hunter2",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "hunter2",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
