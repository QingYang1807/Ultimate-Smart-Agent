import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateBaseUrl } from "./validate-base-url.ts";

const dev = { isProduction: false };
const prod = { isProduction: true };

describe("validateBaseUrl", () => {
  describe("invalid inputs", () => {
    it("rejects null/undefined", () => {
      assert.equal(validateBaseUrl(null).valid, false);
      assert.equal(validateBaseUrl(undefined).valid, false);
      assert.equal(validateBaseUrl("").valid, false);
    });

    it("rejects non-URL strings", () => {
      assert.equal(validateBaseUrl("not-a-url").valid, false);
      assert.equal(validateBaseUrl("ftp://example.com").valid, false);
      assert.equal(validateBaseUrl("file:///etc/passwd").valid, false);
    });
  });

  describe("cloud metadata endpoints (always blocked)", () => {
    it("blocks AWS/Azure/GCP metadata IP in dev", () => {
      const r = validateBaseUrl("http://169.254.169.254/latest", dev);
      assert.equal(r.valid, false);
      assert.ok(r.valid === false && r.reason.includes("metadata"));
    });

    it("blocks AWS/Azure/GCP metadata IP in prod", () => {
      assert.equal(validateBaseUrl("http://169.254.169.254/latest", prod).valid, false);
    });

    it("blocks GCP metadata hostname", () => {
      assert.equal(validateBaseUrl("http://metadata.google.internal/computeMetadata/v1", dev).valid, false);
      assert.equal(validateBaseUrl("http://metadata.google.internal/computeMetadata/v1", prod).valid, false);
    });

    it("blocks EC2 IPv6 metadata endpoint", () => {
      assert.equal(validateBaseUrl("http://fd00:ec2::254", dev).valid, false);
      assert.equal(validateBaseUrl("http://fd00:ec2::254", prod).valid, false);
    });
  });

  describe("localhost/private — allowed in dev, blocked in prod", () => {
    it("allows localhost in dev", () => {
      const r = validateBaseUrl("http://localhost:11434/v1", dev);
      assert.equal(r.valid, true);
    });

    it("blocks localhost in prod", () => {
      assert.equal(validateBaseUrl("http://localhost:11434/v1", prod).valid, false);
    });

    it("allows 127.0.0.1 in dev", () => {
      assert.equal(validateBaseUrl("http://127.0.0.1:1234/v1", dev).valid, true);
    });

    it("blocks 127.0.0.1 in prod", () => {
      assert.equal(validateBaseUrl("http://127.0.0.1:1234/v1", prod).valid, false);
    });

    it("allows private ranges in dev (self-hosted gateways)", () => {
      assert.equal(validateBaseUrl("http://192.168.1.50:8080/v1", dev).valid, true);
      assert.equal(validateBaseUrl("http://10.0.0.5:8080/v1", dev).valid, true);
    });

    it("blocks private ranges in prod", () => {
      assert.equal(validateBaseUrl("http://192.168.1.50:8080/v1", prod).valid, false);
      assert.equal(validateBaseUrl("http://10.0.0.5:8080/v1", prod).valid, false);
    });
  });

  describe("legitimate public providers", () => {
    it("allows public HTTPS endpoints in dev", () => {
      assert.equal(validateBaseUrl("https://api.openai.com/v1", dev).valid, true);
      assert.equal(validateBaseUrl("https://api.groq.com/openai/v1", dev).valid, true);
      assert.equal(validateBaseUrl("https://api.anthropic.com", dev).valid, true);
      assert.equal(validateBaseUrl("https://openrouter.ai/api/v1", dev).valid, true);
    });

    it("allows public HTTPS endpoints in prod", () => {
      assert.equal(validateBaseUrl("https://api.openai.com/v1", prod).valid, true);
      assert.equal(validateBaseUrl("https://api.groq.com/openai/v1", prod).valid, true);
    });

    it("allows public HTTP endpoints in dev", () => {
      assert.equal(validateBaseUrl("http://my-custom-gateway.example.com/v1", dev).valid, true);
    });
  });
});
