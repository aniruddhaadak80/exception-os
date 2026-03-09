import { describe, expect, it } from "vitest";
import { buildAuthorizationUrl, generateCodeChallenge, generateCodeVerifier, generateState } from "./oauth";

describe("Notion OAuth helpers", () => {
  it("creates a PKCE verifier and matching challenge", () => {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);

    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("creates unique state values", () => {
    expect(generateState()).not.toEqual(generateState());
  });

  it("builds an authorization URL with PKCE parameters", () => {
    const url = buildAuthorizationUrl({
      metadata: {
        issuer: "https://auth.example.com",
        authorization_endpoint: "https://auth.example.com/authorize",
        token_endpoint: "https://auth.example.com/token",
      },
      clientId: "client-123",
      redirectUri: "https://example.com/callback",
      codeChallenge: "challenge-123",
      state: "state-123",
    });

    const parsed = new URL(url);

    expect(parsed.origin).toBe("https://auth.example.com");
    expect(parsed.searchParams.get("client_id")).toBe("client-123");
    expect(parsed.searchParams.get("redirect_uri")).toBe("https://example.com/callback");
    expect(parsed.searchParams.get("code_challenge")).toBe("challenge-123");
    expect(parsed.searchParams.get("state")).toBe("state-123");
  });
});