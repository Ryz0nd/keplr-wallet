export function getFaviconUrl(origin: string): string {
  try {
    const { hostname } = new URL(origin);
    return `https://www.google.com/s2/favicons?domain=${hostname}`;
  } catch (e) {
    return "";
  }
}
