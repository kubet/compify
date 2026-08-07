import React from "react";
import type * as LegacyManagerApi from "@storybook/manager-api";

type ManagerApi = Pick<typeof LegacyManagerApi, "addons" | "types" | "useParameter" | "useStorybookApi">;
let addons: ManagerApi["addons"];
let types: ManagerApi["types"];
let useParameter: ManagerApi["useParameter"];
let useStorybookApi: ManagerApi["useStorybookApi"];
import { getPortabilityView } from "./model";
import type { CompifyParameters, CompifyPortabilityStatus } from "./types";

export const ADDON_ID = "compify";
export const PANEL_ID = `${ADDON_ID}/portability`;
export const TOOL_ID = `${ADDON_ID}/toolbar`;

const colors: Record<CompifyPortabilityStatus, string> = {
  portable: "#22a06b",
  partial: "#b38600",
  "not-portable": "#d1242f",
  unknown: "#73808c",
};

const sectionStyle: React.CSSProperties = {
  border: "1px solid rgba(128, 128, 128, .28)",
  borderRadius: 8,
  padding: 14,
};
const headingStyle: React.CSSProperties = { fontSize: 12, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: ".04em" };
const codeStyle: React.CSSProperties = { display: "block", overflowX: "auto", padding: "9px 10px", borderRadius: 5, background: "rgba(128, 128, 128, .14)", userSelect: "text" };

function ParameterValue({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ marginTop: 10 }}>
      <strong>{label}</strong>
      {value ? <code style={codeStyle}>{value}</code> : <div style={{ opacity: 0.7, marginTop: 4 }}>Not configured</div>}
    </div>
  );
}

function PortabilityPanel() {
  const parameters = useParameter<CompifyParameters | undefined>("compify", undefined);
  const view = getPortabilityView(parameters);

  return (
    <div style={{ padding: 18, fontFamily: "inherit", lineHeight: 1.45, maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: colors[view.status] }} />
        <h2 style={{ fontSize: 17, margin: 0 }}>{view.label}</h2>
      </div>
      <p style={{ margin: "7px 0 16px", opacity: 0.82 }}>{view.summary}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        <section style={sectionStyle}>
          <h3 style={headingStyle}>Distribution</h3>
          <ParameterValue label="Registry" value={view.registry} />
          <ParameterValue label="Install" value={view.installCommand} />
          <div style={{ marginTop: 10 }}>
            <strong>Preview</strong>
            {!view.previewUrl && <div style={{ opacity: 0.7, marginTop: 4 }}>Not configured</div>}
            {view.previewHref && <div><a href={view.previewHref} target="_blank" rel="noopener noreferrer">Open public preview</a></div>}
            {view.previewUrl && !view.previewHref && <div title="Only public HTTP(S) links can be opened"><code style={codeStyle}>{view.previewUrl}</code></div>}
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={headingStyle}>CLI inspection and publishing</h3>
          <div>Inspect the static story bundle first:</div>
          <code style={codeStyle}>{view.setupCommand}</code>
          <div style={{ marginTop: 10 }}>After review, target and authenticate to a self-hosted current-source API, then publish:</div>
          <code style={codeStyle}>{view.publishCommand}</code>
          <p style={{ marginBottom: 0 }}>{view.publishInstruction}</p>
        </section>
      </div>

      {(view.reasons.length > 0 || view.notes) && (
        <section style={{ ...sectionStyle, marginTop: 12 }}>
          <h3 style={headingStyle}>Author notes</h3>
          {view.reasons.length > 0 && <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>{view.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul>}
          {view.notes && <p style={{ margin: 0 }}>{view.notes}</p>}
        </section>
      )}

      {view.missing.length > 0 && (
        <p style={{ marginTop: 14 }}><strong>Still needed:</strong> {view.missing.join(", ")}. Add these under <code>parameters.compify</code>.</p>
      )}
      <p style={{ opacity: 0.68, fontSize: 12 }}>
        This manager-only addon reads explicit story metadata. It does not inspect source, read credentials, execute commands, upload files, or run a local bridge.
      </p>
    </div>
  );
}

function CompifyTool() {
  const parameters = useParameter<CompifyParameters | undefined>("compify", undefined);
  const view = getPortabilityView(parameters);
  const api = useStorybookApi();
  return (
    <button
      type="button"
      title={`Compify: ${view.label}`}
      aria-label={`Open Compify portability panel: ${view.label}`}
      onClick={() => { api.setSelectedPanel(PANEL_ID); api.togglePanel(true); }}
      style={{ appearance: "none", border: 0, background: "transparent", color: "inherit", height: "100%", padding: "0 9px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: colors[view.status] }} />
      <span>Compify</span>
    </button>
  );
}

export function registerCompifyAddon(managerApi: ManagerApi): void {
  ({ addons, types, useParameter, useStorybookApi } = managerApi);
  addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: "Compify",
    match: ({ viewMode }) => viewMode === "story" || viewMode === "docs",
    render: ({ active }) => active ? <PortabilityPanel /> : null,
  });
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: "Compify portability",
    match: ({ viewMode }) => viewMode === "story" || viewMode === "docs",
    render: () => <CompifyTool />,
  });
});
}
