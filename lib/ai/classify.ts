import { AiAnalysis } from '../domain/types';

/**
 * AI Grievance Classification Pipeline.
 * Currently a stub returning null until AI integration is enabled.
 *
 * @param {string} _title - Sanitized grievance title.
 * @param {string} _description - Sanitized grievance description.
 * @returns {Promise<AiAnalysis | null>} Classified metadata or null.
 */
export async function classifyComplaint(
  _title: string,
  _description: string
): Promise<AiAnalysis | null> {
  // Stub implementation as specified: returns null for now
  return null;
}
