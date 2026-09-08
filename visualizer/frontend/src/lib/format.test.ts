import { describe, expect, it } from "vitest";
import { analysisClassifications, analysisSeverity, eventLabel, severityFrom } from "./format";

describe("clasificación de análisis", () => {
  it.each([
    ["auth-brute-force", "brute-force"],
    ["users-idor", "idor"],
    ["products-sqli", "sqli"],
    ["files-path-traversal", "path-traversal"],
    ["orders-stored-xss", "stored-xss"],
  ] as const)("mapea %s como %s", (stage, expected) => {
    expect(analysisSeverity({ stages: [stage] })).toBe(expected);
  });

  it("también reconoce las etiquetas humanas de los eventos", () => {
    expect(severityFrom("Path Traversal")).toBe("path-traversal");
    expect(severityFrom("Stored XSS mediante Note")).toBe("stored-xss");
  });

  it("conserva todas las etapas de una campaña multivector", () => {
    expect(analysisClassifications({ stages: ["users-idor", "products-sqli", "orders-stored-xss"] })).toEqual(["idor", "sqli", "stored-xss"]);
  });

  it("traduce eventos técnicos a acciones comprensibles", () => {
    expect(eventLabel("SQLI_ATTEMPT")).toBe("Consulta manipulada");
    expect(eventLabel("HTTP_REQUEST")).toBe("Respuesta HTTP");
  });
});
