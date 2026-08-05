import path from "path"
import fs from "fs-extra"
import { Command } from "commander"
import prompts from "prompts"
import { logger } from "../utils/logger"

export const init = new Command()
  .name("init")
  .description("initialize compify in the current project")
  .option("-y, --yes", "use defaults without prompting", false)
  .option("-c, --cwd <cwd>", "the working directory", process.cwd())
  .option("-p, --path <path>", "where component files should live")
  .action(async (opts) => {
    const cwd = path.resolve(opts.cwd)
    const configPath = path.join(cwd, "compify.json")

    if (await fs.pathExists(configPath)) {
      logger.info("compify.json already exists — nothing to do.")
      process.exit(0)
    }

    let componentPath = opts.path || "src/components"
    if (!opts.yes && !opts.path) {
      const response = await prompts({
        type: "text",
        name: "componentPath",
        message: "Where should components be installed?",
        initial: componentPath,
      })
      if (response.componentPath === undefined) {
        logger.error("Init cancelled.")
        process.exit(1)
      }
      componentPath = response.componentPath
    }

    await fs.writeJson(
      configPath,
      { components: [], version: "1.0.0", componentPath },
      { spaces: 2 }
    )
    logger.success(`Created compify.json (componentPath: ${componentPath})`)
    logger.info("Next: compify login, then compify add @user/component")
  })
