import { Command } from "commander"
import prompts from "prompts"
import { AuthManager } from "@/src/utils/auth-manager"
import { logger } from "@/src/utils/logger"

export const login = new Command()
  .name("login")
  .description("login to your Compify account")
  .option("-t, --token <token>", "directly provide an API token")
  .action(async (opts) => {
    try {
      const authManager = AuthManager.getInstance();

      // If already authenticated, ask if want to login again
      if (await authManager.isAuthenticated()) {
        const { confirm } = await prompts({
          type: "confirm",
          name: "confirm",
          message: "You are already logged in. Do you want to login again?",
          initial: false
        });

        if (!confirm) {
          logger.info("Login cancelled. You are still logged in with your existing account.");
          process.exit(0);
        }
      }

      let token: string;
      
      if (opts.token) {
        token = opts.token;
      } else {
        const response = await prompts({
          type: "password",
          name: "token",
          message: "Please enter your Compify API token:",
          validate: (value) => value.length > 0 || "Token is required"
        });

        if (!response.token) {
          logger.error("Login cancelled.");
          process.exit(1);
        }

        token = response.token;
      }

      // Store the token
      await authManager.setToken(token);
      logger.success("Successfully logged in to Compify!");

    } catch (error) {
      logger.error("Failed to login:", error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  }); 