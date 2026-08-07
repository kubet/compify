const DEFAULT_API_URL = "https://api.compify.app"
const DEFAULT_WEB_URL = "https://compify.app"

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, "")
}

export function getApiUrl(): string {
  return normalizeUrl(process.env.COMPIFY_API_URL || DEFAULT_API_URL)
}

export function getWebUrl(): string {
  return normalizeUrl(process.env.COMPIFY_WEB_URL || DEFAULT_WEB_URL)
}

export function setRuntimeUrls(options: { apiUrl?: string; webUrl?: string }): void {
  if (options.apiUrl) process.env.COMPIFY_API_URL = normalizeUrl(options.apiUrl)
  if (options.webUrl) process.env.COMPIFY_WEB_URL = normalizeUrl(options.webUrl)
}

// Preserve the existing keychain entry for compify.app, while isolating tokens
// for each self-hosted registry.
export function getCredentialAccount(): string {
  const apiUrl = getApiUrl()
  return apiUrl === DEFAULT_API_URL ? "default" : apiUrl
}
