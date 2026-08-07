/**
 * Estimates number of tokens for given input text
 * @param {string} input - Text to estimate tokens for
 * @returns {number} Estimated token count
 */
function estimateTokens(input: string): number {
  const CHARS_PER_TOKEN = 3.7;
  return Math.ceil(input.length / CHARS_PER_TOKEN);
}

export default estimateTokens;
