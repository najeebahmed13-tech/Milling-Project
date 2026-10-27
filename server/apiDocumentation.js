import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerUi from "swagger-ui-express";

const root = path.dirname(fileURLToPath(import.meta.url));
const openApiPath = path.join(root, "..", "core", "contracts", "openapi.json");
const openApiDocument = JSON.parse(fs.readFileSync(openApiPath, "utf8"));

export function registerApiDocumentation(app) {
  app.get("/api/openapi.json", (_req, res) => res.json(openApiDocument));
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "ROCKEYE API Documentation",
      explorer: true,
      swaggerOptions: { persistAuthorization: true },
    }),
  );
}

export { openApiDocument };
