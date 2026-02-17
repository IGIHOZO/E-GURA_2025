/**
 * Fuzzy search utilities for typo-tolerant product search
 */

// Calculate Levenshtein distance (edit distance) between two strings
function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[s2.length][s1.length];
}

// Calculate similarity score (0-1, where 1 is exact match)
function similarityScore(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
}

// Check if query matches with typo tolerance
function fuzzyMatch(query, target, threshold = 0.7) {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  
  // Exact match
  if (t.includes(q)) return { match: true, score: 1.0, type: 'exact' };
  
  // Word-level matching
  const queryWords = q.split(/\s+/);
  const targetWords = t.split(/\s+/);
  
  let totalScore = 0;
  let matchedWords = 0;
  
  for (const qWord of queryWords) {
    let bestScore = 0;
    for (const tWord of targetWords) {
      const score = similarityScore(qWord, tWord);
      if (score > bestScore) {
        bestScore = score;
      }
    }
    if (bestScore >= threshold) {
      matchedWords++;
      totalScore += bestScore;
    }
  }
  
  if (matchedWords > 0) {
    const avgScore = totalScore / queryWords.length;
    return { 
      match: avgScore >= threshold, 
      score: avgScore, 
      type: 'fuzzy',
      matchedWords,
      totalWords: queryWords.length
    };
  }
  
  // Character-level similarity as fallback
  const charScore = similarityScore(q, t);
  return { 
    match: charScore >= threshold, 
    score: charScore, 
    type: 'character'
  };
}

// Build fuzzy search query for PostgreSQL
function buildFuzzySearchConditions(searchTerm, fields = ['name', 'description', 'brand', 'category', 'tags']) {
  const { Op } = require('sequelize');
  
  if (!searchTerm || searchTerm.trim().length === 0) {
    return null;
  }
  
  const term = searchTerm.trim();
  const words = term.split(/\s+/);
  
  const conditions = [];
  
  // Exact and partial matches (case-insensitive)
  fields.forEach(field => {
    if (field === 'tags') {
      // Special handling for array fields
      conditions.push({
        [field]: {
          [Op.overlap]: words
        }
      });
    } else {
      conditions.push({
        [field]: {
          [Op.iLike]: `%${term}%`
        }
      });
      
      // Individual word matches
      words.forEach(word => {
        if (word.length > 2) {
          conditions.push({
            [field]: {
              [Op.iLike]: `%${word}%`
            }
          });
        }
      });
    }
  });
  
  // Trigram similarity for typo tolerance (if pg_trgm extension is available)
  // This requires: CREATE EXTENSION IF NOT EXISTS pg_trgm;
  fields.forEach(field => {
    if (field !== 'tags') {
      conditions.push({
        [field]: {
          [Op.iLike]: `%${term.replace(/(.)/g, '$1%')}%` // Wildcard between chars for fuzzy
        }
      });
    }
  });
  
  return { [Op.or]: conditions };
}

// Score and rank search results
function rankSearchResults(products, searchTerm) {
  return products.map(product => {
    let totalScore = 0;
    let matches = 0;
    
    // Score against name (highest weight)
    const nameMatch = fuzzyMatch(searchTerm, product.name || '', 0.6);
    if (nameMatch.match) {
      totalScore += nameMatch.score * 5;
      matches++;
    }
    
    // Score against brand
    const brandMatch = fuzzyMatch(searchTerm, product.brand || '', 0.7);
    if (brandMatch.match) {
      totalScore += brandMatch.score * 3;
      matches++;
    }
    
    // Score against category
    const categoryMatch = fuzzyMatch(searchTerm, product.category || '', 0.7);
    if (categoryMatch.match) {
      totalScore += categoryMatch.score * 2;
      matches++;
    }
    
    // Score against description
    if (product.description) {
      const descMatch = fuzzyMatch(searchTerm, product.description, 0.6);
      if (descMatch.match) {
        totalScore += descMatch.score * 1;
        matches++;
      }
    }
    
    // Score against tags
    if (Array.isArray(product.tags)) {
      product.tags.forEach(tag => {
        const tagMatch = fuzzyMatch(searchTerm, tag, 0.7);
        if (tagMatch.match) {
          totalScore += tagMatch.score * 1.5;
          matches++;
        }
      });
    }
    
    return {
      ...product.toJSON ? product.toJSON() : product,
      _searchScore: matches > 0 ? totalScore / matches : 0,
      _matches: matches
    };
  }).filter(p => p._searchScore > 0)
    .sort((a, b) => b._searchScore - a._searchScore);
}

module.exports = {
  levenshteinDistance,
  similarityScore,
  fuzzyMatch,
  buildFuzzySearchConditions,
  rankSearchResults
};
