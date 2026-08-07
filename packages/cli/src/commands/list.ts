import { Command } from "commander"
import { ApiClient } from "../utils/api-client"
import { logger } from "../utils/logger"

interface ListOptions {
  json: boolean
  silent: boolean
}

export const list = new Command()
  .name("list")
  .description("list components available to your account")
  .option("--json", "emit machine-readable JSON", false)
  .option("-s, --silent", "mute human-readable output", false)
  .action(async (opts: ListOptions) => {
    try {
      const components = await ApiClient.getInstance().getComponents()
      if (opts.json) {
        process.stdout.write(`${JSON.stringify(components, null, 2)}\n`)
        return
      }
      if (opts.silent) return
      if (!components.length) {
        logger.info("No components available.")
        return
      }
      for (const component of components) {
        const frameworks = component.usedUiFrameworks?.join(", ") || "no frameworks"
        logger.info(`${component.name} (${component.id}) — ${component.language}, ${frameworks}`)
      }
    } catch (error) {
      logger.error("Error:", error instanceof Error ? error.message : "Unknown error")
      process.exitCode = 1
    }
  })
