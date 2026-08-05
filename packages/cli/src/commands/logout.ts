import { Command } from "commander"
import { AuthManager } from "../utils/auth-manager"
import { logger } from "../utils/logger"

export const logout = new Command()
  .name("logout")
  .description("logout from your Compify account")
  .action(async () => {
    try {
      const authManager = AuthManager.getInstance();

      if (!(await authManager.isAuthenticated())) {
        logger.info("You are not logged in.");
        process.exit(0);
      }

      await authManager.deleteToken();
      logger.success("Successfully logged out from Compify!");

    } catch (error) {
      logger.error("Failed to logout:", error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  }); 