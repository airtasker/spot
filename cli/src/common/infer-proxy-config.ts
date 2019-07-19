import { ProxyConfig } from '../../../lib/src/mockserver/server';

export default function inferProxyConfig(proxyBaseUrl: string): ProxyConfig | void {
  if (!proxyBaseUrl) {
    return undefined;
  }

  const [protocol] = proxyBaseUrl && proxyBaseUrl.split("://");

  if (protocol !== "http" && protocol !== "https") {
    throw new Error(
      'Err - could not infer protocol from proxy base url, should be either "http" or "https".'
    );
  }

  return {
    protocol,
    proxyBaseUrl,
  };
}
