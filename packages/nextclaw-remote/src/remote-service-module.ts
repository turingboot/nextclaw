import type { Config } from "@nextclaw/core";
import { RemoteConnector } from "./remote-connector.js";
import type { RemoteLogger, RemoteStatusWriter } from "./types.js";

export class RemoteServiceModule {
  private abortController: AbortController | null = null;
  private runTask: Promise<void> | null = null;

  constructor(
    private readonly deps: {
      loadConfig: () => Config;
      uiEnabled: boolean;
      localOrigin: string;
      statusStore: RemoteStatusWriter;
      createConnector: (logger: RemoteLogger) => RemoteConnector;
      logger?: RemoteLogger;
    }
  ) {}

  start(): Promise<void> | null {
    if (this.runTask) {
      return this.runTask;
    }

    if (!this.deps.uiEnabled) {
      return null;
    }

    const config = this.deps.loadConfig();
    if (!config.remote.enabled) {
      this.deps.statusStore.write({
        enabled: false,
        state: "disabled",
        deviceName: undefined,
        deviceId: undefined,
        platformBase: undefined,
        localOrigin: this.deps.localOrigin,
        lastError: null,
        lastConnectedAt: null
      });
      return null;
    }

    const logger = this.deps.logger ?? {
      info: (message: string) => console.log(`[remote] ${message}`),
      warn: (message: string) => console.warn(`[remote] ${message}`),
      error: (message: string) => console.error(`[remote] ${message}`)
    };

    this.abortController = new AbortController();
    const connector = this.deps.createConnector(logger);
    this.runTask = connector.run({
      mode: "service",
      signal: this.abortController.signal,
      autoReconnect: config.remote.autoReconnect,
      localOrigin: this.deps.localOrigin,
      statusStore: this.deps.statusStore
    });

    void this.runTask.catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      const latestConfig = this.deps.loadConfig();
      this.deps.statusStore.write({
        enabled: true,
        state: "error",
        deviceName: latestConfig.remote.deviceName || undefined,
        deviceId: undefined,
        platformBase: latestConfig.remote.platformApiBase || undefined,
        localOrigin: this.deps.localOrigin,
        lastError: message
      });
      logger.error(message);
    });

    return this.runTask;
  }

  async restart(): Promise<void> {
    await this.stop();
    this.start();
  }

  async stop(): Promise<void> {
    this.abortController?.abort();
    try {
      await this.runTask;
    } catch {
      // Ignore connector shutdown errors after abort.
    } finally {
      this.abortController = null;
      this.runTask = null;
    }
  }
}
