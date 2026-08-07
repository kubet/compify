import path from "path"
import fs from "fs-extra"
import { Command } from "commander"
import prompts from "prompts"
import kleur from "kleur"
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

interface MigrationResult {
  componentId: string;
  componentName: string;
  status: 'success' | 'skipped' | 'error';
  message?: string;
  updatedFiles: string[];
}

export const migrate = new Command()
  .name("migrate")
  .description("update installed components to their latest versions")
  .argument("[componentId]", "specific component id to migrate")
  .option("-c, --cwd <cwd>", "the working directory", process.cwd())
  .option("-y, --yes", "skip confirmation prompts", false)
  .option("-s, --silent", "mute output", false)
  .option("-b, --backup", "create backup of files before migrating", true)
  .action(async (componentId: string, opts) => {
    try {
      const cwd = path.resolve(opts.cwd)
      
      // Load compify.json
      const configPath = path.join(cwd, 'compify.json')
      if (!fs.existsSync(configPath)) {
        logger.error("No compify.json found. Please run add command first.")
        process.exit(1)
      }

      const config: CompifyConfig = await fs.readJSON(configPath)
      const { components, componentPath } = config
      const baseComponentDir = path.join(cwd, componentPath)

      // Create backup directory if needed
      const backupDir = path.join(cwd, '.compify-backup')
      if (opts.backup) {
        await fs.ensureDir(backupDir)
      }

      const apiClient = ApiClient.getInstance()
      let componentsToMigrate = components

      // Filter for specific component if provided
      if (componentId) {
        const targetComponent = components.find(c => c.id === componentId)
        if (!targetComponent) {
          logger.error(`Component with ID ${componentId} is not installed.`)
          process.exit(1)
        }
        componentsToMigrate = [targetComponent]
      }

      if (!opts.silent) {
        logger.info(`\nPreparing to migrate ${componentsToMigrate.length} component(s)...`)
      }

      const results: MigrationResult[] = []

      for (const component of componentsToMigrate) {
        try {
          if (!opts.silent) {
            logger.info(`\nChecking ${component.name} ${kleur.dim(`(${component.id})`)}...`)
          }

          // Get latest version from registry
          const registryComponent = await apiClient.getComponent(component.id)
          
          // Try both flat and folder structures
          const flatDir = baseComponentDir
          const folderDir = path.join(baseComponentDir, componentFolderName(component.name))
          const updatedFiles: string[] = []
          let hasChanges = false

          // First, check if we need to migrate
          for (const [filename, registryContent] of Object.entries(registryComponent.files)) {
            const flatPath = safeComponentPath(flatDir, filename)
            const folderPath = safeComponentPath(folderDir, filename)
            let localPath: string | null = null
            let localContent: string | null = null

            if (fs.existsSync(folderPath)) {
              localPath = folderPath
              localContent = await fs.readFile(folderPath, 'utf8')
            } else if (fs.existsSync(flatPath)) {
              localPath = flatPath
              localContent = await fs.readFile(flatPath, 'utf8')
            }

            if (localContent === null || !localPath || localContent !== registryContent) {
              hasChanges = true
              break
            }
          }

          if (!hasChanges) {
            results.push({
              componentId: component.id,
              componentName: component.name,
              status: 'skipped',
              message: 'Already up to date',
              updatedFiles: []
            })
            continue
          }

          // Confirm migration if needed
          if (!opts.yes) {
            const { confirm } = await prompts({
              type: 'confirm',
              name: 'confirm',
              message: `Update ${component.name} to the latest version?`,
              initial: true
            })
            if (!confirm) {
              results.push({
                componentId: component.id,
                componentName: component.name,
                status: 'skipped',
                message: 'Migration cancelled by user',
                updatedFiles: []
              })
              continue
            }
          }

          // Perform the migration
          for (const [filename, registryContent] of Object.entries(registryComponent.files)) {
            const flatPath = safeComponentPath(flatDir, filename)
            const folderPath = safeComponentPath(folderDir, filename)
            let targetPath: string | null = null

            // Determine which path to use
            if (fs.existsSync(folderPath)) {
              targetPath = folderPath
            } else if (fs.existsSync(flatPath)) {
              targetPath = flatPath
            } else if (fs.existsSync(folderDir)) {
              targetPath = folderPath
              await fs.ensureDir(path.dirname(targetPath))
            } else {
              targetPath = flatPath
              await fs.ensureDir(path.dirname(targetPath))
            }

            // Create backup if enabled
            if (opts.backup && fs.existsSync(targetPath)) {
              const backupPath = path.join(
                backupDir,
                component.name,
                `${path.basename(targetPath)}.${Date.now()}.bak`
              )
              await fs.ensureDir(path.dirname(backupPath))
              await fs.copy(targetPath, backupPath)
            }

            // Update the file
            await fs.writeFile(targetPath, registryContent)
            updatedFiles.push(path.relative(baseComponentDir, targetPath))
          }

          // Update component name if it changed
          if (component.name !== registryComponent.name) {
            const componentIndex = components.findIndex(c => c.id === component.id)
            if (componentIndex !== -1) {
              components[componentIndex].name = registryComponent.name
              await fs.writeJSON(configPath, config, { spaces: 2 })
            }
          }

          results.push({
            componentId: component.id,
            componentName: component.name,
            status: 'success',
            updatedFiles
          })

        } catch (error) {
          results.push({
            componentId: component.id,
            componentName: component.name,
            status: 'error',
            message: error instanceof Error ? error.message : "Unknown error",
            updatedFiles: []
          })

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

      // Print summary
      if (!opts.silent) {
        logger.info("\nMigration Summary:")
        
        const succeeded = results.filter(r => r.status === 'success')
        const skipped = results.filter(r => r.status === 'skipped')
        const failed = results.filter(r => r.status === 'error')

        if (succeeded.length) {
          logger.success(`\n✓ Successfully migrated ${succeeded.length} component(s):`)
          for (const result of succeeded) {
            logger.info(`\n${result.componentName} ${kleur.dim(`(${result.componentId})`)}:`)
            for (const file of result.updatedFiles) {
              logger.info(`  - ${file}`)
            }
          }
        }

        if (skipped.length) {
          logger.warn(`\n⚠ Skipped ${skipped.length} component(s):`)
          for (const result of skipped) {
            logger.info(`  - ${result.componentName} ${kleur.dim(`(${result.componentId})`)}${result.message ? `: ${result.message}` : ''}`)
          }
        }

        if (failed.length) {
          logger.error(`\n✗ Failed to migrate ${failed.length} component(s):`)
          for (const result of failed) {
            logger.error(`  - ${result.componentName} ${kleur.dim(`(${result.componentId})`)}${result.message ? `: ${result.message}` : ''}`)
          }
        }

        if (opts.backup && (succeeded.length || failed.length)) {
          logger.info(`\nBackups saved in: ${kleur.dim(path.relative(cwd, backupDir))}`)
        }
      }

      // Exit with error if any migrations failed
      if (results.some(r => r.status === 'error')) {
        process.exit(1)
      }

    } catch (error) {
      logger.error("Error:", error instanceof Error ? error.message : "Unknown error")
      process.exit(1)
    }
  })
