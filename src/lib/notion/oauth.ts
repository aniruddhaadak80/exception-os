import { createHash, randomBytes } from "node:crypto";

export type OAuthMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  code_challenge_methods_supported?: string[];
};

export type ClientCredentials = {
  client_id: string;
  client_secret?: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

type ProtectedResourceMetadata = {
  authorization_servers?: string[];
};

const base64UrlEncode = (value: Buffer) =>
  value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

export const generateCodeVerifier = () => base64UrlEncode(randomBytes(32));

export const generateCodeChallenge = (verifier: string) =>
  base64UrlEncode(createHash("sha256").update(verifier).digest());

export const generateState = () => randomBytes(32).toString("hex");

export async function discoverOAuthMetadata(serverUrl: string): Promise<OAuthMetadata> {
  const protectedResourceUrl = new URL("/.well-known/oauth-protected-resource", serverUrl);
  const protectedResourceResponse = await fetch(protectedResourceUrl, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!protectedResourceResponse.ok) {
    throw new Error(`Protected resource discovery failed with status ${protectedResourceResponse.status}.`);
  }

  const protectedResource = (await protectedResourceResponse.json()) as ProtectedResourceMetadata;
  const authServerUrl = protectedResource.authorization_servers?.[0];

  if (!authServerUrl) {
    throw new Error("No authorization server was returned by Notion MCP discovery.");
  }

  const metadataUrl = new URL("/.well-known/oauth-authorization-server", authServerUrl);
  const metadataResponse = await fetch(metadataUrl, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!metadataResponse.ok) {
    throw new Error(`Authorization metadata discovery failed with status ${metadataResponse.status}.`);
  }

  const metadata = (await metadataResponse.json()) as OAuthMetadata;

  if (!metadata.authorization_endpoint || !metadata.token_endpoint) {
    throw new Error("Notion MCP did not return the required OAuth endpoints.");
  }

  return metadata;
}

export async function registerClient(metadata: OAuthMetadata, redirectUri: string): Promise<ClientCredentials> {
  if (!metadata.registration_endpoint) {
    throw new Error("Notion MCP does not advertise a dynamic registration endpoint.");
  }

  const response = await fetch(metadata.registration_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_name: "Exception OS",
      client_uri: "https://github.com/aniruddhaadak80/exception-os",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
  });

  if (!response.ok) {
    throw new Error(`Dynamic client registration failed with status ${response.status}.`);
  }

  const credentials = (await response.json()) as ClientCredentials;

  if (!credentials.client_id) {
    throw new Error("Dynamic client registration did not return a client_id.");
  }

  return credentials;
}

export function buildAuthorizationUrl(options: {
  metadata: OAuthMetadata;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
}) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    state: options.state,
    code_challenge: options.codeChallenge,
    code_challenge_method: "S256",
    prompt: "consent",
  });

  return `${options.metadata.authorization_endpoint}?${params.toString()}`;
}

export async function exchangeCodeForTokens(options: {
  code: string;
  codeVerifier: string;
  metadata: OAuthMetadata;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: options.code,
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    code_verifier: options.codeVerifier,
  });

  if (options.clientSecret) {
    body.append("client_secret", options.clientSecret);
  }

  const response = await fetch(options.metadata.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${errorBody}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function refreshAccessToken(options: {
  refreshToken: string;
  metadata: OAuthMetadata;
  clientId: string;
  clientSecret?: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: options.refreshToken,
    client_id: options.clientId,
  });

  if (options.clientSecret) {
    body.append("client_secret", options.clientSecret);
  }

  const response = await fetch(options.metadata.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  const text = await response.text();

  if (!response.ok) {
    try {
      const errorPayload = JSON.parse(text) as { error?: string };

      if (errorPayload.error === "invalid_grant") {
        throw new Error("REAUTH_REQUIRED");
      }
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message === "REAUTH_REQUIRED") {
        throw parseError;
      }
    }

    throw new Error(`Token refresh failed: ${response.status} - ${text}`);
  }

  return JSON.parse(text) as TokenResponse;
}