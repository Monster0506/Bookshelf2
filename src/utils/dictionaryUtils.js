import { db } from '../firebaseConfig';

// Dictionary API endpoints
const WIKTIONARY_API_URL = "https://en.wiktionary.org/api/rest_v1/page/html/";
const FREE_DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

export const DICTIONARY_SOURCES = {
    FREE_DICTIONARY: 'free_dictionary',
    WIKTIONARY: 'wiktionary',

};

/**
 * Format Free Dictionary API response
 * @param {Object} apiData - Raw API response
 * @returns {Object} Formatted dictionary entry
 */
const formatFreeDictionaryResponse = (apiData) => {
    if (!apiData || !apiData[0]) return null;

    const entry = apiData[0];
    const definitions = [];
    const examples = [];

    entry.meanings.forEach(meaning => {
        meaning.definitions.forEach(def => {
            definitions.push(`(${meaning.partOfSpeech}) ${def.definition}`);
            if (def.example) {
                examples.push(def.example);
            }
        });
    });

    return {
        word: entry.word,
        definitions: {
            general: definitions,
            fieldSpecific: {}
        },
        pronunciation: entry.phonetic || '',
        examples: {
            fromLibrary: [],
            general: examples
        },
        difficulty: calculateWordDifficulty(entry.word)
    };
};



/**
 * Extract text content from HTML string
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
const extractTextFromHtml = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const elementsToRemove = tempDiv.querySelectorAll('small, sup');
    elementsToRemove.forEach(el => el.remove());
    
    return tempDiv.textContent
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Parse Wiktionary HTML content
 * @param {string} html - HTML content
 * @param {string} word - Word to look up
 * @returns {Object} Parsed dictionary entry
 */
const parseWiktionaryHtml = (html, word) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const definitions = [];
    const examples = [];

    // Find English section
    const englishSection = Array.from(tempDiv.querySelectorAll('h2')).find(h2 => 
        h2.textContent.includes('English')
    )?.parentElement;

    if (englishSection) {
        // Find all definition lists in English section
        const defLists = englishSection.querySelectorAll('ol');
        defLists.forEach(list => {
            // Get part of speech from nearest preceding h3 or h4
            let partOfSpeech = '';
            let el = list.previousElementSibling;
            while (el && !partOfSpeech) {
                if (el.tagName === 'H3' || el.tagName === 'H4') {
                    partOfSpeech = extractTextFromHtml(el.innerHTML);
                    break;
                }
                el = el.previousElementSibling;
            }

            list.querySelectorAll('li').forEach(item => {
                if (!item.querySelector('.reference') && !item.classList.contains('mw-empty-elt')) {
                    const defText = extractTextFromHtml(item.innerHTML);
                    if (defText) {
                        definitions.push(partOfSpeech ? `(${partOfSpeech}) ${defText}` : defText);
                    }

                    const exampleEl = item.querySelector('.e-example');
                    if (exampleEl) {
                        const exampleText = extractTextFromHtml(exampleEl.innerHTML);
                        if (exampleText) {
                            examples.push(exampleText);
                        }
                    }
                }
            });
        });
    }

    return {
        word: word,
        definitions: {
            general: definitions,
            fieldSpecific: {}
        },
        pronunciation: '',
        examples: {
            fromLibrary: [],
            general: examples
        },
        difficulty: calculateWordDifficulty(word)
    };
};

/**
 * Fetch dictionary data from Free Dictionary API
 * @param {string} word - Word to look up
 * @returns {Promise<Object>} Dictionary data
 */
const fetchFreeDictionary = async (word) => {
    const response = await fetch(`${FREE_DICTIONARY_API_URL}${encodeURIComponent(word)}`);
    if (!response.ok) {
        throw new Error('Word not found in Free Dictionary');
    }
    const data = await response.json();
    return formatFreeDictionaryResponse(data);
};

/**
 * Fetch dictionary data from Wiktionary API
 * @param {string} word - Word to look up
 * @returns {Promise<Object>} Dictionary data
 */
const fetchWiktionary = async (word) => {
    const formattedWord = word.trim().replace(/\s+/g, '_');
    const response = await fetch(`${WIKTIONARY_API_URL}${encodeURIComponent(formattedWord)}`);
    if (!response.ok) {
        throw new Error('Word not found in Wiktionary');
    }
    const htmlContent = await response.text();
    return parseWiktionaryHtml(htmlContent, word);
};


/**
 * Fetch dictionary data from specified source
 * @param {string} word - Word to look up
 * @param {string} source - Dictionary source
 * @returns {Promise<Object>} Dictionary data
 */
export const fetchDictionaryData = async (word, source = DICTIONARY_SOURCES.FREE_DICTIONARY) => {
    try {
        switch (source) {
            case DICTIONARY_SOURCES.FREE_DICTIONARY:
                return await fetchFreeDictionary(word);
            case DICTIONARY_SOURCES.WIKTIONARY:
                return await fetchWiktionary(word);
            default:
                throw new Error('Invalid dictionary source');
        }
    } catch (error) {
        console.error('Dictionary API error:', error);
        return null;
    }
};

/**
 * Calculate word difficulty based on various factors
 * @param {string} word - The word to analyze
 * @returns {('basic'|'intermediate'|'advanced')} Difficulty level
 */
const calculateWordDifficulty = (word) => {
    const length = word.length;
    if (length <= 4) return 'basic';
    if (length <= 8) return 'intermediate';
    return 'advanced';
};
