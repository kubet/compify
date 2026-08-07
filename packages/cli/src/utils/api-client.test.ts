import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("node-fetch", () => ({ default: vi.fn() }))
vi.mock("./auth-manager", () => ({
  AuthManager: {
    getInstance: () => ({ getToken: vi.fn().mockResolvedValue("saved-token") }),
  },
}))

import fetch from "node-fetch"
import { ApiClient } from "./api-client"

const mockedFetch = vi.mocked(fetch)

afterEach(() => {
  mockedFetch.mockReset()
  delete process.env.COMPIFY_API_URL
})

describe("ApiClient", () => {
  it("normalizes and uses a self-hosted API URL", async () => {
    process.env.COMPIFY_API_URL = "https://registry.example.test/"
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any)
    await ApiClient.getInstance().getComponents()
    expect(mockedFetch).toHaveBeenCalledWith(
      "https://registry.example.test/cli/get-all",
      { headers: { "x-cli-token": "saved-token" } },
    )
  })

  it("turns unauthorized list responses into an authentication error", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 401 } as any)
    await expect(ApiClient.getInstance().getComponents()).rejects.toThrow(
      "Authentication required",
    )
  })

  it("rejects malformed list responses", async () => {
    mockedFetch.mockResolvedValue({ ok: true, json: async () => ({ message: "ok" }) } as any)
    await expect(ApiClient.getInstance().getComponents()).rejects.toThrow(
      "invalid component list",
    )
  })

  it("validates an explicit login token without storing it first", async () => {
    mockedFetch.mockResolvedValue({ ok: true } as any)
    await ApiClient.getInstance().validateToken("new-token")
    expect(mockedFetch).toHaveBeenCalledWith(
      "https://api.compify.app/cli/get-all",
      { headers: { "x-cli-token": "new-token" } },
    )
  })
})
