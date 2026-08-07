/** Portability assessment supplied explicitly by the story author. */
export type CompifyPortabilityStatus =
  | "portable"
  | "partial"
  | "not-portable"
  | "unknown";

/** Commands are display-only. The addon never executes them. */
export interface CompifyCliParameters {
  /** Static inspection command to run before export or publish. */
  setupCommand?: string;
  /** Command used to install this published component. */
  installCommand?: string;
  /** Optional project-specific `compify storybook publish` command. */
  publishCommand?: string;
}

/** Metadata read by the manager addon from `parameters.compify`. */
export interface CompifyParameters {
  /** Explicit portability assessment. The addon never inspects the story source to infer it. */
  status?: CompifyPortabilityStatus;
  /** Published component address, for example `@acme/button`. */
  component?: string;
  /** Human-readable registry name or public registry URL. */
  registry?: string;
  /** Ready-to-copy installation command (short form of `cli.installCommand`). */
  installCommand?: string;
  /** Public HTTP(S) preview URL. Other URL schemes are displayed as text only. */
  previewUrl?: string;
  /** Reasons, requirements, or blockers behind the portability status. */
  reasons?: string[];
  /** Additional author-provided guidance. */
  notes?: string;
  /** Optional command overrides. All commands remain display-only. */
  cli?: CompifyCliParameters;
}

/** Convenience shape for typed Storybook parameter objects. */
export interface CompifyStoryParameters {
  compify?: CompifyParameters;
}

export interface PortabilityView {
  status: CompifyPortabilityStatus;
  label: string;
  summary: string;
  registry?: string;
  installCommand?: string;
  previewUrl?: string;
  previewHref?: string;
  reasons: string[];
  notes?: string;
  setupCommand: string;
  publishInstruction: string;
  publishCommand: string;
  configured: boolean;
  missing: string[];
}
