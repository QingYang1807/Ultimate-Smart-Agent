const PRIVATE_IP_RANGES = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",
  "instance-data",
];

export function validateBaseUrl(rawUrl: string | null | undefined): { valid: true; url: string } | { valid: false; reason: string } {
  if (!rawUrl) {
    return { valid: false, reason: "Base URL is required" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: "Invalid URL format" };
  }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    return { valid: false, reason: "Base URL must use http or https scheme" };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return { valid: false, reason: `Hostname '${hostname}' is not allowed` };
  }

  for (const pattern of PRIVATE_IP_RANGES) {
    if (pattern.test(hostname)) {
      return { valid: false, reason: "Private/internal IP addresses are not allowed" };
    }
  }

  if (parsed.protocol === "http:" && hostname !== "localhost" && !hostname.startsWith("127.")) {
    return { valid: false, reason: "Non-localhost http:// base URLs are not allowed. Use https://" };
  }

  return { valid: true, url: rawUrl };
}
