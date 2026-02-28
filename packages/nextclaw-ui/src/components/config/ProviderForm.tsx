import { useEffect, useMemo, useState } from 'react';
import { useConfig, useConfigMeta, useConfigSchema, useUpdateProvider } from '@/hooks/useConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MaskedInput } from '@/components/common/MaskedInput';
import { KeyValueEditor } from '@/components/common/KeyValueEditor';
import { StatusDot } from '@/components/ui/status-dot';
import { t } from '@/lib/i18n';
import { hintForPath } from '@/lib/config-hints';
import type { ProviderConfigUpdate } from '@/api/types';
import { KeyRound, Globe, Hash, RotateCcw } from 'lucide-react';

type WireApiType = 'auto' | 'chat' | 'responses';

type ProviderFormProps = {
  providerName?: string;
};

function normalizeHeaders(input: Record<string, string> | null | undefined): Record<string, string> | null {
  if (!input) {
    return null;
  }
  const entries = Object.entries(input)
    .map(([key, value]) => [key.trim(), value] as const)
    .filter(([key]) => key.length > 0);
  if (entries.length === 0) {
    return null;
  }
  return Object.fromEntries(entries);
}

function headersEqual(
  left: Record<string, string> | null | undefined,
  right: Record<string, string> | null | undefined
): boolean {
  const a = normalizeHeaders(left);
  const b = normalizeHeaders(right);
  if (a === null && b === null) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  const aEntries = Object.entries(a).sort(([ak], [bk]) => ak.localeCompare(bk));
  const bEntries = Object.entries(b).sort(([ak], [bk]) => ak.localeCompare(bk));
  if (aEntries.length !== bEntries.length) {
    return false;
  }
  return aEntries.every(([key, value], index) => key === bEntries[index][0] && value === bEntries[index][1]);
}

export function ProviderForm({ providerName }: ProviderFormProps) {
  const { data: config } = useConfig();
  const { data: meta } = useConfigMeta();
  const { data: schema } = useConfigSchema();
  const updateProvider = useUpdateProvider();

  const [apiKey, setApiKey] = useState('');
  const [apiBase, setApiBase] = useState('');
  const [extraHeaders, setExtraHeaders] = useState<Record<string, string> | null>(null);
  const [wireApi, setWireApi] = useState<WireApiType>('auto');

  const providerSpec = meta?.providers.find((p) => p.name === providerName);
  const providerConfig = providerName ? config?.providers[providerName] : null;
  const uiHints = schema?.uiHints;

  const apiKeyHint = providerName ? hintForPath(`providers.${providerName}.apiKey`, uiHints) : undefined;
  const apiBaseHint = providerName ? hintForPath(`providers.${providerName}.apiBase`, uiHints) : undefined;
  const extraHeadersHint = providerName ? hintForPath(`providers.${providerName}.extraHeaders`, uiHints) : undefined;
  const wireApiHint = providerName ? hintForPath(`providers.${providerName}.wireApi`, uiHints) : undefined;

  const providerTitle = providerSpec?.displayName || providerName || t('providersSelectPlaceholder');
  const defaultApiBase = providerSpec?.defaultApiBase || '';
  const currentApiBase = providerConfig?.apiBase || defaultApiBase;
  const currentHeaders = normalizeHeaders(providerConfig?.extraHeaders || null);
  const currentWireApi = (providerConfig?.wireApi || providerSpec?.defaultWireApi || 'auto') as WireApiType;

  useEffect(() => {
    if (!providerName) {
      setApiKey('');
      setApiBase('');
      setExtraHeaders(null);
      setWireApi('auto');
      return;
    }

    setApiKey('');
    setApiBase(currentApiBase);
    setExtraHeaders(providerConfig?.extraHeaders || null);
    setWireApi(currentWireApi);
  }, [providerName, currentApiBase, providerConfig?.extraHeaders, currentWireApi]);

  const hasChanges = useMemo(() => {
    if (!providerName) {
      return false;
    }
    const apiKeyChanged = apiKey.trim().length > 0;
    const apiBaseChanged = apiBase.trim() !== currentApiBase.trim();
    const headersChanged = !headersEqual(extraHeaders, currentHeaders);
    const wireApiChanged = providerSpec?.supportsWireApi ? wireApi !== currentWireApi : false;

    return apiKeyChanged || apiBaseChanged || headersChanged || wireApiChanged;
  }, [
    providerName,
    apiKey,
    apiBase,
    currentApiBase,
    extraHeaders,
    currentHeaders,
    providerSpec?.supportsWireApi,
    wireApi,
    currentWireApi
  ]);

  const resetToDefault = () => {
    setApiKey('');
    setApiBase(defaultApiBase);
    setExtraHeaders(null);
    setWireApi((providerSpec?.defaultWireApi || 'auto') as WireApiType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!providerName) {
      return;
    }

    const payload: ProviderConfigUpdate = {};
    const trimmedApiKey = apiKey.trim();
    const trimmedApiBase = apiBase.trim();
    const normalizedHeaders = normalizeHeaders(extraHeaders);

    if (trimmedApiKey.length > 0) {
      payload.apiKey = trimmedApiKey;
    }

    if (trimmedApiBase !== currentApiBase.trim()) {
      payload.apiBase = trimmedApiBase.length > 0 && trimmedApiBase !== defaultApiBase ? trimmedApiBase : null;
    }

    if (!headersEqual(normalizedHeaders, currentHeaders)) {
      payload.extraHeaders = normalizedHeaders;
    }

    if (providerSpec?.supportsWireApi && wireApi !== currentWireApi) {
      payload.wireApi = wireApi;
    }

    updateProvider.mutate({ provider: providerName, data: payload });
  };

  if (!providerName || !providerSpec || !providerConfig) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-gray-200/70 bg-white px-6 text-center xl:h-[calc(100vh-180px)] xl:min-h-[600px] xl:max-h-[860px]">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{t('providersSelectTitle')}</h3>
          <p className="mt-2 text-sm text-gray-500">{t('providersSelectDescription')}</p>
        </div>
      </div>
    );
  }

  const statusLabel = providerConfig.apiKeySet ? t('statusReady') : t('statusSetup');

  return (
    <div className="flex min-h-[520px] flex-col rounded-2xl border border-gray-200/70 bg-white shadow-card xl:h-[calc(100vh-180px)] xl:min-h-[600px] xl:max-h-[860px]">
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-gray-900">{providerTitle}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('providerFormDescription')}</p>
          </div>
          <StatusDot status={providerConfig.apiKeySet ? 'ready' : 'setup'} label={statusLabel} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="space-y-2.5">
            <Label htmlFor="apiKey" className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <KeyRound className="h-3.5 w-3.5 text-gray-500" />
              {apiKeyHint?.label ?? t('apiKey')}
            </Label>
            <MaskedInput
              id="apiKey"
              value={apiKey}
              isSet={providerConfig.apiKeySet}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={providerConfig.apiKeySet ? t('apiKeySet') : apiKeyHint?.placeholder ?? t('enterApiKey')}
              className="rounded-xl"
            />
            <p className="text-xs text-gray-500">{t('leaveBlankToKeepUnchanged')}</p>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="apiBase" className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Globe className="h-3.5 w-3.5 text-gray-500" />
              {apiBaseHint?.label ?? t('apiBase')}
            </Label>
            <Input
              id="apiBase"
              type="text"
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
              placeholder={defaultApiBase || apiBaseHint?.placeholder || 'https://api.example.com'}
              className="rounded-xl"
            />
            <p className="text-xs text-gray-500">{apiBaseHint?.help || t('providerApiBaseHelp')}</p>
          </div>

          {providerSpec.supportsWireApi && (
            <div className="space-y-2.5">
              <Label htmlFor="wireApi" className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <Hash className="h-3.5 w-3.5 text-gray-500" />
                {wireApiHint?.label ?? t('wireApi')}
              </Label>
              <Select value={wireApi} onValueChange={(v) => setWireApi(v as WireApiType)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(providerSpec.wireApiOptions || ['auto', 'chat', 'responses']).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === 'chat' ? t('wireApiChat') : option === 'responses' ? t('wireApiResponses') : t('wireApiAuto')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {wireApiHint?.help && <p className="text-xs text-gray-500">{wireApiHint.help}</p>}
            </div>
          )}

          <div className="space-y-2.5">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Hash className="h-3.5 w-3.5 text-gray-500" />
              {extraHeadersHint?.label ?? t('extraHeaders')}
            </Label>
            <KeyValueEditor value={extraHeaders} onChange={setExtraHeaders} />
            <p className="text-xs text-gray-500">{extraHeadersHint?.help || t('providerExtraHeadersHelp')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={resetToDefault}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('resetToDefault')}
          </Button>
          <Button type="submit" disabled={updateProvider.isPending || !hasChanges}>
            {updateProvider.isPending ? t('saving') : hasChanges ? t('save') : t('unchanged')}
          </Button>
        </div>
      </form>
    </div>
  );
}
