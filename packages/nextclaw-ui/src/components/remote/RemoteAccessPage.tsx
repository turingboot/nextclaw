import type { RemoteAccessView } from '@/api/remote.types';
import { PageHeader, PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/status-dot';
import { useRemoteStatus } from '@/hooks/useRemoteAccess';
import { formatDateTime, t } from '@/lib/i18n';
import { useAppPresenter } from '@/presenter/app-presenter-context';
import { resolveRemoteWebBase } from '@/remote/remote-access.query';
import { useRemoteAccessStore } from '@/remote/stores/remote-access.store';
import { Laptop, RefreshCcw, SquareArrowOutUpRight } from 'lucide-react';
import { useEffect, useMemo } from 'react';

type RemoteHeroView = {
  badgeStatus: 'active' | 'inactive' | 'ready' | 'setup' | 'warning';
  badgeLabel: string;
  title: string;
  description: string;
};

function KeyValueRow(props: { label: string; value?: string | number | null; muted?: boolean }) {
  const value = props.value === undefined || props.value === null || props.value === '' ? '-' : String(props.value);
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-gray-500">{props.label}</span>
      <span className={props.muted ? 'text-right text-gray-500' : 'text-right text-gray-900'}>{value}</span>
    </div>
  );
}

function buildHeroView(status: RemoteAccessView | undefined): RemoteHeroView {
  if (!status?.account.loggedIn) {
    return {
      badgeStatus: 'setup',
      badgeLabel: t('statusSetup'),
      title: t('remoteStatusNeedsSignIn'),
      description: t('remoteStatusNeedsSignInDescription')
    };
  }

  if (!status.settings.enabled) {
    return {
      badgeStatus: 'inactive',
      badgeLabel: t('statusInactive'),
      title: t('remoteStatusNeedsEnable'),
      description: t('remoteStatusNeedsEnableDescription')
    };
  }

  if (!status.service.running) {
    return {
      badgeStatus: 'warning',
      badgeLabel: t('remoteServiceStopped'),
      title: t('remoteStatusNeedsServiceTitle'),
      description: t('remoteStatusNeedsServiceDescription')
    };
  }

  if (status.runtime?.state === 'connected') {
    return {
      badgeStatus: 'ready',
      badgeLabel: t('statusReady'),
      title: t('remoteStatusReadyTitle'),
      description: t('remoteStatusReadyDescription')
    };
  }

  if (status.runtime?.state === 'connecting') {
    return {
      badgeStatus: 'active',
      badgeLabel: t('connecting'),
      title: t('remoteStatusConnectingTitle'),
      description: t('remoteStatusConnectingDescription')
    };
  }

  return {
    badgeStatus: 'warning',
    badgeLabel: t('remoteStateDisconnected'),
    title: t('remoteStatusIssueTitle'),
    description: t('remoteStatusIssueDescription')
  };
}

function buildIssueHint(status: RemoteAccessView | undefined) {
  if (!status?.settings.enabled) {
    return null;
  }
  if (!status.service.running) {
    return t('remoteStatusIssueDetailServiceStopped');
  }
  return status.runtime?.lastError?.trim() || t('remoteStatusIssueDetailGeneric');
}

export function RemoteAccessPage() {
  const presenter = useAppPresenter();
  const remoteStatus = useRemoteStatus();
  const status = remoteStatus.data;
  const actionLabel = useRemoteAccessStore((state) => state.actionLabel);
  const heroView = useMemo(() => buildHeroView(status), [status]);
  const issueHint = useMemo(() => buildIssueHint(status), [status]);
  const busy = Boolean(actionLabel);
  const deviceName = status?.runtime?.deviceName?.trim() || status?.settings.deviceName?.trim() || t('remoteDeviceNameAuto');
  const canOpenDeviceList = Boolean(status?.account.loggedIn && resolveRemoteWebBase(status));
  const shouldShowIssueHint = Boolean(status?.settings.enabled && status?.account.loggedIn && heroView.badgeStatus === 'warning');

  useEffect(() => {
    presenter.remoteAccessManager.syncStatus(status);
  }, [presenter, status]);

  if (remoteStatus.isLoading && !status) {
    return <div className="p-8 text-gray-400">{t('remoteLoading')}</div>;
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader title={t('remotePageTitle')} description={t('remotePageDescription')} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle>{heroView.title}</CardTitle>
              <StatusDot status={heroView.badgeStatus} label={heroView.badgeLabel} />
            </div>
            <CardDescription>{heroView.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <KeyValueRow label={t('remoteSignedInAccount')} value={status?.account.email} />
              <KeyValueRow label={t('remoteDeviceName')} value={deviceName} />
              <KeyValueRow label={t('remoteConnectionStatus')} value={heroView.badgeLabel} />
              <KeyValueRow label={t('remoteLastConnectedAt')} value={status?.runtime?.lastConnectedAt ? formatDateTime(status.runtime.lastConnectedAt) : '-'} muted />
            </div>

            <div className="flex flex-wrap gap-3">
              {!status?.account.loggedIn ? (
                <Button onClick={() => void presenter.remoteAccessManager.enableRemoteAccess(status)} disabled={busy}>
                  {actionLabel || t('remoteSignInAndEnable')}
                </Button>
              ) : !status.settings.enabled ? (
                <Button onClick={() => void presenter.remoteAccessManager.enableRemoteAccess(status)} disabled={busy}>
                  {actionLabel || t('remoteEnableNow')}
                </Button>
              ) : (
                <Button onClick={() => void presenter.remoteAccessManager.repairRemoteAccess(status)} disabled={busy}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {actionLabel || t('remoteReconnectNow')}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => void presenter.accountManager.openNextClawWeb()}
                disabled={busy || !canOpenDeviceList}
              >
                <SquareArrowOutUpRight className="mr-2 h-4 w-4" />
                {t('remoteOpenDeviceList')}
              </Button>

              {status?.settings.enabled ? (
                <Button variant="outline" onClick={() => void presenter.remoteAccessManager.disableRemoteAccess(status)} disabled={busy}>
                  {t('remoteDisable')}
                </Button>
              ) : null}
            </div>

            {shouldShowIssueHint ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-900">{t('remoteStatusIssueDetailTitle')}</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">{issueHint}</p>
              </div>
            ) : null}

            <p className="text-xs text-gray-500">{t('remoteOpenWebHint')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-primary" />
              {t('remoteDeviceSectionTitle')}
            </CardTitle>
            <CardDescription>{t('remoteDeviceSectionDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <StatusDot status={status?.account.loggedIn ? 'ready' : 'inactive'} label={status?.account.loggedIn ? t('remoteAccountConnected') : t('remoteAccountNotConnected')} />
              <StatusDot status={status?.settings.enabled ? 'active' : 'inactive'} label={status?.settings.enabled ? t('remoteEnabled') : t('remoteStateDisabled')} />
              <StatusDot status={status?.service.running ? 'active' : 'inactive'} label={status?.service.running ? t('remoteServiceRunning') : t('remoteServiceStopped')} />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <KeyValueRow label={t('remoteDeviceName')} value={deviceName} />
              <KeyValueRow label={t('remoteConnectionStatus')} value={heroView.badgeLabel} />
              <KeyValueRow label={t('remoteLastConnectedAt')} value={status?.runtime?.lastConnectedAt ? formatDateTime(status.runtime.lastConnectedAt) : '-'} muted />
            </div>

            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {status?.account.loggedIn ? t('remoteOpenWebHint') : t('remoteStatusNeedsSignInDescription')}
            </div>
          </CardContent>
        </Card>
      </div>

    </PageLayout>
  );
}
