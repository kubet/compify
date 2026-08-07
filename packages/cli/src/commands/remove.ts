import path from "path"
import fs from "fs-extra"
import { Command } from "commander"
import prompts from "prompts"
import { ApiClient } from "../utils/api-client"
import { logger } from "../utils/logger"
import { componentFolderName, safeComponentPath } from "../utils/component-path"

interface CompifyConfig {
  components: Array<{
    id: string;
    name: string;
  }>;
  version: string;
  componentPath: string;
}

interface InstalledComponent {
  id: string;
  name: string;
}

export const remove = new Command()
  .name("remove")
  .description("remove components from your project")
  .argument("[components...]", "the components to remove")
  .option("-c, --cwd <cwd>", "the working directory", process.cwd())
  .option("-y, --yes", "skip confirmation prompts", false)
  .option("-s, --silent", "mute output", false)
  .action(async (components: string[], opts) => {
    try {
      const cwd = path.resolve(opts.cwd)
      
      // Load compify.json
      const configPath = path.join(cwd, 'compify.json')
      if (!fs.existsSync(configPath)) {
        logger.error("No compify.json found. Nothing to remove.")
        process.exit(1)
      }

      const config = await fs.readJSON(configPath)
      const { components: installedComponents = [], componentPath } = config
      const baseComponentDir = path.join(cwd, componentPath)

      // If no components specified, show prompt
      if (!components.length) {
        if (!installedComponents.length) {
          logger.info("No components installed.")
          process.exit(0)
        }

        const response = await prompts({
          type: 'multiselect',
          name: 'components',
          message: 'Select components to remove:',
          choices: installedComponents.map((component: InstalledComponent) => ({
            title: `${component.name} (${component.id})`,
            value: component.id
          }))
        })

        if (!response.components?.length) {
          logger.info("No components selected.")
          process.exit(0)
        }

        components = response.components
      }

      // Validate components exist
      const invalidComponents = components.filter(id => 
        !installedComponents.some((c: InstalledComponent) => c.id === id)
      )
      if (invalidComponents.length) {
        logger.error(`Components not found: ${invalidComponents.join(', ')}`)
        process.exit(1)
      }

      // Get component files from registry
      const apiClient = ApiClient.getInstance()
      
      for (const componentId of components) {
        try {
          // Find component in config to get name
          const configComponent = installedComponents.find((c: InstalledComponent) => c.id === componentId)
          if (!configComponent) continue

          if (!opts.silent) {
            logger.info(`\nRemoving ${configComponent.name} (${componentId})...`)
          }

          // Get component files from registry
          const component = await apiClient.getComponent(componentId)
          
          // Try both flat and folder structures
          const flatDir = baseComponentDir
          const folderDir = path.join(baseComponentDir, componentFolderName(component.name))
          let hasRemovedFiles = false

          // Remove only files declared by the registry. Never recursively
          // delete the inferred component folder: it may contain user files.
          for (const filename of Object.keys(component.files)) {
            const folderPath = safeComponentPath(folderDir, filename)
            const flatPath = safeComponentPath(flatDir, filename)
            const filePath = fs.existsSync(folderPath) ? folderPath : flatPath

            if (fs.existsSync(filePath)) {
              if (!opts.yes) {
                const { confirm } = await prompts({
                  type: 'confirm',
                  name: 'confirm',
                  message: `Delete ${filename}?`,
                  initial: true
                })
                if (!confirm) continue
              }

              await fs.remove(filePath)
              if (!opts.silent) {
                logger.success(`Deleted ${filename}`)
              }
              hasRemovedFiles = true
            }
          }

          if (!hasRemovedFiles && !opts.silent) {
            logger.warn(`No files found for ${component.name}`)
          }

          // Remove empty parent directories in flat structure
          const dirs = new Set(Object.keys(component.files).map(file => path.dirname(file)))
          for (const dir of dirs) {
            if (dir !== '.') {
              const dirPath = safeComponentPath(flatDir, dir)
              if (!fs.existsSync(dirPath)) continue
              const files = await fs.readdir(dirPath)
              if (files.length === 0) {
                await fs.remove(dirPath)
                if (!opts.silent) {
                  logger.success(`Removed empty directory ${dir}`)
                }
              }
            }
          }

        } catch (error) {
          logger.error(`Failed to remove ${componentId}:`, error instanceof Error ? error.message : "Unknown error")
          if (!opts.yes) {
            const { continue: shouldContinue } = await prompts({
              type: 'confirm',
              name: 'continue',
              message: 'Would you like to continue with the remaining components?',
              initial: true
            })
            if (!shouldContinue) break
          }
        }
      }

      // Update compify.json
      config.components = installedComponents.filter((c: InstalledComponent) => !components.includes(c.id))
      await fs.writeJSON(configPath, config, { spaces: 2 })

      if (!opts.silent) {
        logger.success(`\nRemoval complete!`)
      }

    } catch (error) {
      logger.error("Error:", error instanceof Error ? error.message : "Unknown error")
      process.exit(1)
    }
  })
