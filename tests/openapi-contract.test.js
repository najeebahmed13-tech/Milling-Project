import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "core", "contracts", "openapi.json"), "utf8"));

test("OpenAPI contract is valid and exposes documented module operations", () => {
  assert.equal(contract.openapi, "3.0.3");
  assert.ok(contract.info?.version);
  assert.ok(Object.keys(contract.paths).length >= 10);

  const operationIds = [];
  for (const pathItem of Object.values(contract.paths)) {
    for (const operation of Object.values(pathItem)) {
      if (operation && typeof operation === "object" && operation.operationId) operationIds.push(operation.operationId);
    }
  }
  assert.equal(new Set(operationIds).size, operationIds.length, "operationIds must be unique");
  assert.ok(contract.paths["/api/health"]?.get);
  assert.ok(contract.paths["/api/ffb-receiving"]?.post);
  assert.ok(contract.paths["/api/production-quality/observations"]?.post);
  assert.ok(contract.components?.securitySchemes?.bearerAuth);
});
