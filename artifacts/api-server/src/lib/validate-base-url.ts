const BLOCKED_METADATA_HOSTS = new Set([
  "169.254.169.254",
  "fd00:ec2::254",
  "metadata.google.internal",
  "metadata.google",
  "instance-data",
  "computeMetadata",
]);

const BLOCKED_METADATA_PATTERNS = [
  /^169\.254\.169\.254$/,
  /^fd00:ec2::254$/i,
];

function isBlockedMetadataHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (BLOCKED_METADATA_HOSTS.has(h)) return true;
  for (const pattern of BLOCKED_METADATA_PATTERNS) {
    if (pattern.test(h)) return true;
  }
  return false;
}

export function validateBaseUrl(
  rawUrl: string | null | undefined,
): { valid: true; url: string } | { valid: false; reason: string } {
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
    return {
      valid: false,
      reason: "Base URL must use http or https scheme",
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (isBlockedMetadataHost(hostname)) {
    return {
      valid: false,
      reason: `Hostname '${hostname}' is blocked (cloud metadata endpoint)`,
    };
  }

  return { valid: true, url: rawUrl };
}
