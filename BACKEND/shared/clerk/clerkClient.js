// Helper goi Clerk Backend API.
// Yeu cau bien moi truong CLERK_SECRET_KEY trong BACKEND/.env.
// Khi user bi khoa, ta goi Clerk de revoke tat ca session cua ho.

const { getEnv } = require("../config/env");

const CLERK_API_BASE = "https://api.clerk.com/v1";

function getSecretKey() {
  const key = getEnv("CLERK_SECRET_KEY", "");
  return key.trim();
}

function isClerkConfigured() {
  return Boolean(getSecretKey());
}

async function clerkFetch(path, options = {}) {
  const secretKey = getSecretKey();
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY chua duoc cau hinh trong BACKEND/.env.");
  }

  const response = await fetch(`${CLERK_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Clerk API ${response.status}: ${text || response.statusText}`);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;

  return response.json();
}

async function listSessionsForUser(userId) {
  const data = await clerkFetch(`/sessions?user_id=${encodeURIComponent(userId)}&status=active`);
  return Array.isArray(data) ? data : data?.data || [];
}

async function revokeSession(sessionId) {
  return clerkFetch(`/sessions/${encodeURIComponent(sessionId)}/revoke`, {
    method: "POST",
  });
}

async function revokeAllSessionsForUser(userId) {
  if (!isClerkConfigured()) {
    return { revoked: 0, skipped: true };
  }

  const sessions = await listSessionsForUser(userId);
  let revoked = 0;
  for (const session of sessions) {
    try {
      await revokeSession(session.id);
      revoked += 1;
    } catch (error) {
      console.warn(`Khong revoke duoc session ${session.id}:`, error.message);
    }
  }
  return { revoked, skipped: false };
}

module.exports = {
  isClerkConfigured,
  revokeAllSessionsForUser,
};
