// utils/articleUtils.js
import nlp from "compromise";

/**
 * Tokenizes the content using compromise and removes stop words.
 */
const tokenize = (text) => {
  const doc = nlp(text);
  const terms = doc.terms().out("array"); // Extract terms from the text
  return terms.filter((term) => term.length > 2); // Filter terms longer than 2 characters
};

/**
 * Builds a term frequency map for a document.
 */
const termFrequency = (terms) => {
  const termFreq = {};
  terms.forEach((term) => {
    termFreq[term] = (termFreq[term] || 0) + 1;
  });
  return termFreq;
};

/**
 * Computes TF-IDF for all articles.
 */
const computeTFIDF = (articles) => {
  const documentTerms = articles.map((article) =>
    tokenize(article.markdown || ""),
  );
  const documentTermFreqs = documentTerms.map((terms) => termFrequency(terms));
  const documentCount = documentTerms.length;

  // Compute document frequency for each term
  const documentFreq = {};
  documentTerms.forEach((terms) => {
    const uniqueTerms = new Set(terms);
    uniqueTerms.forEach((term) => {
      documentFreq[term] = (documentFreq[term] || 0) + 1;
    });
  });

  // Calculate TF-IDF for each document
  return documentTermFreqs.map((termFreq) => {
    const tfidf = {};
    for (const term in termFreq) {
      const tf = termFreq[term];
      const idf = Math.log(documentCount / (1 + documentFreq[term]));
      tfidf[term] = tf * idf;
    }
    return tfidf;
  });
};

/**
 * Computes cosine similarity between two TF-IDF vectors.
 */
const cosineSimilarity = (vectorA, vectorB) => {
  const intersection = new Set([
    ...Object.keys(vectorA),
    ...Object.keys(vectorB),
  ]);
  const dotProduct = Array.from(intersection).reduce((sum, term) => {
    return sum + (vectorA[term] || 0) * (vectorB[term] || 0);
  }, 0);

  const magnitudeA = Math.sqrt(
    Object.values(vectorA).reduce((sum, val) => sum + val * val, 0),
  );
  const magnitudeB = Math.sqrt(
    Object.values(vectorB).reduce((sum, val) => sum + val * val, 0),
  );

  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Finds related articles based on TF-IDF cosine similarity.
 * @returns {Array} An array of objects where each contains the similarity score and the related article.
 */
export const findRelatedArticles = (targetArticle, articles, topN = 5) => {
  const tfidfVectors = computeTFIDF(articles);
  const targetIndex = articles.findIndex(
    (article) => article.id === targetArticle.id,
  );
  const targetVector = tfidfVectors[targetIndex];

  // Compute similarities
  const similarities = articles
    .map((article, index) => {
      if (index === targetIndex) return null; // Skip self
      const similarity = cosineSimilarity(targetVector, tfidfVectors[index]);
      return { similarity, article };
    })
    .filter((item) => item !== null); // Remove the null values

  // Sort by similarity and return the top N with the related articles
  const sortedSimilarities = similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);

  // Return an array with two elements: a list of similarity scores and related articles
  return [
    sortedSimilarities.map((item) => item.similarity),
    sortedSimilarities.map((item) => item.article),
  ];
};
