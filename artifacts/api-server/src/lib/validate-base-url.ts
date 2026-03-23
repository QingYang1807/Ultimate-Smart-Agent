const CLOUD_METADATA_PATTERNS = [
  /^169\.254\.169\.254$/,
  /^fd00:ec2::254$/i,
];

const CLOUD_METADATA_HOSTNAMES = new Set([
  "169.254.169.254",
  "fd00:ec2::254",
  "metadata.google.internal",
  "instance-data",
]);

const PRIVATE_IP_PATTERNS = [
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
];

const LOOPBACK_HOSTNAMES = new Set(["localhost"]);

function isCloudMetadataHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (CLOUD_METADATA_HOSTNAMES.has(h)) return true;
  for (const pattern of CLOUD_METADATA_PATTERNS) {
    if (pattern.test(h)) return true;
  }
  return false;
}

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (LOOPBACK_HOSTNAMES.has(h)) return true;
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(h)) return true;
  }
  return false;
}

export function validateBaseUrl(
  rawUrl: string | null | undefined,
  { isProduction = process.env.NODE_ENV === "production" }: { isProduction?: boolean } = {},
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
    return { valid: false, reason: "Base URL must use http or https scheme" };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (isCloudMetadataHost(hostname)) {
    return {
      valid: false,
      reason: `Hostname '${hostname}' is blocked (cloud metadata endpoint)`,
    };
  }

  if (isProduction && isPrivateHost(hostname)) {
    return {
      valid: false,
      reason:
        `Hostname '${hostname}' is not allowed in production. ` +
        "Private/loopback addresses are only permitted in development mode.",
    };
  }

  return { valid: true, url: rawUrl };
}
