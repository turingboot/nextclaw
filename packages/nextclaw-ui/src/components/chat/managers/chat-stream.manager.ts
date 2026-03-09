import { BehaviorSubject } from 'rxjs';
import type { SetStateAction } from 'react';
import type { ChatRunView, SessionEventView } from '@/api/types';
import { openResumeRunStream, openSendTurnStream, requestStopRun } from '@/components/chat/chat-stream/transport';
import {
  buildOptimisticUserEvent,
  clearStreamingState,
  StreamRunController,
  normalizeRequestedSkills
} from '@/components/chat/chat-stream/stream-run-controller';
import type {
  ActiveRunState,
  PendingChatMessage,
  SendMessageParams,
  StopCurrentRun,
  StreamSetters,
  UseChatStreamControllerParams,
} from '@/components/chat/chat-stream/types';

type ChatStreamRuntimeState = {
  optimisticUserEvent: SessionEventView | null;
  streamingSessionEvents: SessionEventView[];
  streamingAssistantText: string;
  streamingAssistantTimestamp: string | null;
  activeBackendRunId: string | null;
  isSending: boolean;
  isAwaitingAssistantOutput: boolean;
  queuedMessages: PendingChatMessage[];
  canStopCurrentRun: boolean;
  stopDisabledReason: string | null;
  lastSendError: string | null;
};

const INITIAL_STATE: ChatStreamRuntimeState = {
  optimisticUserEvent: null,
  streamingSessionEvents: [],
  streamingAssistantText: '',
  streamingAssistantTimestamp: null,
  activeBackendRunId: null,
  isSending: false,
  isAwaitingAssistantOutput: false,
  queuedMessages: [],
  canStopCurrentRun: false,
  stopDisabledReason: null,
  lastSendError: null
};

const DEFAULT_PARAMS: UseChatStreamControllerParams = {
  nextOptimisticUserSeq: 1,
  selectedSessionKeyRef: { current: null },
  setSelectedSessionKey: () => {},
  setDraft: () => {},
  refetchSessions: async () => {},
  refetchHistory: async () => {}
};

function resolveSetStateValue<T>(prev: T, next: SetStateAction<T>): T {
  if (typeof next === 'function') {
    return (next as (value: T) => T)(prev);
  }
  return next;
}

function buildPendingChatMessage(queueId: number, payload: SendMessageParams): PendingChatMessage {
  return {
    id: queueId,
    message: payload.message,
    sessionKey: payload.sessionKey,
    agentId: payload.agentId,
    ...(payload.sessionType ? { sessionType: payload.sessionType } : {}),
    ...(payload.model ? { model: payload.model } : {}),
    ...(payload.requestedSkills && payload.requestedSkills.length > 0
      ? { requestedSkills: payload.requestedSkills }
      : {}),
    ...(typeof payload.stopSupported === 'boolean' ? { stopSupported: payload.stopSupported } : {}),
    ...(payload.stopReason ? { stopReason: payload.stopReason } : {})
  };
}

export class ChatStreamManager {
  readonly state$ = new BehaviorSubject<ChatStreamRuntimeState>(INITIAL_STATE);

  private readonly runIdRef = { current: 0 };
  private readonly queueIdRef = { current: 0 };
  private readonly activeRunRef = { current: null as ActiveRunState | null };

  private queuePumpRunning = false;
  private disposed = false;

  private params: UseChatStreamControllerParams;

  constructor(params: UseChatStreamControllerParams = DEFAULT_PARAMS) {
    this.params = params;
  }

  updateParams = (next: UseChatStreamControllerParams) => {
    this.params = next;
  };

  getSnapshot = (): ChatStreamRuntimeState => this.state$.getValue();

  subscribe = (onStoreChange: () => void) => {
    const subscription = this.state$.subscribe(() => onStoreChange());
    return () => subscription.unsubscribe();
  };

  destroy = () => {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.runIdRef.current += 1;
    this.queuePumpRunning = false;
    this.activeRunRef.current?.requestAbortController.abort();
    this.activeRunRef.current = null;
    this.state$.complete();
  };

  sendMessage = async (payload: SendMessageParams) => {
    this.reconcileActiveRunRef();
    await this.executeSendMessagePolicy(payload);
    this.drainQueue();
  };

  resumeRun = async (run: ChatRunView) => {
    this.reconcileActiveRunRef();
    await this.executeResumePendingRun(run);
    this.drainQueue();
  };

  stopCurrentRun: StopCurrentRun = async (options) => {
    this.reconcileActiveRunRef();
    await this.executeStopActiveRun(options);
    this.drainQueue();
  };

  removeQueuedMessage = (id: number) => {
    this.setQueuedMessages((prev) => prev.filter((item) => item.id !== id));
  };

  promoteQueuedMessage = (id: number) => {
    this.setQueuedMessages((prev) => this.reorderQueuedMessageToFront(id, prev));
  };

  resetStreamState = () => {
    this.runIdRef.current += 1;
    this.queuePumpRunning = false;
    this.setQueuedMessages([]);
    this.activeRunRef.current?.requestAbortController.abort();
    this.activeRunRef.current = null;
    clearStreamingState(this.setters);
  };

  private readonly sendPendingMessage = async (
    item: PendingChatMessage,
    options?: { restoreDraftOnError?: boolean }
  ) => {
    const requestedSkills = normalizeRequestedSkills(item.requestedSkills);

    this.setters.setLastSendError(null);
    this.runIdRef.current += 1;

    await new StreamRunController({
      runId: this.runIdRef.current,
      runIdRef: this.runIdRef,
      activeRunRef: this.activeRunRef,
      selectedSessionKeyRef: this.params.selectedSessionKeyRef,
      setSelectedSessionKey: this.params.setSelectedSessionKey,
      setDraft: this.params.setDraft,
      refetchSessions: this.params.refetchSessions,
      refetchHistory: this.params.refetchHistory,
      restoreDraftOnError: options?.restoreDraftOnError,
      sourceSessionKey: item.sessionKey,
      sourceAgentId: item.agentId,
      sourceMessage: item.message,
      sourceStopSupported: item.stopSupported,
      sourceStopReason: item.stopReason,
      optimisticUserEvent: buildOptimisticUserEvent(this.params.nextOptimisticUserSeq, item.message),
      openStream: ({ signal, onReady, onDelta, onSessionEvent }) =>
        openSendTurnStream({
          item,
          requestedSkills,
          signal,
          onReady,
          onDelta,
          onSessionEvent
        }),
      setters: this.setters
    }).execute();
  };

  private readonly executeResumePendingRun = async (run: ChatRunView) => {
    const runId = run.runId?.trim();
    const sessionKey = run.sessionKey?.trim();
    if (!runId || !sessionKey) {
      return;
    }

    const active = this.activeRunRef.current;
    if (active?.backendRunId === runId) {
      return;
    }
    if (active || this.getSnapshot().isSending) {
      return;
    }

    this.setters.setLastSendError(null);
    this.runIdRef.current += 1;

    await new StreamRunController({
      runId: this.runIdRef.current,
      runIdRef: this.runIdRef,
      activeRunRef: this.activeRunRef,
      selectedSessionKeyRef: this.params.selectedSessionKeyRef,
      setSelectedSessionKey: this.params.setSelectedSessionKey,
      setDraft: this.params.setDraft,
      refetchSessions: this.params.refetchSessions,
      refetchHistory: this.params.refetchHistory,
      sourceSessionKey: sessionKey,
      sourceAgentId: run.agentId,
      sourceStopSupported: run.stopSupported,
      sourceStopReason: run.stopReason,
      optimisticUserEvent: null,
      openStream: ({ signal, onReady, onDelta, onSessionEvent }) =>
        openResumeRunStream({
          runId,
          signal,
          onReady,
          onDelta,
          onSessionEvent
        }),
      setters: this.setters
    }).execute();
  };

  private readonly executeStopActiveRun = async (options?: { clearQueue?: boolean }) => {
    const activeRun = this.activeRunRef.current;
    if (!activeRun) {
      return;
    }

    if (options?.clearQueue ?? true) {
      this.setQueuedMessages([]);
    }

    this.setters.setCanStopCurrentRun(false);
    activeRun.requestAbortController.abort();
    if (activeRun.backendStopSupported) {
      void requestStopRun(activeRun);
    }
  };

  private readonly executeSendMessagePolicy = async (payload: SendMessageParams) => {
    this.setters.setLastSendError(null);
    this.queueIdRef.current += 1;
    const item = buildPendingChatMessage(this.queueIdRef.current, payload);
    const sendPolicy = payload.sendPolicy ?? 'interrupt-and-send';
    const hasActiveRun = Boolean(this.activeRunRef.current);
    const isRunning = this.getSnapshot().isSending || hasActiveRun;

    if (isRunning) {
      if (sendPolicy === 'interrupt-and-send') {
        if (!hasActiveRun) {
          await this.runSend(item, { restoreDraftOnError: payload.restoreDraftOnError });
          return;
        }
        this.setQueuedMessages((prev) => [item, ...prev]);
        void this.stopCurrentRun({ clearQueue: false });
        return;
      }

      this.setQueuedMessages((prev) => [...prev, item]);
      return;
    }

    await this.runSend(item, { restoreDraftOnError: payload.restoreDraftOnError });
  };

  private readonly reorderQueuedMessageToFront = (id: number, prev: PendingChatMessage[]) => {
    const index = prev.findIndex((item) => item.id === id);
    if (index <= 0) {
      return prev;
    }

    const next = [...prev];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    return next;
  };

  private readonly runSend = async (item: PendingChatMessage, options?: { restoreDraftOnError?: boolean }) => {
    try {
      await this.sendPendingMessage(item, options);
    } finally {
      this.drainQueue();
    }
  };

  private readonly setQueuedMessages = (next: SetStateAction<PendingChatMessage[]>) => {
    this.updateField('queuedMessages', next);
    this.drainQueue();
  };

  private readonly setters: StreamSetters = {
    setOptimisticUserEvent: (next) => this.updateField('optimisticUserEvent', next),
    setStreamingSessionEvents: (next) => this.updateField('streamingSessionEvents', next),
    setStreamingAssistantText: (next) => this.updateField('streamingAssistantText', next),
    setStreamingAssistantTimestamp: (next) => this.updateField('streamingAssistantTimestamp', next),
    setActiveBackendRunId: (next) => this.updateField('activeBackendRunId', next),
    setIsSending: (next) => this.updateField('isSending', next),
    setIsAwaitingAssistantOutput: (next) => this.updateField('isAwaitingAssistantOutput', next),
    setCanStopCurrentRun: (next) => this.updateField('canStopCurrentRun', next),
    setStopDisabledReason: (next) => this.updateField('stopDisabledReason', next),
    setLastSendError: (next) => this.updateField('lastSendError', next)
  };

  private readonly updateState = (updater: (prev: ChatStreamRuntimeState) => ChatStreamRuntimeState) => {
    if (this.disposed) {
      return;
    }
    this.state$.next(updater(this.state$.getValue()));
  };

  private readonly updateField = <K extends keyof ChatStreamRuntimeState>(
    key: K,
    next: SetStateAction<ChatStreamRuntimeState[K]>
  ) => {
    this.updateState((prev) => ({
      ...prev,
      [key]: resolveSetStateValue(prev[key], next)
    }));
  };

  private readonly drainQueue = () => {
    if (this.disposed || this.queuePumpRunning) {
      return;
    }
    this.reconcileActiveRunRef();
    const state = this.getSnapshot();
    if (state.isSending || this.activeRunRef.current || state.queuedMessages.length === 0) {
      return;
    }

    const [next, ...rest] = state.queuedMessages;
    this.queuePumpRunning = true;
    this.updateField('queuedMessages', rest);

    void this.runSend(next, { restoreDraftOnError: true }).finally(() => {
      this.queuePumpRunning = false;
      this.drainQueue();
    });
  };

  private readonly reconcileActiveRunRef = () => {
    const snapshot = this.getSnapshot();
    if (!this.activeRunRef.current) {
      return;
    }
    if (snapshot.isSending || snapshot.activeBackendRunId) {
      return;
    }
    this.activeRunRef.current = null;
    this.updateState((prev) => ({
      ...prev,
      canStopCurrentRun: false,
      stopDisabledReason: null
    }));
  };
}
