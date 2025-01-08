/**
 * AI-powered text analysis using Hugging Face API
 */

// API Configuration
const MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1";
const HUGGING_FACE_API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

const API_TOKEN = process.env.REACT_APP_HUGGING_FACE_API_KEY;

// Prompt templates for better AI guidance
const SYSTEM_PROMPTS = {
  concepts: `<INST>You are an expert at generating deep, thought-provoking questions about complex topics. For the given text, generate 3-5 open-ended questions that:

1. Question Format:
   - Focus on broader implications and connections
   - Encourage critical thinking and analysis
   - Challenge assumptions and explore possibilities

2. Response Format:
   - Return ONLY a valid JSON object with this exact structure:
   {
     "questions": [
       "First question here",
       "Second question here",
       "Third question here"
     ]
   }
   - No additional text or formatting
   - No numbered lists
   - Just the JSON object

3. Question Guidelines:
   - Make questions relevant to the text's themes
   - Explore potential future implications
   - Consider historical or broader context
   - Examine underlying assumptions
   - Connect to larger fields of study

4. Example Response Format:
   {
     "questions": [
       "How might advances in quantum computing affect current cryptographic security methods?",
       "What implications does this technology have for privacy in digital communications?",
       "How could these developments reshape the future of secure data transmission?"
     ]
   }

Now, analyze the following text and generate thought-provoking questions following these guidelines exactly:</INST>`,

  categorize: `You are an expert at analyzing and categorizing text content. For the given text, analyze it and categorize relevant parts into the provided categories. 
               Only select text that strongly matches the categories, with high confidence. Format your response as JSON.`,

  insights: `<INST>You are an expert text analyzer. Your task is to extract key insights from the provided text and organize them into specific categories. Follow these requirements exactly:

1. Output Format:
   - Respond ONLY with a valid JSON object, no other text
   - Use the exact category names specified below
   - Each category should contain an array of strings
   - Output should not be original, but rather sentences directly from the text.

2. Categories to Include:
   "Main Points": Core arguments and central themes
   "Key Findings": Important discoveries and concrete results
   "Insights": Deeper analysis and interpretations
   "Action Items": Recommended next steps
   "Technical Details": Specific technical information
   "Questions": Important questions raised in the text

3. Guidelines:
   - Keep each insight concise (1-2 sentences)
   - Include at least one item per relevant category
   - Skip categories that don't apply
   - Ensure proper JSON formatting


You must return a JSON object of exactly this format. No other text.

Example Response Format:
{
  "Main Points": ["point 1", "point 2"],
  "Key Findings": ["finding 1", "finding 2"],
  "Insights": ["insight 1", "insight 2"],
  "Action Items": ["action 1", "action 2"],
  "Technical Details": ["detail 1", "detail 2"],
  "Questions": ["question 1", "question 2"]
}</INST>`,

  summary: `<INST>Your task is to create a clear, concise summary of the following text with these requirements:

1. Length: Exactly 3-5 sentences.
2. Style:
   - Prefix each sentence with a count of what number sentence it is.
   - Use direct language and maintain a professional tone.
   - Focus on key information and avoid unnecessary details or jargon.
3. Content:
   - Capture the main topic and essential details.
   - Do not use introductory phrases, bullet points, or special characters.
4. Format:
   - Write in paragraph form, with no lists or extra formatting.

Be concise but informative.
Do not provide any content aside from the summary.
</INST>`,
};

// Function declarations
export function safeJSONParse(text, source = "") {
  try {
    // Clean the text to prepare it for parsing
    const cleanedText = cleanTextForJSON(text);

    const parsed = JSON.parse(cleanedText);
    return parsed;
  } catch (error) {
    console.error(`Error parsing JSON from source "${source}":`, error);
    console.error("Original input:", text);
    return [];
  }
}

function cleanTextForJSON(text) {
  return text
    .trim()
    .replace(/^```json\s*/, "") // Remove JSON code block markers at the beginning
    .replace(/```\s*$/, "") // Remove JSON code block marker at the end
    .replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, "") // Remove leading zero-width spaces
    .replace(/^\s*<\/?[a-z]+>/gi, "") // Remove any XML/HTML-like tags
    .replace(/\n+/g, " ") // Replace multiple newlines with space
    .replace(/\s+/g, " "); // Normalize all whitespace to single spaces
}

export async function callHuggingFaceAPI(url, prompt, text) {
  if (!API_TOKEN) {
    console.error("AI features are disabled due to missing API token.");
    return [];
  }

  const systemMessage = `<s>[INST] ${prompt} [/INST]`;
  const userMessage = `Here is the text to analyze:\n\n${text}\n\n[INST] Please provide your response following the format specified above: [/INST]`;

  const requestBody = {
    inputs: systemMessage + userMessage,
    parameters: {
      max_new_tokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent output
      top_p: 0.9,
      do_sample: true,
      return_full_text: false,
      stop: ["</s>"], // Stop at end of response
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error Response: ${errorText}`);
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error during API call:", error);
    return [];
  }
}

export async function categorizeText(text, categories) {
  if (!text || !categories || categories.length === 0) {
    console.error("Invalid input for categorizeText");
    return [];
  }

  const prompt = `${SYSTEM_PROMPTS.categorize}\n\nCategories: ${categories.join(", ")}\n\nProvide your response as a JSON object with 'labels' and 'scores' arrays.`;

  try {
    const result = await callHuggingFaceAPI(HUGGING_FACE_API_URL, prompt, text);
    if (!result || !result[0]) return [];

    // Parse the LLM's response into the expected format
    try {
      const parsed = safeJSONParse(result[0].generated_text, "categorizeText");
      return {
        labels: parsed.labels || [],
        scores: parsed.scores || [],
      };
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Error in categorizeText:", error);
    return [];
  }
}

export async function extractInsightsWithAI(text) {
  try {
    const result = await callHuggingFaceAPI(
      HUGGING_FACE_API_URL,
      SYSTEM_PROMPTS.insights,
      text,
    );
    console.log("[AI Insights Response]:", result[0].generated_text);

    if (!result || !result[0]) {
      console.error("No result from API");
      return [];
    }

    // Try to extract JSON from the response

    const jsonMatch = result[0].generated_text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response");
      return [];
    }

    const insights = safeJSONParse(jsonMatch[0], "extractInsightsWithAI");
    if (!insights) {
      console.error("Failed to parse insights JSON");
      return [];
    }

    // Validate the structure
    const validCategories = [
      "Main Points",
      "Key Findings",
      "Insights",
      "Action Items",
      "Technical Details",
      "Questions",
    ];

    const validatedInsights = {};
    for (const category of validCategories) {
      if (Array.isArray(insights[category])) {
        validatedInsights[category] = insights[category];
      }
    }

    return validatedInsights;
  } catch (error) {
    console.error("Error extracting insights:", error);
    return [];
  }
}

export async function generateAISummary(text) {
  try {
    const result = await callHuggingFaceAPI(
      HUGGING_FACE_API_URL,
      SYSTEM_PROMPTS.summary,
      text,
    );
    console.log("[AI Summary Response]: ", result[0].generated_text);
    if (!result || !result[0]) {
      console.error("No summary result from API");
      return [];
    }

    // Clean up the response
    let summary = result[0].generated_text
      .trim()
      .replace(/^["']|["']$/g, "") // Remove quotes if present
      .replace(/\\n/g, "\n") // Handle newlines properly
      .replace(/^```.*\n?/, "") // Remove starting code block
      .replace(/```$/, "") // Remove ending code block
      .trim();

    return summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    return [];
  }
}

export async function generateConceptQuestions(text) {
  try {
    const userMessage = `\n\n${text}\n</INST>`;
    const response = await callHuggingFaceAPI(
      HUGGING_FACE_API_URL,
      SYSTEM_PROMPTS.concepts,
      text,
    );
    console.log(
      "[AI Concept Questions Response]: ",
      response[0].generated_text,
    );

    if (!response) {
      console.error("No response from AI");
      return [];
    }

    try {
      const parsed = JSON.parse(response[0].generated_text);
      if (!parsed || !parsed.questions || !Array.isArray(parsed.questions)) {
        console.error("Invalid questions format:", parsed);
        return [];
      }
      return parsed.questions;
    } catch (error) {
      console.error("[generateConceptQuestions] JSON Parse Error:", error);
      console.error("Original text: ", response[0].generated_text);
      return [];
    }
  } catch (error) {
    console.error("Failed to generate concept questions:", error);
    return [];
  }
}

/**
 * Recommends tags for an article based on its content
 * @param {string} text - The article content
 * @param {Array<string>} availableTags - List of available tags to choose from
 * @returns {Promise<Array<string>>} - Array of recommended tags
 */
export async function recommendTags(text, availableTags) {
  console.log("[provided tags]:", JSON.stringify(availableTags));
  const prompt = `<INST>You are a skilled content analyzer. Given the following text and a list of available tags, your task is to determine which tags most accurately describe the content. Only select tags that strongly align with the text’s theme, using high confidence.

The available tags are: ${JSON.stringify(availableTags)}. No other tags are aviable. Only use this list of tags.

Do not provide an analysis of the content. Do not use any tags other than the provided tags.

Format your response as a JSON array, including ONLY the tags that fit best. Do not add any content aside from the JSON.

Example response format:

["tag1", "tag2", "tag3", "tag4"]


Now, analyze the text and select the most relevant tags:</INST>`;

  try {
    const response = await callHuggingFaceAPI(
      HUGGING_FACE_API_URL,
      prompt,
      text,
    );
    console.log("[AI Tags Response]:", response[0].generated_text);
    const tags = safeJSONParse(
      response[0].generated_text || [],
      "tag recommendation",
    );

    // Ensure we only return tags that exist in availableTags
    return Array.isArray(tags) ? tags : [];
  } catch (error) {
    console.error("Error recommending tags:", error);
    return [];
  }
}
