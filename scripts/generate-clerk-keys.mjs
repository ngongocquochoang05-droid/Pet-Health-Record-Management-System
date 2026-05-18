// Sinh FE/shared/auth/clerk-keys.js tu bien moi truong khi build/deploy.
//
// Local dev: doc tu .env o root project (file da gitignore).
// Vercel: dat 2 env vars CLERK_PUBLISHABLE_KEY va CLERK_FRONTEND_API_URL
//         trong Project Settings -> Environment Variables. Vercel se chay
//         buildCommand "node scripts/generate-clerk-keys.mjs" theo vercel.json.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const targetPath = resolve(projectRoot, "FE/shared/auth/clerk-keys.js");
const apiConfigPath = resolve(projectRoot, "FE/shared/config/api-config.js");
const envPath = resolve(projectRoot, ".env");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envPath);

const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
const frontendApiUrl = process.env.CLERK_FRONTEND_API_URL;

if (!publishableKey || !frontendApiUrl) {
  console.error(
    "[generate-clerk-keys] Thieu CLERK_PUBLISHABLE_KEY hoac CLERK_FRONTEND_API_URL.",
  );
  console.error(
    "[generate-clerk-keys] Tao file .env o root tu .env.example va dien key.",
  );
  process.exit(1);
}

const fileContent = `// File auto-generated boi scripts/generate-clerk-keys.mjs.
// Khong sua tay. Dat key tai .env hoac env vars tren server.

window.MyPuppyClerkKeys = {
  publishableKey: ${JSON.stringify(publishableKey)},
  frontendApiUrl: ${JSON.stringify(frontendApiUrl)},
};
`;

mkdirSync(dirname(targetPath), { recursive: true });
writeFileSync(targetPath, fileContent, "utf8");
console.log("[generate-clerk-keys] Da ghi", targetPath);

// API base URL cho frontend admin/staff goi backend.
// Local: mac dinh http://localhost:4000/api/admin va http://localhost:4001/staff.
// Production: set ADMIN_API_BASE va STAFF_API_BASE trong env vars.
const adminApiBase = process.env.ADMIN_API_BASE || "http://localhost:4000/api/admin";
const staffApiBase = process.env.STAFF_API_BASE || "http://localhost:4001/staff";
const apiConfigContent = `// File auto-generated boi scripts/generate-clerk-keys.mjs.
// Khong sua tay. Dat URL backend tai bien moi truong ADMIN_API_BASE va STAFF_API_BASE.

window.MyPuppyAdminApiBase = ${JSON.stringify(adminApiBase)};
window.MyPuppyStaffApiBase = ${JSON.stringify(staffApiBase)};
`;

mkdirSync(dirname(apiConfigPath), { recursive: true });
writeFileSync(apiConfigPath, apiConfigContent, "utf8");
console.log("[generate-clerk-keys] Da ghi", apiConfigPath);
