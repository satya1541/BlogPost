import mysql from "mysql2/promise";
import path from "path";
import fs from "fs";

// Load env file
const envPath = path.resolve("d:/project/BlogPost/.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const parts = trimmed.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim();
        process.env[key] = val;
      }
    }
  });
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not found in env!");
  process.exit(1);
}

async function run() {
  console.log("Connecting to database...");
  const conn = await mysql.createConnection(dbUrl);

  try {
    console.log("Modifying password_hash column to be nullable...");
    await conn.query("ALTER TABLE users MODIFY password_hash varchar(255) NULL;");
    console.log("Success.");
  } catch (err) {
    console.log("Note/Error altering password_hash:", err.message);
  }

  try {
    console.log("Adding age column...");
    await conn.query("ALTER TABLE users ADD COLUMN age int;");
    console.log("Success.");
  } catch (err) {
    console.log("Note/Error adding age:", err.message);
  }

  try {
    console.log("Adding occupation column...");
    await conn.query("ALTER TABLE users ADD COLUMN occupation varchar(255);");
    console.log("Success.");
  } catch (err) {
    console.log("Note/Error adding occupation:", err.message);
  }

  try {
    console.log("Adding onboarding_completed column...");
    await conn.query("ALTER TABLE users ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;");
    console.log("Success.");
  } catch (err) {
    console.log("Note/Error adding onboarding_completed:", err.message);
  }

  await conn.end();
  console.log("Database migration finished successfully!");
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
