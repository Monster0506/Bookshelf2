import { Readability } from "@mozilla/readability";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import { eng } from "stopword"; // Stopword library for filtering
import { extractKeyTakeaways } from './keyTakeaways';

const winknlp = winkNLP(model);
const CUSTOM_STOP_WORDS = new Set([
  ...eng,
  "said",
  "mr",
  "mrs",
  "one",
  "two",
  "three",
  "first",
  "second",
  "new",
  "also",
]);

export const generateTags = (content) => {
  if (!content) return [];

  const doc = winknlp.readDoc(content);
  const namedEntities = doc.entities().out(winknlp.its.value);
  const singleWordNouns = doc
    .tokens()
    .filter(
      (token) =>
        token.out(winknlp.its.pos) === "NOUN" &&
        !token.out(winknlp.its.stopWordFlag) &&
        !CUSTOM_STOP_WORDS.has(token.out(winknlp.its.normal)),
    )
    .out(winknlp.its.normal);

  const potentialTags = [...namedEntities, ...singleWordNouns];
  const filteredTags = potentialTags.filter((word) => word.length > 2);

  const wordCounts = filteredTags.reduce((counts, word) => {
    counts[word] = (counts[word] || 0) + 1;
    return counts;
  }, {});

  const sortedWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);
  const topTags = sortedWords.slice(0, 25).map(([word]) => word);

  return topTags;
};

/**
 * Calculate the frequency of words in a sentence.
 */
const calculateTermFrequency = (sentence) => {
  const words = sentence.split(/\s+/);
  const termFrequency = {};

  words.forEach((word) => {
    if (!CUSTOM_STOP_WORDS.has(word.toLowerCase()) && word.length > 2) {
      termFrequency[word] = (termFrequency[word] || 0) + 1;
    }
  });

  return termFrequency;
};

/**
 * Calculate the inverse document frequency (IDF) for each word.
 */
const calculateInverseDocumentFrequency = (sentences) => {
  const totalSentences = sentences.length;
  const wordInSentenceCount = {};

  sentences.forEach((sentence) => {
    const uniqueWords = new Set(sentence.split(/\s+/));
    uniqueWords.forEach((word) => {
      if (!CUSTOM_STOP_WORDS.has(word.toLowerCase()) && word.length > 2) {
        wordInSentenceCount[word] = (wordInSentenceCount[word] || 0) + 1;
      }
    });
  });

  const inverseDocumentFrequency = {};
  for (const word in wordInSentenceCount) {
    inverseDocumentFrequency[word] = Math.log(
      totalSentences / (wordInSentenceCount[word] + 1),
    );
  }

  return inverseDocumentFrequency;
};

/**
 * Score sentences based on the sum of TF-IDF values of their words.
 */
const scoreSentences = (sentences, inverseDocumentFrequency) => {
  const sentenceScores = sentences.map((sentence) => {
    const termFrequency = calculateTermFrequency(sentence);
    let score = 0;

    for (const word in termFrequency) {
      if (inverseDocumentFrequency[word]) {
        score += termFrequency[word] * inverseDocumentFrequency[word];
      }
    }

    return { sentence, score };
  });

  return sentenceScores;
};

/**
 * Summarize content by extracting the most important sentences using TF-IDF.
 */
export const summarizeContent = (content, maxSentences = 3) => {
  const doc = winknlp.readDoc(content);
  const sentences = doc.sentences().out();

  // Calculate IDF for the sentences
  const inverseDocumentFrequency = calculateInverseDocumentFrequency(sentences);

  // Score sentences using TF-IDF
  const sentenceScores = scoreSentences(sentences, inverseDocumentFrequency);

  // Sort sentences by their scores and select the top `maxSentences`
  const sortedSentences = sentenceScores.sort((a, b) => b.score - a.score);
  const summary = sortedSentences
    .slice(0, maxSentences)
    .map((item) => item.sentence)
    .join(" ");

  return summary;
};

/**
 * Process article content to extract key information
 * @param {string} content - The article content to process
 * @param {boolean} useAI - Whether to use AI-powered extraction
 * @returns {Object} Processed content with key takeaways
 */
export const processArticleContent = async (content, useAI = true) => {
    if (!content) {
        console.warn('No content provided to process');
        return {};
    }

    try {
        const takeaways = await extractKeyTakeaways(content, useAI);
        return takeaways; 
    } catch (error) {
        console.error('Error processing content:', error);
        throw error;
    }
};

export const fetchAndProcessContent = async (url) => {
  try {
    const proxyUrl = "https://cors-proxy.tjraklovits.workers.dev/api/";
    const fullUrl = `${proxyUrl}${url}`;

    const response = await fetch(fullUrl, {
      method: "GET",
    });

    if (!response.ok) {
      console.error("Fetch failed:", {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`,
      );
    }
    const htmlContent = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article) {
      console.error("Readability failed to parse article");
      throw new Error("Could not parse article content.");
    }

    const wordCount = article.textContent.trim().split(/\s+/).length;
    const readingMinutes = Math.ceil(wordCount / 200);
    const readingTime = `${readingMinutes} minute${readingMinutes > 1 ? "s" : ""}`;
    const summary = summarizeContent(article.textContent);

    return {
      content: article.content,
      plaintext: article.textContent,
      readingTime,
      wordCount,
      summary,
    };
  } catch (error) {
    console.error("Error fetching or processing content:", error);
    return {
      content: "",
      plaintext: "",
      readingTime: "",
      wordCount: 0,
      summary: "",
    };
  }
};
