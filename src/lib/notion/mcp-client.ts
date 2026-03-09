import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

type TextContent = {
  type?: string;
  text?: string;
};

type StructuredToolResult = {
  content?: TextContent[];
  structuredContent?: unknown;
};

export type ToolOutput = {
  text: string;
  structured?: unknown;
};

export async function createNotionClient(serverUrl: string, accessToken: string) {
  const client = new Client(
    {
      name: "exception-os",
      version: "0.1.0",
    },
    {
      capabilities: {
        roots: {},
      },
    }
  );

  const transport = new StreamableHTTPClientTransport(new URL("/mcp", serverUrl), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Exception-OS/0.1.0",
      },
    },
  });

  await client.connect(transport);

  return client;
}

export async function listToolNames(client: Client) {
  const response = await client.listTools();

  return response.tools.map((tool) => tool.name);
}

export const pickToolName = (availableTools: string[], candidates: string[]) =>
  candidates.find((candidate) => availableTools.includes(candidate));

export async function callTool(client: Client, name: string, args: Record<string, unknown>) {
  const result = (await client.callTool({
    name,
    arguments: args,
  })) as StructuredToolResult;

  return normalizeToolOutput(result);
}

export const normalizeToolOutput = (result: StructuredToolResult): ToolOutput => {
  const text = result.content
    ?.filter((item) => item.type === "text" || typeof item.text === "string")
    .map((item) => item.text ?? "")
    .join("\n\n")
    .trim();

  return {
    text: text || (result.structuredContent ? JSON.stringify(result.structuredContent, null, 2) : "No textual content returned."),
    structured: result.structuredContent,
  };
};