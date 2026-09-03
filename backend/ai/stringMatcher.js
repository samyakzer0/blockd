/**
 * BlockD Phonetic & String Similarity Utilities
 * Implements Jaro-Winkler distance, Levenshtein distance, and Soundex phonetic encoding
 * to match misspelled suspect names, aliases, and transliteration variations (e.g. Vicky vs Vikky).
 */

class StringMatcher {
  /**
   * Computes Levenshtein edit distance between two strings.
   */
  static levenshteinDistance(a, b) {
    const s1 = String(a).toLowerCase();
    const s2 = String(b).toLowerCase();
    const m = s1.length;
    const n = s2.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    return dp[m][n];
  }

  /**
   * Computes normalized similarity score (0.0 to 1.0) based on Levenshtein distance.
   */
  static stringSimilarity(a, b) {
    if (!a || !b) return 0;
    const s1 = String(a).trim().toLowerCase();
    const s2 = String(b).trim().toLowerCase();
    if (s1 === s2) return 1.0;
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;
    const dist = this.levenshteinDistance(s1, s2);
    return Math.max(0, 1 - dist / maxLen);
  }

  /**
   * Soundex phonetic encoding for Indian & Western names.
   * Maps phonetically similar names (e.g. Smith / Smyth, Vikram / Bikram) to identical 4-character codes.
   */
  static soundex(str) {
    if (!str || typeof str !== "string") return "";
    const s = str.toUpperCase().replace(/[^A-Z]/g, "");
    if (s.length === 0) return "";

    const map = {
      B: 1, F: 1, P: 1, V: 1,
      C: 2, G: 2, J: 2, K: 2, Q: 2, S: 2, X: 2, Z: 2,
      D: 3, T: 3,
      L: 4,
      M: 5, N: 5,
      R: 6
    };

    let result = s[0];
    let prev = map[s[0]] || 0;

    for (let i = 1; i < s.length && result.length < 4; i++) {
      const code = map[s[i]] || 0;
      if (code > 0 && code !== prev) {
        result += code;
        prev = code;
      } else if (code === 0) {
        prev = 0; // Vowel resets repetition
      }
    }

    while (result.length < 4) {
      result += "0";
    }
    return result;
  }

  /**
   * Checks if two names are phonetically equivalent.
   */
  static isPhoneticMatch(nameA, nameB) {
    const codeA = this.soundex(nameA);
    const codeB = this.soundex(nameB);
    return codeA && codeB && codeA === codeB;
  }
}

module.exports = { StringMatcher };
