/**
 * AI-powered text analysis using Transformers.js
 */

import { env, pipeline } from '@xenova/transformers';

// Configure environment for better performance
env.allowLocalModels = false;
env.useBrowserCache = true;
env.useCustomCache = false;
env.backends = ['webgl', 'wasm', 'cpu'];

// Define categories consistently across the application
const TAKEAWAY_CATEGORIES = {
    'Main Points': [],
    'Key Findings': [],
    'Insights': [],
    'Recommendations': [],
    'Impact': [],
    'Statistics': [],
    'Definitions': [],
    'Examples': [],
    'Comparisons': [],
    'Problems': [],
    'Solutions': [],
    'Future Implications': [],
    'Research Methods': [],
    'Limitations': []
};

// Keywords for each category
const CATEGORY_KEYWORDS = {
    'Main Points': ['importantly', 'primarily', 'main', 'key point', 'central', 'core', 'essential'],
    'Key Findings': ['found', 'discovered', 'revealed', 'shows', 'demonstrates', 'identifies', 'concludes'],
    'Insights': ['suggests', 'indicates', 'implies', 'points to', 'highlights', 'reveals', 'signifies'],
    'Recommendations': ['recommend', 'should', 'could', 'must', 'need to', 'advise', 'propose'],
    'Impact': ['impact', 'effect', 'influence', 'affects', 'consequences', 'results in', 'leads to'],
    'Statistics': ['%', 'percent', 'ratio', 'rate', 'average', 'median', 'significantly'],
    'Definitions': ['defined as', 'refers to', 'means', 'consists of', 'comprises', 'is a', 'are defined'],
    'Examples': ['example', 'instance', 'case', 'illustration', 'specifically', 'such as', 'for instance'],
    'Comparisons': ['compared to', 'versus', 'unlike', 'similar to', 'different from', 'contrasts with'],
    'Problems': ['problem', 'challenge', 'issue', 'difficulty', 'obstacle', 'barrier', 'limitation'],
    'Solutions': ['solution', 'resolve', 'address', 'solve', 'mitigate', 'overcome', 'remedy'],
    'Future Implications': ['future', 'will', 'potential', 'upcoming', 'next', 'emerging', 'trend'],
    'Research Methods': ['method', 'approach', 'study', 'analysis', 'research', 'investigation', 'examined'],
    'Limitations': ['limitation', 'constraint', 'restricted', 'bounded', 'limited by', 'constraint']
};

// Initialize the summarization pipeline
let summarizer = null;
const initializeSummarizer = async () => {
    try {
        if (summarizer) return summarizer;
        
        console.log('Initializing summarizer...');
        summarizer = await pipeline('summarization', 'Xenova/t5-small', {
            quantized: true
        });
        console.log('Pipeline created successfully');
        return summarizer;
    } catch (error) {
        console.error('Error initializing summarizer:', error);
        throw error;
    }
};

/**
 * Categorize text into predefined categories using keyword matching
 * @param {string} text - Text to categorize
 * @returns {Object} Categorized text segments
 */
export const categorizeText = async (text) => {
    const categories = {};
    
    // Initialize categories
    Object.keys(CATEGORY_KEYWORDS).forEach(category => {
        categories[category] = [];
    });

    // Split text into sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Categorize each sentence
    sentences.forEach(sentence => {
        sentence = sentence.trim();
        
        Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
            const matchesKeyword = keywords.some(keyword => 
                sentence.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (matchesKeyword) {
                categories[category].push(sentence);
            }
        });

        // If sentence wasn't categorized, check for patterns
        const uncategorized = !Object.values(categories).some(arr => arr.includes(sentence));
        if (uncategorized) {
            // Check for numerical patterns (statistics)
            if (/\d+%|\d+\s*(?:million|billion|thousand)|\$\d+/i.test(sentence)) {
                categories['Statistics'].push(sentence);
            }
            // Default to Main Points if no other category fits
            else if (sentence.length > 30) {  // Only include substantial sentences
                categories['Main Points'].push(sentence);
            }
        }
    });

    return categories;
};

/**
 * Extract key insights using AI
 * @param {string} text - The article text to analyze
 * @returns {Promise<Object>} Categorized takeaways
 */
export const extractInsightsWithAI = async (text) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Invalid input text');
    }

    try {
        // Initialize the model
        const model = await initializeSummarizer();
        
        // Use categorizeText for initial categorization
        const initialCategories = await categorizeText(text);
        
        // Initialize takeaways with our predefined categories
        const allTakeaways = {};
        Object.keys(TAKEAWAY_CATEGORIES).forEach(category => {
            allTakeaways[category] = [];
        });

        // Process chunks sequentially
        const chunks = splitTextIntoChunks(text, 512);
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (!chunk || chunk.trim().length < 50) continue;

            try {
                const result = await model(chunk, {
                    max_length: 100,
                    min_length: 30,
                    do_sample: false,
                    early_stopping: true
                });

                if (result?.[0]?.summary_text) {
                    const insights = await categorizeText(result[0].summary_text);
                    
                    // Safely merge insights into allTakeaways
                    Object.keys(TAKEAWAY_CATEGORIES).forEach(category => {
                        if (insights[category] && Array.isArray(insights[category])) {
                            // Add items one by one instead of spreading
                            insights[category].forEach(item => {
                                if (item && typeof item === 'string' && item.trim()) {
                                    allTakeaways[category].push(item.trim());
                                }
                            });
                        }
                    });
                }
            } catch (chunkError) {
                console.error('Chunk processing error:', chunkError);
                continue;
            }
        }

        // Clean up results
        const cleanedTakeaways = {};
        Object.keys(allTakeaways).forEach(category => {
            // Get unique items
            const uniqueItems = Array.from(new Set(allTakeaways[category]))
                .filter(Boolean)
                .slice(0, 3);
            
            if (uniqueItems.length > 0) {
                cleanedTakeaways[category] = uniqueItems;
            }
        });

        if (Object.keys(cleanedTakeaways).length === 0) {
            throw new Error('No takeaways generated');
        }

        return cleanedTakeaways;
    } catch (error) {
        console.error("Error in AI takeaways:", error);
        throw error;
    }
};

/**
 * Split text into manageable chunks
 * @param {string} text - Text to split
 * @param {number} maxLength - Maximum chunk length
 * @returns {string[]} Array of text chunks
 */
const splitTextIntoChunks = (text, maxLength) => {
    if (!text) return [];
    
    const chunks = [];
    let currentChunk = '';
    
    // Split into sentences more reliably
    const sentences = text.split(/(?<=[.!?])\s+/)
        .filter(Boolean)
        .map(s => s.trim());

    for (const sentence of sentences) {
        // If adding this sentence would exceed maxLength
        if (currentChunk && (currentChunk.length + sentence.length > maxLength)) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
};
