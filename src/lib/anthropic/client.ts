import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// This is the only file in the codebase that references ANTHROPIC_API_KEY
// The server-only import above makes the Next.js bundler throw a build error
// if this module is ever imported from a client component.

let _client: Anthropic | null = null;

/**
 * Returns the lazily-initialized Anthropic client.
 * Throws at call time (not import time) if ANTHROPIC_API_KEY is missing.
 */
export function getAnthropicClient(): Anthropic {
  if (_client) return _client;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  _client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  return _client;
}
