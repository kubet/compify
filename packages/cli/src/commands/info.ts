import path from "path"
import fs from "fs-extra"
import { Command } from "commander"
import { logger } from "../utils/logger"
import kleur from "kleur"

interface CompifyConfig {
  components: Array<{
    id: string;
    name: string;
  }>;
  version: string;
  componentPath: string;
}

interface ProjectInfo {
  name: string;
  version: string;
  componentPath: string;
  components: Array<{
    id: string;
    name: string;
  }>;
}

function formatProjectInfo(info: ProjectInfo, json: boolean): string {
  if (json) {
    return JSON.stringify(info, null, 2);
  }

  let output = '\n';
  
  // Project details
  output += kleur.bold().blue('Project Information:\n');
  output += `${kleur.dim('├─')} Name: ${info.name}\n`;
  output += `${kleur.dim('├─')} Version: ${info.version}\n`;
  output += `${kleur.dim('└─')} Component Directory: ${info.componentPath}\n\n`;

  // Components
  if (info.components.length === 0) {
    output += kleur.yellow('No components installed.\n');
  } else {
    output += kleur.bold().blue(`Installed Components (${info.components.length}):\n`);
    info.components.forEach((component, index) => {
      const isLast = index === info.components.length - 1;
      const prefix = isLast ? '└─' : '├─';
      output += `${kleur.dim(prefix)} ${component.name} ${kleur.dim(`(${component.id})`)}\n`;
    });
  }

  return output;
}

export const info = new Command()
  .name("info")
  .description("display information about your project and installed components")
  .option("-c, --cwd <cwd>", "the working directory", process.cwd())
  .option("-j, --json", "output as JSON", false)
  .action(async (opts) => {
    try {
      const cwd = path.resolve(opts.cwd)

      // Load package.json for project info
      const packageJsonPath = path.join(cwd, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        logger.error("No package.json found. Are you in the right directory?")
        process.exit(1)
      }

      const packageJson = await fs.readJSON(packageJsonPath)

      // Load compify.json for component info
      const configPath = path.join(cwd, 'compify.json')
      let config: CompifyConfig = {
        components: [],
        version: "1.0.0",
        componentPath: "src/components"
      }

      if (fs.existsSync(configPath)) {
        config = await fs.readJSON(configPath)
      }

      const projectInfo: ProjectInfo = {
        name: packageJson.name || 'Unknown Project',
        version: config.version || '0.0.0',
        componentPath: config.componentPath,
        components: config.components
      }

      // Format and display the information
      const output = formatProjectInfo(projectInfo, opts.json)
      
      if (opts.json) {
        console.log(output)
      } else {
        process.stdout.write(output)
      }

    } catch (error) {
      logger.error("Error:", error instanceof Error ? error.message : "Unknown error")
      process.exit(1)
    }
  })
