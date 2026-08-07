import { Command } from "commander";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getApiUrl, getWebUrl } from "@/src/utils/config";

interface RegistryIndexItem {
  name: string;
  type: string;
  title?: string;
  description?: string;
}

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

function textResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text:
          typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

function errorResult(error: unknown) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: String(error) }],
  };
}

export async function startMcpServer() {
  const server = new McpServer({ name: "compify", version: "0.2.0" });

  server.tool(
    "search_components",
    "Search public compify.app components by name, title or description. Returns component addresses (user/name) usable with get_component.",
    {
      query: z.string().describe("Search text; empty string lists everything"),
    },
    async ({ query }) => {
      try {
        const index = await fetchJson(`${getApiUrl()}/r/registry.json`);
        const q = query.trim().toLowerCase();
        const items = (index.items as RegistryIndexItem[]).filter(
          (item) =>
            !q ||
            item.name.toLowerCase().includes(q) ||
            item.title?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q)
        );
        return textResult(
          items.map((item) => ({
            name: item.name,
            title: item.title,
            description: item.description,
            preview: `${getWebUrl()}/view/@${item.name}`,
          }))
        );
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.tool(
    "get_component",
    "Fetch a compify component's full source files and npm dependencies in shadcn registry-item format. Write the files into the project and install the listed dependencies.",
    {
      name: z
        .string()
        .describe(
          'Component address as "user/name", e.g. "acme/morphing-switch"'
        ),
    },
    async ({ name }) => {
      try {
        const item = await fetchJson(
          `${getApiUrl()}/r/${name.replace(/^@/, "")}.json`
        );
        return textResult(item);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.tool(
    "get_install_commands",
    "Get ready-to-run shell commands for installing a compify component via the shadcn CLI or the compify CLI.",
    { name: z.string().describe('Component address as "user/name"') },
    async ({ name }) => {
      const clean = name.replace(/^@/, "");
      return textResult(
        [
          `# shadcn (no compify account needed):`,
          `bunx shadcn@latest add ${getApiUrl()}/r/${clean}.json`,
          ``,
          `# compify CLI (tracks the component in compify.json):`,
          `compify add @${clean}`,
        ].join("\n")
      );
    }
  );

  await server.connect(new StdioServerTransport());
}

export const mcp = new Command()
  .name("mcp")
  .description(
    "run a Model Context Protocol server over stdio for coding agents"
  )
  .action(async () => {
    await startMcpServer();
  });
