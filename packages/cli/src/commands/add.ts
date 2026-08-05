import path from "path"
import fs from "fs-extra"
import { Command } from "commander"
import prompts, { PromptObject } from "prompts"
import { ApiClient } from "../utils/api-client"
import { logger } from "../utils/logger"

interface AddOptions {
  components?: string[]
  yes: boolean
  overwrite: boolean
  cwd: string
  all: boolean
  path?: string
  silent: boolean
  srcDir?: boolean
  flat?: boolean
}

interface CompifyConfig {
  components: Array<{
    id: string;
    name: string;
  }>;
  version: string;
  componentPath: string;
}

interface ComponentSetup {
  componentPath: string;
  createFolder: boolean;
  overwrite: boolean;
}

async function promptForComponentSetup(
  cwd: string, 
  defaultPath: string, 
  componentName: string, 
  hasExistingFiles: boolean
): Promise<ComponentSetup> {
  const questions: PromptObject[] = []

  // Only ask about overwriting if files exist
  if (hasExistingFiles) {
    questions.push({
      type: 'confirm',
      name: 'overwrite',
      message: 'Component files already exist. Overwrite?',
      initial: false
    })
  }

  // Ask about folder structure
  questions.push({
    type: 'select',
    name: 'organization',
    message: 'How would you like to organize the files?',
    choices: [
      { 
        title: `Create folder (${componentName})`, 
        description: `Files will be in src/components/${componentName}/`,
        value: 'folder' 
      },
      { 
        title: 'Flat structure', 
        description: 'Files will be directly in src/components/',
        value: 'flat' 
      }
    ],
    initial: 0
  })

  // Ask about custom path only if user hasn't provided it via flags
  questions.push({
    type: 'text',
    name: 'componentPath',
    message: 'Where should this component be installed?',
    initial: defaultPath,
    format: (val: string) => val.trim() || defaultPath
  })

  const response = await prompts(questions, {
    onCancel: () => {
      logger.info("Installation cancelled.")
      process.exit(0)
    }
  })

  return {
    componentPath: path.isAbsolute(response.componentPath) 
      ? path.relative(cwd, response.componentPath)
      : response.componentPath,
    createFolder: response.organization === 'folder',
    overwrite: hasExistingFiles ? response.overwrite : false
  }
}

export const add = new Command()
  .name("add")
  .description("add components to your project")
  .argument("[components...]", "the components to add")
  .option("-y, --yes", "skip confirmation prompts", false)
  .option("-o, --overwrite", "overwrite existing files", false)
  .option("-c, --cwd <cwd>", "the working directory", process.cwd())
  .option("-p, --path <path>", "the path to add components to")
  .option("-s, --silent", "mute output", false)
  .option("-f, --flat", "use flat file structure", false)
  .action(async (components: string[], opts: AddOptions) => {
    try {
      const cwd = path.resolve(opts.cwd)
      const packageJsonPath = path.join(cwd, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        logger.error("Could not find package.json in the current directory. Please make sure you're in your project's root directory and try again.")
        process.exit(1)
      }

      const apiClient = ApiClient.getInstance()

      if (!components.length) {
        logger.error("Please specify component name(s) to add")
        process.exit(1)
      }

      // Load or initialize config
      const configPath = path.join(cwd, 'compify.json')
      let config: CompifyConfig = {
        components: [],
        version: "1.0.0",
        componentPath: "src/components"
      }

      if (fs.existsSync(configPath)) {
        config = await fs.readJSON(configPath)
      }

      // Install each component
      for (const componentId of components) {
        try {
          // First fetch component to get its name and check existence
          const component = await apiClient.getComponent(componentId)
          
          if (!opts.silent) {
            logger.info(`\nPreparing to install ${component.name}...`)
          }

          let componentDir = opts.path 
            ? path.join(cwd, opts.path)
            : path.join(cwd, config.componentPath)

          // Check if any files already exist
          const hasExistingFiles = Object.keys(component.files).some(filename => 
            fs.existsSync(path.join(componentDir, filename)) ||
            fs.existsSync(path.join(componentDir, component.name, filename))
          )

          // If not using flags, ask for setup
          if (!opts.yes) {
            const setup = await promptForComponentSetup(cwd, config.componentPath, component.name, hasExistingFiles)
            config.componentPath = setup.componentPath
            opts.overwrite = hasExistingFiles ? setup.overwrite : false
            componentDir = path.join(cwd, setup.componentPath)

            // Add component name to path if user chose folder structure
            if (setup.createFolder) {
              componentDir = path.join(componentDir, component.name)
            }
          } else if (!opts.flat) {
            // In non-interactive mode, create folder by default unless --flat is specified
            componentDir = path.join(componentDir, component.name)
          }

          // Ensure component directory exists
          await fs.ensureDir(componentDir)

          if (!opts.silent) {
            logger.info(`Installing to ${path.relative(cwd, componentDir)}...`)
          }

          // Create component files
          for (const [filename, content] of Object.entries(component.files)) {
            const filePath = path.join(componentDir, filename)
            
            if (fs.existsSync(filePath) && !opts.overwrite) {
              if (!opts.silent) {
                logger.warn(`Skipping ${filename} (already exists)`)
              }
              continue
            }

            await fs.outputFile(filePath, content)
            if (!opts.silent) {
              logger.success(`Created ${filename}`)
            }
          }

          // Add to config if not already present
          const existingIndex = config.components.findIndex(c => c.id === componentId)
          if (existingIndex === -1) {
            config.components.push({
              id: componentId,
              name: component.name
            })
          } else {
            // Update name if it changed
            config.components[existingIndex].name = component.name
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          
          // Handle authentication errors specially
          if (errorMessage.includes("Authentication required") || errorMessage.includes("login first")) {
            logger.error("Authentication required. Please run 'compify login' first.")
            process.exit(1)
          }

          logger.error(`Failed to install ${componentId}:`, errorMessage)
          
          // Only ask to continue for non-auth errors that might be component-specific
          if (!opts.yes && components.length > 1) {
            const { continue: shouldContinue } = await prompts({
              type: 'confirm',
              name: 'continue',
              message: 'Would you like to continue with the remaining components?',
              initial: true
            })
            if (!shouldContinue) break
          } else {
            // For single component or --yes mode, just exit
            process.exit(1)
          }
        }
      }

      // Save config
      await fs.writeJSON(configPath, config, { spaces: 2 })
      
      if (!opts.silent) {
        logger.success(`\nInstallation complete!`)
      }

    } catch (error) {
      logger.error("Error:", error instanceof Error ? error.message : "Unknown error")
      process.exit(1)
    }
  })
