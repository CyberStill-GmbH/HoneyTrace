import { describe, expect, it } from "vitest";
import { interpretAnalysis } from "../../src/analysis/interpretation.js";
import { analysisPayload } from "../fixtures.js";

describe("interpretación auditable", () => {
  it("explica el hallazgo, la confianza y la evidencia que lo origina", () => {
    const payload = analysisPayload();
    const interpretation = interpretAnalysis(payload.trace, payload.events);
    expect(interpretation.findings[0]).toEqual(expect.objectContaining({
      stage: "auth-brute-force",
      title: "Fuerza bruta contra autenticación",
      technique: "T1110",
    }));
    expect(interpretation.findings[0]!.evidence_event_ids).toContain(payload.events[1]!.event_id);
    expect(interpretation.confidence_explanation).toContain("cobertura de evidencia");
    expect(interpretation.event_explanations[payload.events[1]!.event_id]).toContain("detectado");
    expect(interpretation.limitation).toContain("No demuestra impacto");
  });

  it("explica IDOR usando actor y objeto objetivo observados", () => {
    const payload = analysisPayload();
    payload.trace.stages = ["users-idor"];
    payload.trace.techniques = ["HT-IDOR"];
    payload.events[0]!.vulnerability = "IDOR";
    payload.events[0]!.metadata = { actor_user_id: "1", target_user_id: 2 };
    expect(interpretAnalysis(payload.trace, payload.events).overview).toContain("usuario 1");
    expect(interpretAnalysis(payload.trace, payload.events).overview).toContain("usuario 2");
  });
});
