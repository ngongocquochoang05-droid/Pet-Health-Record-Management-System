// Sinh FRONTEND/shared/auth/clerk-keys.js tu bien moi truong khi build/deploy.
// Tren Vercel: dat 2 bien moi truong CLERK_PUBLISHABLE_KEY va CLERK_FRONTEND_API_URL
// trong project settings, sau do dat buildCommand: "node scripts/generate-clerk-keys.mjs".

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const targetPath = resolve(projectRoot, "FRONTEND/shared/auth/clerk-keys.js");

const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
const frontendApiUrl = process.env.CLERK_FRONTEND_API_URL;

if (!publishableKey || !frontendApiUrl) {
  console.error(
    "[generate-clerk-keys] Thieu bien moi truong CLERK_PUBLISHABLE_KEY hoac CLERK_FRONTEND_API_URL.",
  );
  process.exit(1);
}

const safePublishableKey = JSON.stringify(publishableKey);
const safeFrontendApiUrl = JSON.stringify(frontendApiUrl);

const fileContent = `// File auto-generated boi scripts/generate-clerk-keys.mjs.
// Khong sua tay. Dat key tai bien moi truong CLERK_PUBLISHABLE_KEY va CLERK_FRONTEND_API_URL.

window.MyPuppyClerkKeys = {
  publishableKey: ${safePublishableKey},
  frontendApiUrl: ${safeFrontendApiUrl},
};
`;

mkdirSync(dirname(targetPath), { recursive: true });
writeFileSync(targetPath, fileContent, "utf8");

console.log("[generate-clerk-keys] Da ghi", targetPath);
