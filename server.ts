import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Setup file logging to server.log
const logFilePath = path.join(process.cwd(), "server.log");
fs.writeFileSync(logFilePath, `=== Server log started at ${new Date().toISOString()} ===\n`);
const logStream = fs.createWriteStream(logFilePath, { flags: "a" });
const originalLog = console.log;
const originalError = console.error;
console.log = function (...args) {
  const msg = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : arg).join(" ");
  logStream.write(`[LOG] ${new Date().toISOString()} ${msg}\n`);
  originalLog.apply(console, args);
};
console.error = function (...args) {
  const msg = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : arg).join(" ");
  logStream.write(`[ERR] ${new Date().toISOString()} ${msg}\n`);
  originalError.apply(console, args);
};

const GOOGLE_SCRIPT_REAL_URL = "https://script.google.com/macros/s/AKfycbysmaPGB68EXT-9PSXtk-PuPVZjNWLJhpLb28uLpfKItzo4k453qtA4OFgwMMMnHEE-/exec";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Request logger middleware
  app.use((req, res, next) => {
    console.log(`[Server Request] ${req.method} ${req.url}`);
    next();
  });

  // Middleware for parsing JSON and text bodies
  app.use(express.json());
  app.use(express.text({ type: "text/plain" }));

  // API proxy route for Google Sheets / Google Apps Script
  app.all("/api/gsheet", async (req, res) => {
    try {
      const { method, query, body } = req;
      
      // Build the target URL with query string if any
      const queryString = new URLSearchParams(query as Record<string, string>).toString();
      const targetUrl = queryString ? `${GOOGLE_SCRIPT_REAL_URL}?${queryString}` : GOOGLE_SCRIPT_REAL_URL;

      const fetchOptions: RequestInit = {
        method,
      };

      if (method === "POST" || method === "PUT") {
        fetchOptions.headers = {
          "Content-Type": "text/plain;charset=utf-8"
        };
        // If body is an object, stringify it, otherwise send as is
        fetchOptions.body = typeof body === "object" ? JSON.stringify(body) : body;
      }

      const externalResponse = await fetch(targetUrl, fetchOptions);
      const responseText = await externalResponse.text();
      
      console.log(`[Proxy] Target: ${targetUrl}, Status: ${externalResponse.status}, Preview: ${responseText.substring(0, 500)}`);
      
      // Try to parse as JSON first, otherwise send as raw text
      try {
        const json = JSON.parse(responseText);
        res.status(externalResponse.status).json(json);
      } catch {
        // If response is not valid JSON, send a structured JSON error response
        const isHtmlOrError = externalResponse.status >= 400 || !responseText.trim().startsWith("{") && !responseText.trim().startsWith("[");
        if (isHtmlOrError) {
          res.status(externalResponse.status >= 400 ? externalResponse.status : 502).json({
            status: "error",
            message: `External server returned status ${externalResponse.status} with non-JSON response`,
            preview: responseText.substring(0, 200).replace(/<[^>]*>/g, "") // strip HTML tags for cleaner log/message
          });
        } else {
          res.status(externalResponse.status).send(responseText);
        }
      }
    } catch (error: any) {
      console.error("[Proxy Error] Failed to fetch Google Apps Script:", error);
      res.status(500).json({ status: "error", message: error.message || "Failed to fetch from Google Sheets script" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
