export default function inferProtocol(proxyBaseUrl: string): "http" | "https" {
  const [protocol] = proxyBaseUrl && proxyBaseUrl.split("://");

  if (protocol !== "http" && protocol !== "https") {
    throw new Error(
      'Err - could not infer protocol from proxy base url, should be either "http" or "https".'
    );
  }

  return protocol;
}
