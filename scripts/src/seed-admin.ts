import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin";

  if (process.env.NODE_ENV === "production" && (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD)) {
    console.error("ERROR: In production, ADMIN_USERNAME and ADMIN_PASSWORD must be set explicitly.");
    console.error("Do not use default credentials in production.");
    process.exit(1);
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    console.log("Admin user already exists, skipping seed.");
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  await db.insert(usersTable).values({ username, passwordHash: hash });
  console.log(`Admin user created: username="${username}"`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log("IMPORTANT: Default password 'admin' was used. Change it after first login!");
  }
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
