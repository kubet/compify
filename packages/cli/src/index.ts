#!/usr/bin/env node
import { add } from "@/src/commands/add"
import { diff } from "@/src/commands/diff"
import { info } from "@/src/commands/info"
import { migrate } from "@/src/commands/migrate"
import { login } from "@/src/commands/login"
import { logout } from "@/src/commands/logout"
import { remove } from "@/src/commands/remove"
import { list } from "@/src/commands/list"
import { init } from "@/src/commands/init"
import { mcp } from "@/src/commands/mcp"
import { Command } from "commander"

import packageJson from "../package.json"

process.on("SIGINT", () => process.exit(0))
process.on("SIGTERM", () => process.exit(0))

async function main() {
  const program = new Command()
    .name("compify")
    .description("add components and dependencies to your project")
    .version(
      packageJson.version || "1.0.0",
      "-v, --version",
      "display the version number"
    )

  program
    .addCommand(add)
    .addCommand(diff)
    .addCommand(migrate)
    .addCommand(info)
    .addCommand(login)
    .addCommand(logout)
    .addCommand(remove)
    .addCommand(list)
    .addCommand(init)
    .addCommand(mcp)
  program.parse()
}

main()
