import kleur from 'kleur';

export const logger = {
  info: (message: string) => {
    console.log(kleur.blue().bold('info ') + message);
  },
  success: (message: string) => {
    console.log(kleur.green().bold('success ') + message);
  },
  error: (message: string, details?: string) => {
    console.error(kleur.red().bold('error ') + message + (details ? `: ${details}` : ''));
  },
  warn: (message: string) => {
    console.warn(kleur.yellow().bold('warn ') + message);
  },
  break: () => {
    console.log();
  }
}; 