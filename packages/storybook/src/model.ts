import type {
  CompifyParameters,
  CompifyPortabilityStatus,
  PortabilityView,
} from "./types";

export const DEFAULT_SETUP_COMMAND =
  "compify storybook inspect <path-to-story> --json";
export const DEFAULT_PUBLISH_COMMAND =
  "COMPIFY_API_URL=https://api.example.com compify storybook publish <path-to-story> --publishing-name <name> --visibility private";
export const DEFAULT_PUBLISH_INSTRUCTION =
  "Review the static inspection (or export) first. The CLI and addon must be built from this repository or available as released packages. Set COMPIFY_API_URL and authenticate against a self-hosted current-source API that includes POST /cli/publish-story; the CLI default API does not currently expose it. This workflow does not claim managed hosted availability.";

const STATUS_COPY: Record<CompifyPortabilityStatus, { label: string; summary: string }> = {
  portable: {
    label: "Portable",
    summary: "The author marked this story ready to distribute as a Compify component.",
  },
  partial: {
    label: "Partially portable",
    summary: "The author marked this story portable with requirements or follow-up work.",
  },
  "not-portable": {
    label: "Not portable",
    summary: "The author marked this story as unsuitable for distribution in its current form.",
  },
  unknown: {
    label: "Not assessed",
    summary: "No explicit portability assessment is configured for this story.",
  },
};

export function safeHttpUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Produces display data solely from author-provided parameters. It performs no
 * network requests and deliberately does not inspect story/component source.
 */
export function getPortabilityView(parameters?: CompifyParameters): PortabilityView {
  const requestedStatus = parameters?.status;
  const status: CompifyPortabilityStatus =
    requestedStatus && requestedStatus in STATUS_COPY ? requestedStatus : "unknown";
  const copy = STATUS_COPY[status];
  const installCommand = parameters?.cli?.installCommand ?? parameters?.installCommand;
  const missing: string[] = [];
  if (!parameters?.status) missing.push("status");
  if (!parameters?.registry) missing.push("registry");
  if (!installCommand) missing.push("install command");
  if (!parameters?.previewUrl) missing.push("preview link");

  return {
    status,
    ...copy,
    registry: parameters?.registry,
    installCommand,
    previewUrl: parameters?.previewUrl,
    previewHref: safeHttpUrl(parameters?.previewUrl),
    reasons: parameters?.reasons ? [...parameters.reasons] : [],
    notes: parameters?.notes,
    setupCommand: parameters?.cli?.setupCommand ?? DEFAULT_SETUP_COMMAND,
    publishInstruction: DEFAULT_PUBLISH_INSTRUCTION,
    publishCommand: parameters?.cli?.publishCommand ?? DEFAULT_PUBLISH_COMMAND,
    configured: Boolean(parameters),
    missing,
  };
}
