import { ProxyConfig } from "../../../lib/src/mock-server/server";

export default function inferProxyConfig(
  proxyBaseUrl: string
): ProxyConfig | null {
  if (!proxyBaseUrl) {
    return null;
  }

  const url = new URL(proxyBaseUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(
      'Could not infer protocol from proxy base url, should be either "http" or "https".'
    );
  }

  return {
    isHttps: url.protocol === "https:",
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : null,
    path: url.pathname
  };
}
