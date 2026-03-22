import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { openRemoteShare } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';

type Props = {
  grantToken: string;
};

export function SharePage({ grantToken }: Props): JSX.Element {
  const openShareQuery = useQuery({
    queryKey: ['remote-share-open', grantToken],
    queryFn: async () => await openRemoteShare(grantToken),
    retry: false
  });

  useEffect(() => {
    if (openShareQuery.data?.openUrl) {
      window.location.replace(openShareQuery.data.openUrl);
    }
  }, [openShareQuery.data]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_45%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center">
        <Card className="w-full space-y-4 rounded-[32px] border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">NextClaw Share</p>
            <CardTitle>正在打开共享实例</CardTitle>
            <p className="text-sm text-slate-500">
              分享链接每次打开都会创建一个新的访问会话。刷新当前页面后，系统会重新创建会话并继续跳转。
            </p>
          </div>

          {openShareQuery.isLoading ? (
            <p className="text-sm text-slate-600">正在校验分享链接并建立访问会话...</p>
          ) : null}

          {openShareQuery.error ? (
            <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-medium text-rose-700">分享链接当前不可用</p>
              <p className="text-sm text-rose-600">
                {openShareQuery.error instanceof Error ? openShareQuery.error.message : '无法打开分享链接'}
              </p>
              <Button onClick={() => void openShareQuery.refetch()} disabled={openShareQuery.isFetching}>
                重试打开
              </Button>
            </div>
          ) : null}

          {openShareQuery.data ? (
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">访问会话已创建</p>
              <p className="break-all text-xs text-slate-500">{openShareQuery.data.openUrl}</p>
              <Button onClick={() => window.location.replace(openShareQuery.data?.openUrl ?? '/')}>
                立即打开
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
