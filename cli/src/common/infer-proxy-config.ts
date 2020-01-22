import { ProxyConfig } from "../../../lib/src/mock-server/server";

export default function inferProxyConfig(
  proxyBaseUrl: string
): ProxyConfig | null {
  if (!proxyBaseUrl) {
    return null;
  }

  const [protocol] = proxyBaseUrl && proxyBaseUrl.split("://");

  if (protocol !== "http" && protocol !== "https") {
    throw new Error(
      'Could not infer protocol from proxy base url, should be either "http" or "https".'
    );
  }

  return {
    protocol,
    proxyBaseUrl
  };
}
