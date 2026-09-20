/**
 * Offline document/incident relevance engine.
 * This intentionally uses deterministic keyword matching so the emergency
 * authorization workflow still works when there is no internet connection.
 */

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'need', 'into',
  'have', 'has', 'our', 'their', 'request', 'document', 'access', 'please',
  'urgent', 'urgently', 'incident', 'system', 'issue', 'problem', 'user'
]);

function tokenize(text = '') {
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => word.length >= 3 && !STOP_WORDS.has(word))
  )];
}

export function calculateRelevance({ incidentDescription, justification, document }) {
  const incidentTokens = tokenize(`${incidentDescription} ${justification}`);
  const documentTokens = tokenize(`${document.name} ${document.description} ${(document.keywords || []).join(' ')}`);

  const matchedKeywords = incidentTokens.filter(token => documentTokens.includes(token));
  const uniqueDocumentKeywords = new Set(documentTokens);
  const score = Math.min(100, Math.round((matchedKeywords.length / Math.max(3, Math.min(10, uniqueDocumentKeywords.size))) * 100));

  const threshold = 25;
  return {
    score,
    matchedKeywords,
    threshold,
    decision: score >= threshold ? 'relevant' : 'irrelevant'
  };
}
