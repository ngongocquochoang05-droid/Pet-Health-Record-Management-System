// Sinh FRONTEND/shared/auth/clerk-keys.js tu bien moi truong khi build/deploy.
//
// Local dev: doc tu .env.local o root project (file da gitignore).
// Production: dat env vars CLERK_PUBLISHABLE_KEY va CLERK_FRONTEND_API_URL
//             tren server/host (vd: process manager, hosting platform).

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const targetPath = resolve(projectRoot, "FRONTEND/shared/auth/clerk-keys.js");
const envLocalPath = resolve(projectRoot, ".env.local");

function loadEnvLocal(filePath) {
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

loadEnvLocal(envLocalPath);

const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
const frontendApiUrl = process.env.CLERK_FRONTEND_API_URL;

if (!publishableKey || !frontendApiUrl) {
  console.error(
    "[generate-clerk-keys] Thieu CLERK_PUBLISHABLE_KEY hoac CLERK_FRONTEND_API_URL.",
  );
  console.error(
    "[generate-clerk-keys] Tao file .env.local o root tu .env.local.example va dien key.",
  );
  process.exit(1);
}

const fileContent = `// File auto-generated boi scripts/generate-clerk-keys.mjs.
// Khong sua tay. Dat key tai .env.local hoac env vars tren server.

window.MyPuppyClerkKeys = {
  publishableKey: ${JSON.stringify(publishableKey)},
  frontendApiUrl: ${JSON.stringify(frontendApiUrl)},
};
`;

mkdirSync(dirname(targetPath), { recursive: true });
writeFileSync(targetPath, fileContent, "utf8");

console.log("[generate-clerk-keys] Da ghi", targetPath);
