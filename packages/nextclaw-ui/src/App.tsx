import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AccountPanel } from '@/account/components/account-panel';
import { appQueryClient } from '@/app-query-client';
import { LoginPage } from '@/components/auth/login-page';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStatus } from '@/hooks/use-auth';
import { t } from '@/lib/i18n';
import { useRealtimeQueryBridge } from '@/hooks/use-realtime-query-bridge';
import { AppPresenterProvider } from '@/presenter/app-presenter-context';
import { Toaster } from 'sonner';
import { Routes, Route, Navigate } from 'react-router-dom';

const ModelConfigPage = lazy(async () => ({ default: (await import('@/components/config/ModelConfig')).ModelConfig }));
const ChatPage = lazy(async () => ({ default: (await import('@/components/chat/ChatPage')).ChatPage }));
const SearchConfigPage = lazy(async () => ({ default: (await import('@/components/config/SearchConfig')).SearchConfig }));
const ProvidersListPage = lazy(async () => ({ default: (await import('@/components/config/ProvidersList')).ProvidersList }));
const ChannelsListPage = lazy(async () => ({ default: (await import('@/components/config/ChannelsList')).ChannelsList }));
const RuntimeConfigPage = lazy(async () => ({ default: (await import('@/components/config/RuntimeConfig')).RuntimeConfig }));
const SecurityConfigPage = lazy(async () => ({ default: (await import('@/components/config/security-config')).SecurityConfig }));
const SessionsConfigPage = lazy(async () => ({ default: (await import('@/components/config/SessionsConfig')).SessionsConfig }));
const SecretsConfigPage = lazy(async () => ({ default: (await import('@/components/config/SecretsConfig')).SecretsConfig }));
const RemoteAccessPage = lazy(async () => ({ default: (await import('@/components/remote/RemoteAccessPage')).RemoteAccessPage }));
const MarketplacePage = lazy(async () => ({ default: (await import('@/components/marketplace/MarketplacePage')).MarketplacePage }));
const McpMarketplacePage = lazy(async () => ({ default: (await import('@/components/marketplace/mcp/McpMarketplacePage')).McpMarketplacePage }));

function RouteFallback() {
  return <div className="h-full w-full animate-pulse rounded-2xl border border-border/40 bg-card/40" />;
}

function LazyRoute({ children }: { children: JSX.Element }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

function AuthBootstrapErrorState(props: {
  message: string;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-6 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">{t('authBrand')}</p>
        <h1 className="mt-3 text-2xl font-semibold text-gray-900">{t('authStatusLoadFailed')}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {props.message}
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={props.onRetry} disabled={props.retrying}>
            {t('authRetryStatus')}
          </Button>
        </div>
      </div>
    </main>
  );
}

function ProtectedApp() {
  useRealtimeQueryBridge(appQueryClient);

  return (
    <AppPresenterProvider>
      <AppLayout>
        <div className="w-full h-full">
          <Routes>
            <Route path="/chat/skills" element={<Navigate to="/skills" replace />} />
            <Route path="/chat/cron" element={<Navigate to="/cron" replace />} />
            <Route path="/chat/:sessionId?" element={<LazyRoute><ChatPage view="chat" /></LazyRoute>} />
            <Route path="/skills" element={<LazyRoute><ChatPage view="skills" /></LazyRoute>} />
            <Route path="/cron" element={<LazyRoute><ChatPage view="cron" /></LazyRoute>} />
            <Route path="/model" element={<LazyRoute><ModelConfigPage /></LazyRoute>} />
            <Route path="/search" element={<LazyRoute><SearchConfigPage /></LazyRoute>} />
            <Route path="/providers" element={<LazyRoute><ProvidersListPage /></LazyRoute>} />
            <Route path="/channels" element={<LazyRoute><ChannelsListPage /></LazyRoute>} />
            <Route path="/runtime" element={<LazyRoute><RuntimeConfigPage /></LazyRoute>} />
            <Route path="/remote" element={<LazyRoute><RemoteAccessPage /></LazyRoute>} />
            <Route path="/security" element={<LazyRoute><SecurityConfigPage /></LazyRoute>} />
            <Route path="/sessions" element={<LazyRoute><SessionsConfigPage /></LazyRoute>} />
            <Route path="/secrets" element={<LazyRoute><SecretsConfigPage /></LazyRoute>} />
            <Route path="/settings" element={<Navigate to="/model" replace />} />
            <Route path="/marketplace/skills" element={<Navigate to="/skills" replace />} />
            <Route path="/marketplace" element={<Navigate to="/marketplace/plugins" replace />} />
            <Route path="/marketplace/mcp" element={<LazyRoute><McpMarketplacePage /></LazyRoute>} />
            <Route path="/marketplace/:type" element={<LazyRoute><MarketplacePage /></LazyRoute>} />
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
      </AppLayout>
      <AccountPanel />
    </AppPresenterProvider>
  );
}

function AuthGate() {
  const authStatus = useAuthStatus();

  if (authStatus.isLoading && !authStatus.isError) {
    return <RouteFallback />;
  }

  if (authStatus.isError) {
    return (
      <AuthBootstrapErrorState
        message={authStatus.error instanceof Error ? authStatus.error.message : t('authStatusLoadFailed')}
        retrying={authStatus.isRefetching}
        onRetry={() => {
          void authStatus.refetch();
        }}
      />
    );
  }

  if (authStatus.data?.enabled && !authStatus.data.authenticated) {
    return <LoginPage username={authStatus.data.username} />;
  }

  return <ProtectedApp />;
}

export default function AppContent() {
  return (
    <QueryClientProvider client={appQueryClient}>
      <AuthGate />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
