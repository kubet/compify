import { afterEach, describe, expect, it } from "vitest"
import {
  getApiUrl,
  getCredentialAccount,
  getWebUrl,
  setRuntimeUrls,
} from "./config"

const originalApiUrl = process.env.COMPIFY_API_URL
const originalWebUrl = process.env.COMPIFY_WEB_URL

afterEach(() => {
  if (originalApiUrl === undefined) delete process.env.COMPIFY_API_URL
  else process.env.COMPIFY_API_URL = originalApiUrl
  if (originalWebUrl === undefined) delete process.env.COMPIFY_WEB_URL
  else process.env.COMPIFY_WEB_URL = originalWebUrl
})

describe("runtime registry configuration", () => {
  it("uses hosted defaults and preserves the legacy credential account", () => {
    delete process.env.COMPIFY_API_URL
    delete process.env.COMPIFY_WEB_URL
    expect(getApiUrl()).toBe("https://api.compify.app")
    expect(getWebUrl()).toBe("https://compify.app")
    expect(getCredentialAccount()).toBe("default")
  })

  it("normalizes self-hosted URLs and isolates credentials", () => {
    setRuntimeUrls({
      apiUrl: "https://registry.example.test///",
      webUrl: "https://components.example.test/",
    })
    expect(getApiUrl()).toBe("https://registry.example.test")
    expect(getWebUrl()).toBe("https://components.example.test")
    expect(getCredentialAccount()).toBe("https://registry.example.test")
  })
})
