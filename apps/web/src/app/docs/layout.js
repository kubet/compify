import { source } from "@/lib/docs-source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { BookOpen, Boxes, Code2, Github, Sparkles } from "lucide-react";
import Link from "next/link";
import "./docs.css";

export default function Layout({ children }) {
  return (
    <div className="docs-shell">
      <link rel="stylesheet" href="/fumadocs.css" />
      <RootProvider theme={{ defaultTheme: "dark", forcedTheme: "dark" }}>
        <DocsLayout
          tree={source.getPageTree()}
          nav={{
            title: (
              <span className="compify-docs-logo">
                Comp<span>i</span>fy <small>Docs</small>
              </span>
            ),
            url: "/docs",
          }}
          links={[
            { text: "Browse", url: "/search", icon: <Boxes /> },
            { text: "Editor", url: "/create", icon: <Sparkles /> },
            {
              text: "API Reference",
              url: "/docs/api-reference",
              icon: <Code2 />,
            },
            {
              text: "GitHub",
              url: "https://github.com/kubet/compify",
              icon: <Github />,
              external: true,
            },
          ]}
          sidebar={{
            banner: (
              <Link className="docs-sidebar-cta" href="/create">
                <BookOpen size={16} /> Build your first component
              </Link>
            ),
          }}
          githubUrl="https://github.com/kubet/compify"
        >
          {children}
        </DocsLayout>
      </RootProvider>
    </div>
  );
}
