import { Command } from "commander"
import prompts from "prompts"
import { ApiClient } from "../utils/api-client"
import { logger } from "../utils/logger"
import { add } from "./add"

interface ListOptions {
  silent: boolean
}

export const list = new Command()
  .name("list")
  .description("list available components")
  .option("-s, --silent", "mute output", false)
  .action(async (opts: ListOptions) => {
    try {
      const apiClient = ApiClient.getInstance()
      
      if (!opts.silent) {
        logger.info("Fetching available components...")
      }

      const components = await apiClient.getComponents()
      console.log(components)
      if (components.length === 0) {
        logger.info("No components available.")
        return
      }

      const { componentIds } = await prompts({
        type: 'multiselect',
        name: 'componentIds',
        message: 'Select components to install',
        choices: components.map(comp => ({
          title: `${comp.name} (${comp.language}, ${comp.usedUiFrameworks?.join(", ") || "No frameworks"})`,
          value: comp.id,
          description: `ID: ${comp.id}`
        })),
        hint: '- Space to select, Return to submit'
      })

      if (!componentIds || componentIds.length === 0) {
        logger.info("No components selected.")
        return
      }

      // Use the add command to install selected components
      await add.parseAsync([
        process.argv[0],
        process.argv[1],
        ...componentIds
      ])

    } catch (error) {
      if (error instanceof Error && error.message.includes("Authentication required")) {
        logger.error("Authentication required. Please run 'compify login' first.")
      } else {
        logger.error("Error:", error instanceof Error ? error.message : "Unknown error")
      }
      process.exit(1)
    }
  })
