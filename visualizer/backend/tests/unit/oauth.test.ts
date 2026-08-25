import { describe, expect, it } from "vitest";
import { createOAuthState, verifyOAuthState } from "../../src/auth/oauth.js";

describe("OAuth state", () => {
  it("firma y valida un estado vinculado al navegador", () => {
    const state = createOAuthState("/analyses");
    expect(verifyOAuthState(state, state).returnTo).toBe("/analyses");
  });

  it("rechaza estados manipulados o emitidos para otra sesión", () => {
    const state = createOAuthState("/analyses");
    expect(() => verifyOAuthState(`${state}x`, state)).toThrow("INVALID_OAUTH_STATE");
  });
});
