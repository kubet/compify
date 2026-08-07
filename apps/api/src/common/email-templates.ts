export const generateEmailTemplate = ({ name, email, token, frontendUrl }) => {
  const verificationUrl = `${frontendUrl}/verify?token=${token}&email=${encodeURIComponent(email)}&type=0`;

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f7;">
        <tr>
            <td style="padding: 20px 0;">
                <!-- Simple logo -->
                <table role="presentation" style="width: 100%; max-width: 520px; margin: 0 auto; margin-bottom: 16px;">
                    <tr>
                        <td style="text-align: center;">
                            <a href="https://compify.app" style="font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace; font-size: 20px; font-weight: 600; color: #000000; letter-spacing: -0.02em; text-decoration: none; pointer-events: none;">
                                compify.app
                            </a>
                        </td>
                    </tr>
                </table>

                <!-- Main Content -->
                <table role="presentation" style="width: 100%; max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 32px;">
                            <p style="margin: 0 0 24px; color: #1C1C1E; font-size: 16px; line-height: 1.5; font-weight: 500;">
                                Hi ${name},
                            </p>
                            <p style="margin: 0 0 32px; color: #48484A; font-size: 16px; line-height: 1.6;">
                                Thank you for joining Compify! To get started, please verify your email address:
                            </p>
                            <table role="presentation" style="width: 100%; margin: 0 0 32px;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
                                            Verify Email →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" style="width: 100%; margin-bottom: 32px; background-color: #f5f5f7; border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0; color: #636366; font-size: 12px; line-height: 1.5; word-break: break-all; font-family: ui-monospace, monospace;">
                                            ${verificationUrl}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0; color: #636366; font-size: 14px; line-height: 1.5;">
                                This link will expire in 24 hours. If you didn't create a Compify account, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Simple footer -->
                <table role="presentation" style="width: 100%; max-width: 520px; margin: 0 auto;">
                    <tr>
                        <td style="padding: 24px 0; text-align: center;">
                            <p style="margin: 0; color: #8E8E93; font-size: 13px;">
                                Compify - Build & Share Beautiful UI Components
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

export const generatePasswordResetTemplate = ({
  email,
  token,
  frontendUrl,
}) => {
  const resetUrl = `${frontendUrl}/login/password-reset?token=${token}&email=${encodeURIComponent(email)}`;

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f7;">
        <tr>
            <td style="padding: 20px 0;">
                <!-- Simple logo -->
                <table role="presentation" style="width: 100%; max-width: 520px; margin: 0 auto; margin-bottom: 16px;">
                    <tr>
                        <td style="text-align: center;">
                            <a href="https://compify.app" style="font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace; font-size: 20px; font-weight: 600; color: #000000; letter-spacing: -0.02em; text-decoration: none; pointer-events: none;">
                                compify.app
                            </a>
                        </td>
                    </tr>
                </table>

                <!-- Main Content -->
                <table role="presentation" style="width: 100%; max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 32px;">
                            <p style="margin: 0 0 24px; color: #48484A; font-size: 16px; line-height: 1.6;">
                                We received a request to reset your password. Click the button below to create a new password:
                            </p>
                            <table role="presentation" style="width: 100%; margin: 0 0 32px;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
                                            Reset Password →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" style="width: 100%; margin-bottom: 32px; background-color: #f5f5f7; border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0; color: #636366; font-size: 12px; line-height: 1.5; word-break: break-all; font-family: ui-monospace, monospace;">
                                            ${resetUrl}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0; color: #636366; font-size: 14px; line-height: 1.5;">
                                This link will expire in 1 hour for security reasons. If you didn't request a password reset, please ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Simple footer -->
                <table role="presentation" style="width: 100%; max-width: 520px; margin: 0 auto;">
                    <tr>
                        <td style="padding: 24px 0; text-align: center;">
                            <p style="margin: 0; color: #8E8E93; font-size: 13px;">
                                Compify - Build & Share Beautiful UI Components
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};
