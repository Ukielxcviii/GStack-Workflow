import { existsSync, readFileSync, rmSync } from "node:fs";

import { AUTH_FILE, cleanupFixtures, serviceRoleClient } from "./fixtures";

export default async function globalTeardown() {
  const admin = serviceRoleClient();
  await cleanupFixtures(admin);

  if (existsSync(AUTH_FILE)) {
    const { userId } = JSON.parse(readFileSync(AUTH_FILE, "utf8")) as {
      userId: string;
    };
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
    rmSync(AUTH_FILE);
  }
}
