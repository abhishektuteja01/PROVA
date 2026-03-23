import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// This is the only file in the codebase that references ANTHROPIC_API_KEY
// The server-only import above makes the Next.js bundler throw a build error
// if this module is ever imported from a client component.
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY environment variable is not set");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
