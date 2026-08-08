import fs from "fs";
import path from "path";
import { Command, Option } from "commander";
import { ApiClient } from "../utils/api-client";
import {
  buildStoryBundle,
  explainInclusion,
  publishPayload,
  toRegistryItem,
} from "../utils/storybook";
import { logger } from "../utils/logger";
import { runStorybookHandoff } from "../utils/storybook-handoff";

type CommonOptions = {
  cwd: string;
  name?: string;
  description?: string;
  publishingName?: string;
  visibility: "public" | "private" | "unlisted";
  componentEntry?: string;
  story?: string;
};

function build(entry: string | undefined, opts: CommonOptions) {
  return buildStoryBundle(entry, {
    cwd: opts.cwd,
    name: opts.name,
    description: opts.description,
    publishingName: opts.publishingName,
    visibility: opts.visibility,
    componentEntry: opts.componentEntry,
    story: opts.story,
  });
}
function assertPortable(bundle: ReturnType<typeof build>) {
  const errors = bundle.diagnostics.filter((d) => d.severity === "error");
  const nonPortable = bundle.stories.filter((story) => !story.portable);
  if (errors.length || nonPortable.length) {
    const reasons = errors.map((e) => `${e.code}: ${e.message}`);
    if (nonPortable.length)
      reasons.push(
        `Non-portable stories: ${nonPortable
          .map((story) => story.exportName)
          .join(", ")}`
      );
    throw new Error(reasons.join("; "));
  }
}
function common(command: Command): Command {
  return command
    .argument(
      "[entry]",
      "React CSF story source file (inferred only when exactly one exists)"
    )
    .option("-c, --cwd <cwd>", "working directory", process.cwd())
    .option("--name <name>", "registry component name")
    .option("--description <description>", "component description")
    .option("--publishing-name <name>", "public publishing slug/name")
    .option(
      "--component-entry <path>",
      "component source entry (overrides CSF meta.component inference)"
    )
    .option("--story <export-name>", "select one exact named story export")
    .addOption(
      new Option("--visibility <visibility>", "publish visibility")
        .choices(["public", "private", "unlisted"])
        .default("private")
    );
}

const inspect = common(
  new Command("inspect").description(
    "statically inspect a React CSF2/CSF3 story bundle"
  )
)
  .option("--json", "emit machine-readable JSON", false)
  .option("--explain <path>", "explain why a bundled source path was included")
  .action(
    (
      entry: string | undefined,
      opts: CommonOptions & { json: boolean; explain?: string }
    ) => {
      try {
        const bundle = build(entry, opts);
        const inclusionChain = opts.explain
          ? explainInclusion(bundle, opts.explain)
          : undefined;
        if (opts.explain && inclusionChain === undefined)
          throw new Error(
            `Bundled path is not reachable from ${bundle.entry}: ${opts.explain}`
          );
        const result = {
          entry: bundle.entry,
          packageFiles: Object.keys(bundle.files),
          sourceGraph: bundle.sourceGraph,
          styleContract: bundle.styleContract,
          ...(opts.explain ? { inclusionChain } : {}),
          dependencies: bundle.dependencies,
          stories: bundle.stories,
          provenance: bundle.provenance,
          digest: bundle.digest,
          portable:
            !bundle.diagnostics.some((d) => d.severity === "error") &&
            bundle.stories.every((s) => s.portable),
          diagnostics: bundle.diagnostics,
        };
        if (opts.json)
          process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        else {
          logger.info(`Entry: ${result.entry}`);
          logger.info(
            `Files: ${result.packageFiles.length}; dependencies: ${
              Object.keys(result.dependencies).length
            }; stories: ${result.stories.length}`
          );
          logger.warn(
            `Style contract is incomplete static evidence: ${bundle.styleContract.uses.length} literal use(s), ${bundle.styleContract.bundledDefinitions.length} bundled definition(s); this does not prove runtime availability.`
          );
          for (const story of result.stories)
            logger.info(
              `${story.portable ? "✓" : "!"} ${story.exportName} (${
                story.name
              })`
            );
          if (opts.explain) {
            logger.info(`Inclusion chain for ${opts.explain}:`);
            if (!inclusionChain!.length)
              logger.info(`  ${bundle.entry} (component entry)`);
            for (const edge of inclusionChain!)
              logger.info(
                `  ${edge.from} --${JSON.stringify(edge.specifier)} [${
                  edge.resolutionReason
                }]--> ${edge.to}`
              );
          }
          for (const diagnostic of result.diagnostics)
            (diagnostic.severity === "error" ? logger.error : logger.warn)(
              `${diagnostic.code}: ${diagnostic.message}`
            );
          if (!result.diagnostics.length)
            logger.success("No portability issues found.");
          logger.info(`Digest: ${result.digest}`);
        }
        if (bundle.diagnostics.some((d) => d.severity === "error"))
          process.exitCode = 1;
      } catch (error) {
        logger.error(
          "Storybook inspection failed",
          error instanceof Error ? error.message : String(error)
        );
        process.exitCode = 1;
      }
    }
  );

const exportCommand = common(
  new Command("export").description(
    "export a story bundle as a shadcn registry-item JSON"
  )
)
  .option("-o, --output <file>", "output JSON path")
  .option("--force", "overwrite an existing output file", false)
  .action(
    (
      entry: string | undefined,
      opts: CommonOptions & { output?: string; force: boolean }
    ) => {
      try {
        const bundle = build(entry, opts);
        assertPortable(bundle);
        const output = path.resolve(
          opts.cwd,
          opts.output || `${bundle.name}.registry.json`
        );
        if (fs.existsSync(output) && !opts.force)
          throw new Error(
            `Output already exists: ${output} (use --force to overwrite)`
          );
        fs.mkdirSync(path.dirname(output), { recursive: true });
        fs.writeFileSync(
          output,
          `${JSON.stringify(toRegistryItem(bundle), null, 2)}\n`,
          { flag: opts.force ? "w" : "wx" }
        );
        logger.success(
          `Exported ${path.relative(path.resolve(opts.cwd), output)}`
        );
        for (const diagnostic of bundle.diagnostics)
          logger.warn(`${diagnostic.code}: ${diagnostic.message}`);
      } catch (error) {
        logger.error(
          "Storybook export failed",
          error instanceof Error ? error.message : String(error)
        );
        process.exitCode = 1;
      }
    }
  );

const collect = (value: string, previous: string[]) => [...previous, value];
const handoff = common(
  new Command("handoff").description(
    "export and install into a separate local shadcn consumer with a verifiable receipt"
  )
)
  .requiredOption(
    "--consumer <directory>",
    "separate consumer package root (must contain components.json)"
  )
  .option("-o, --output <file>", "registry-item output path")
  .option("--receipt <file>", "handoff receipt output path")
  .option("--style-contract-output <file>", "incomplete static CSS evidence sidecar path")
  .option(
    "--build-command <executable>",
    "optional consumer build executable (never run through a shell)"
  )
  .option(
    "--build-arg <argument>",
    "argument for --build-command; repeat to add arguments",
    collect,
    []
  )
  .action(
    (
      entry: string | undefined,
      opts: CommonOptions & {
        consumer: string;
        output?: string;
        receipt?: string;
        styleContractOutput?: string;
        buildCommand?: string;
        buildArg: string[];
      }
    ) => {
      try {
        const result = runStorybookHandoff(entry, {
          ...opts,
          buildArgs: opts.buildArg,
        });
        logger.success(`Installed with shadcn@${result.installer.version}`);
        logger.info("Receipt written successfully");
        logger.info(`Receipt digest: ${result.receiptDigest}`);
      } catch (error) {
        logger.error(
          "Storybook handoff failed",
          error instanceof Error ? error.message : String(error)
        );
        process.exitCode = 1;
      }
    }
  );

const publish = common(
  new Command("publish").description(
    "publish a statically bundled Storybook story"
  )
)
  .option("--json", "emit the server response as JSON", false)
  .action(
    async (
      entry: string | undefined,
      opts: CommonOptions & { json: boolean }
    ) => {
      try {
        const bundle = build(entry, opts);
        assertPortable(bundle);
        const response = await ApiClient.getInstance().publishStory(
          publishPayload(bundle)
        );
        if (opts.json)
          process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
        else {
          logger.success(`Published @${response.publishingDomain}`);
          if (response.revision !== undefined)
            logger.info(`Revision: ${response.revision} (${response.digest})`);
          if (response.registryUrl)
            logger.info(`Registry (latest): ${response.registryUrl}`);
          if (response.immutableRegistryUrl)
            logger.info(
              `Registry (immutable): ${response.immutableRegistryUrl}`
            );
          logger.info(`Open: ${response.previewUrl}`);
        }
        for (const diagnostic of bundle.diagnostics)
          logger.warn(`${diagnostic.code}: ${diagnostic.message}`);
      } catch (error) {
        logger.error(
          "Storybook publish failed",
          error instanceof Error ? error.message : String(error)
        );
        process.exitCode = 1;
      }
    }
  );

export const storybook = new Command("storybook")
  .description(
    "inspect, export, hand off, and publish React Storybook CSF source without executing it"
  )
  .addCommand(inspect)
  .addCommand(exportCommand)
  .addCommand(handoff)
  .addCommand(publish);
