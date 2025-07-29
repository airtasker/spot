import inferProxyConfig from "./infer-proxy-config";

describe("inferProxyConfig", () => {
  it("returns null when no inputs are provided", () => {
    expect(inferProxyConfig("")).toBe(null);
  });

  it("throws an error when non-HTTP or HTTPS protocols are provided", () => {
    expect(() => {
      inferProxyConfig("chicken");
    }).toThrow(/Invalid URL/);

    expect(() => {
      inferProxyConfig("ftp://127.0.0.1/foo/bar/baz");
    }).toThrow(/Could not infer protocol/);
  });

  it("returns the expected value for proxy servers on the default port", () => {
    expect(inferProxyConfig("http://example.com/foo")).toEqual({
      isHttps: false,
      host: "example.com",
      port: null,
      path: "/foo"
    });
    expect(inferProxyConfig("http://example.com")).toEqual({
      isHttps: false,
      host: "example.com",
      port: null,
      path: "/"
    });
    expect(inferProxyConfig("https://api.dev.mycompany.com/api/v1")).toEqual({
      isHttps: true,
      host: "api.dev.mycompany.com",
      port: null,
      path: "/api/v1"
    });
  });

  it("returns the expected value for proxy servers on an explicit port", () => {
    expect(inferProxyConfig("http://example.com:80/foo")).toEqual({
      isHttps: false,
      host: "example.com",
      port: null,
      path: "/foo"
    });
    expect(
      inferProxyConfig("https://api.dev.mycompany.com:443/api/v1")
    ).toEqual({
      isHttps: true,
      host: "api.dev.mycompany.com",
      port: null,
      path: "/api/v1"
    });
    expect(inferProxyConfig("http://localhost:3000/api/v1")).toEqual({
      isHttps: false,
      host: "localhost",
      port: 3000,
      path: "/api/v1"
    });
    expect(
      inferProxyConfig("https://api.dev.mycompany.com:8443/api/v1")
    ).toEqual({
      isHttps: true,
      host: "api.dev.mycompany.com",
      port: 8443,
      path: "/api/v1"
    });
  });
});
