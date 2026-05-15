const http = require("http");
const { URL } = require("url");
const { handleAdminRoute } = require("./routes/adminRoutes");

const PORT = Number(process.env.ADMIN_PORT || process.env.PORT || 4000);

function buildCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Role",
  };
}

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...buildCorsHeaders(),
    ...extraHeaders,
  });
  response.end(JSON.stringify(payload, null, 2));
}

function parseJsonRequest(request) {
  return new Promise((resolve, reject) => {
    let rawBody = "";

    request.on("data", (chunk) => {
      rawBody += chunk;

      if (rawBody.length > 1_000_000) {
        reject(Object.assign(new Error("Request body is too large."), { statusCode: 413 }));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!rawBody.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(Object.assign(new Error("Invalid JSON body."), { statusCode: 400 }));
      }
    });

    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  try {
    await handleAdminRoute({
      request,
      response,
      requestUrl,
      sendJson,
      parseJsonRequest,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    sendJson(response, statusCode, {
      success: false,
      message: statusCode === 500 ? "Internal server error." : error.message,
      details: error.details || null,
    });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`MyPuppy admin backend is running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/admin/health`);
  });
}

module.exports = {
  server,
  sendJson,
  parseJsonRequest,
};
