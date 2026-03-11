import type {
  NcpEndpoint,
  NcpEndpointEvent,
  NcpEndpointSubscriber,
} from "../types/endpoint.js";
import type { NcpEndpointManifest } from "../types/manifest.js";

/**
 * Base class for NCP endpoint adapters.
 *
 * Lifecycle (start/stop) and pub/sub; concrete adapters implement onStart/onStop
 * and call broadcast() to deliver events to subscribers.
 */
export abstract class AbstractEndpoint implements NcpEndpoint {
  abstract readonly manifest: NcpEndpointManifest;

  private started = false;
  private readonly listeners = new Set<NcpEndpointSubscriber>();

  async start(): Promise<void> {
    if (this.started) return;
    await this.onStart();
    this.started = true;
    this.broadcast({ type: "endpoint.ready" });
  }

  async stop(): Promise<void> {
    if (!this.started) return;
    await this.onStop();
    this.started = false;
  }

  emit(event: NcpEndpointEvent): void {
    this.broadcast(event);
  }

  subscribe(listener: NcpEndpointSubscriber): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Deliver an event to all subscribers. Subclasses call this to surface inbound events. */
  protected broadcast(event: NcpEndpointEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  protected abstract onStart(): Promise<void>;
  protected abstract onStop(): Promise<void>;
}
