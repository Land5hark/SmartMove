const DEFAULT_DEV_URL = "http://localhost:9002";

export function getAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return DEFAULT_DEV_URL;
}

export function getBoxUrl(boxId: string): string {
  return `${getAppUrl()}/box/${encodeURIComponent(boxId)}`;
}
