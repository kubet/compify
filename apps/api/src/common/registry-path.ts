import * as path from 'path';

/** True when a registry key is a portable relative path without traversal. */
export function isSafeRegistryPath(value: string): boolean {
  if (
    !value ||
    value.includes('\0') ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value)
  ) {
    return false;
  }
  return !value.split(/[\\/]+/).some((segment) => segment === '..');
}
