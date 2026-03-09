import { beforeEach, describe, expect, it } from "vitest";
import { seal, unseal } from "./session";

describe("Notion session crypto", () => {
  beforeEach(() => {
    process.env.EXCEPTION_OS_SESSION_SECRET = "test-secret-for-vitest-only";
  });

  it("round-trips a payload", () => {
    const payload = {
      accessToken: "abc",
      refreshToken: "def",
      clientId: "ghi",
    };

    expect(unseal<typeof payload>(seal(payload))).toEqual(payload);
  });

  it("returns null for invalid payloads", () => {
    expect(unseal("broken-value")).toBeNull();
  });
});