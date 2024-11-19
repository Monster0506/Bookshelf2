/**
 * AI-powered text analysis using Hugging Face API
 */

const HUGGING_FACE_API_URL =
  "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

const HUGGING_FACE_CLASSIFIER_URL =
  "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";

const API_TOKEN = process.env.HUGGING_FACE_API_KEY;

/**
 * Categorize text using Hugging Face's zero-shot classification
 */
export const categorizeText = async (text, categories) => {
  if (!text || !categories || categories.length === 0) {
    console.log("Invalid input for categorizeText");
    return null;
  }

  if (!API_TOKEN) {
    console.log("AI features are disabled");
    return null;
  }

  try {
    const response = await fetch(HUGGING_FACE_CLASSIFIER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          candidate_labels: categories,
          multi_label: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error in categorizeText:", error);
    return null;
  }
};

/**
 * Extract insights from text using AI
 */
export const extractInsightsWithAI = async (text) => {
  if (!text) {
    console.log("No text provided to extractInsightsWithAI");
    return {};
  }

  if (!API_TOKEN) {
    console.log(
      "AI features are disabled, falling back to rule-based analysis",
    );
    return {};
  }

  const categories = [
    "Main Points",
    "Key Findings",
    "Insights",
    "Action Items",
    "Technical Details",
  ];

  try {
    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    console.log(`Processing ${sentences.length} sentences`);

    // Process in batches of 3 sentences
    const batchSize = 3;
    const results = {};

    for (let i = 0; i < Math.min(sentences.length, 15); i += batchSize) {
      const batch = sentences.slice(i, i + batchSize).join(" ");
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}`);

      try {
        const classification = await categorizeText(batch, categories);

        if (classification && classification.scores) {
          // Get categories with confidence > 0.3
          classification.scores.forEach((score, index) => {
            if (score > 0.3) {
              const category = classification.labels[index];
              if (!results[category]) {
                results[category] = new Set();
              }
              // Clean the text
              const cleanedText = batch
                .trim()
                .replace(/^\W+/, "")
                .replace(/\s+/g, " ");
              results[category].add(cleanedText);
            }
          });
        }
      } catch (batchError) {
        console.error("Error processing batch:", batchError);
        // Continue with next batch instead of failing completely
        continue;
      }
    }

    // Convert Sets to Arrays and ensure at least one item per category
    const finalResults = {};
    categories.forEach((category) => {
      const items = results[category] ? Array.from(results[category]) : [];
      if (items.length > 0) {
        finalResults[category] = items;
      }
    });

    console.log("Final AI extraction results:", finalResults);
    return finalResults;
  } catch (error) {
    console.error("Error in extractInsightsWithAI:", error);
    throw error; // Re-throw to handle in the component
  }
};

/**
 * Generate a summary of the text using AI
 */
export const generateAISummary = async (text) => {
  if (!text) {
    console.log("No text provided to generateAISummary");
    return null;
  }

  if (!API_TOKEN) {
    console.log("AI features are disabled, cannot generate summary");
    return null;
  }

  try {
    // Truncate text if it's too long
    const maxLength = 1024;
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

    const response = await fetch(HUGGING_FACE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: truncatedText,
        parameters: {
          max_length: 150,
          min_length: 50,
          do_sample: false,
          early_stopping: true,
          num_beams: 4,
          temperature: 1.0,
          top_k: 50,
          top_p: 0.95,
          no_repeat_ngram_size: 3,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return Array.isArray(result) && result.length > 0 ? result[0].summary_text : null;
  } catch (error) {
    console.error("Error in generateAISummary:", error);
    return null;
  }
};
