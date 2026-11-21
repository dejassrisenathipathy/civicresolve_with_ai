import { GoogleGenAI } from '@google/genai';
import { redactPersonalData } from '../privacy/redact';

/**
 * Retrieves the configured Google Gen AI client.
 * Reads the server-only environment variable GEMINI_API_KEY.
 *
 * @throws {Error} If GEMINI_API_KEY is not configured in server environment.
 * @returns {GoogleGenAI} Initialized Google Gen AI client instance.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in server environment');
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Sanitizes input text by removing personal data before sending to Gemini.
 * Fulfills Rule 5 of AGENTS.md.
 *
 * @param {string} text - Raw input from civic report.
 * @returns {string} Redacted and privacy-safe text.
 */
export function prepareSafeGeminiInput(text: string): string {
  return redactPersonalData(text);
}
