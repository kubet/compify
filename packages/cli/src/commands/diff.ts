import { existsSync } from "fs"
import { promises as fs } from "fs"
import path from "path"
import { Command } from "commander"
import { diffLines } from "diff"
import kleur from "kleur"
import { ApiClient } from "../utils/api-client"
import { logger } from "../utils/logger"

interface CompifyConfig {
  components: Array<{
    id: string;
    name: string;
  }>;
  version: string;
  componentPath: string;
}

export const diff = new Command()
  .name("diff")
  .description("check for updates against the registry")
  .argument("[componentId]", "the component id to check")
  .option("-c, --cwd <cwd>", "the working directory", process.cwd())
  .action(async (componentId, opts) => {
    try {
      const cwd = path.resolve(opts.cwd)
      
      if (!existsSync(cwd)) {
        logger.error(`The path ${cwd} does not exist. Please try again.`)
        process.exit(1)
      }

      // Load compify.json
      const configPath = path.join(cwd, 'compify.json')
      if (!existsSync(configPath)) {
        logger.error("No compify.json found. Please run add command first.")
        process.exit(1)
      }

      const config: CompifyConfig = JSON.parse(await fs.readFile(configPath, 'utf8'))
      const { components, componentPath } = config
      const componentDir = path.join(cwd, componentPath)

      const apiClient = ApiClient.getInstance()

      // If no specific component provided, check all components
      if (!componentId) {
        logger.info("Checking all components for updates...")
        const componentsWithUpdates = []

        for (const component of components) {
          const changes = await diffComponent(component.id, component.name, componentDir, apiClient)
          if (changes.length) {
            componentsWithUpdates.push({ id: component.id, name: component.name, changes })
          }
        }

        if (!componentsWithUpdates.length) {
          logger.info("No updates found.")
          process.exit(0)
        }

        logger.info("The following components have updates available:")
        for (const component of componentsWithUpdates) {
          logger.info(`- ${component.name} ${kleur.dim(`(${component.id})`)}`)
          for (const change of component.changes) {
            logger.info(`  - ${change.filePath}`)
          }
        }
        logger.info("\nRun 'compify diff <component-id>' to see the changes.")
        process.exit(0)
      }

      // Check specific component
      const targetComponent = components.find(c => c.id === componentId)
      if (!targetComponent) {
        logger.error(`Component with ID ${componentId} is not installed.`)
        process.exit(1)
      }

      const changes = await diffComponent(targetComponent.id, targetComponent.name, componentDir, apiClient)
      
      if (!changes.length) {
        logger.info(`No updates found for ${targetComponent.name} ${kleur.dim(`(${targetComponent.id})`)}`)
        process.exit(0)
      }

      logger.info(`\nChecking ${targetComponent.name} ${kleur.dim(`(${targetComponent.id})`)} for updates...`)
      for (const change of changes) {
        logger.info(`\nChanges in ${change.filePath}:`)
        printDiff(change.patch)
      }

    } catch (error) {
      logger.error("Error:", error instanceof Error ? error.message : "Unknown error")
      process.exit(1)
    }
  })

async function diffComponent(componentId: string, componentName: string, componentDir: string, apiClient: ApiClient) {
  try {
    const registryComponent = await apiClient.getComponent(componentId)
    const changes = []

    // Try both flat and folder structures
    const flatDir = componentDir
    const folderDir = path.join(componentDir, componentName)

    for (const [filename, registryContent] of Object.entries(registryComponent.files)) {
      // Check both flat and folder structure paths
      const flatPath = path.join(flatDir, filename)
      const folderPath = path.join(folderDir, filename)
      let localContent: string | null = null
      let actualPath: string | null = null

      if (existsSync(folderPath)) {
        localContent = await fs.readFile(folderPath, 'utf8')
        actualPath = folderPath
      } else if (existsSync(flatPath)) {
        localContent = await fs.readFile(flatPath, 'utf8')
        actualPath = flatPath
      }

      if (localContent && actualPath) {
        const patch = diffLines(registryContent, localContent)
        if (patch.some(part => part.added || part.removed)) {
          changes.push({
            filePath: path.relative(componentDir, actualPath),
            patch
          })
        }
      }
    }

    return changes
  } catch (error) {
    logger.error(`Failed to diff ${componentName}:`, error instanceof Error ? error.message : "Unknown error")
    return []
  }
}

function printDiff(diff: any[]) {
  for (const part of diff) {
    const color = part.added ? '\x1b[32m' : part.removed ? '\x1b[31m' : '\x1b[0m'
    const prefix = part.added ? '+' : part.removed ? '-' : ' '
    process.stdout.write(color)
    process.stdout.write(prefix + part.value)
    process.stdout.write('\x1b[0m')
  }
}
