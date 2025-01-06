import React, { useState, useEffect } from 'react';
import { extractInsightsWithAI, generateAISummary, generateConceptQuestions, recommendTags } from '../../../utils/aiUtils';
import { extractKeyTakeaways } from '../../../utils/keyTakeaways';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Tooltip from '../../common/Tooltip';
import {
    faSync, faRobot, faBook, faChevronDown, faChevronUp,
    faFileAlt, faLightbulb, faMagic, faBrain, faQuestion, faPuzzlePiece
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

const CATEGORY_ICONS = {
    'Summary': faFileAlt,
    'Key Findings': faMagic,
    'Insights': faBrain,
    'Action Items': faBook,
    'Main Points': faLightbulb,
    'Technical Details': faRobot,
    'Questions': faQuestion,
    'Concepts': faPuzzlePiece
};

const CATEGORY_DESCRIPTIONS = {
    'Summary': 'A concise 2-3 sentence overview of the main content',
    'Key Findings': 'Important discoveries, statistics, and concrete results',
    'Insights': 'Deeper analysis and interpretations of the content',
    'Action Items': 'Recommended next steps and actionable suggestions',
    'Main Points': 'Core arguments and central themes of the content',
    'Technical Details': 'Specific technical information and implementation details',
    'Questions': 'Important questions raised in the content',
    'Concepts': 'Key concepts and deep questions related to the content'
};

const SummaryTab = ({ article, status, tags, setTags, saveMetadata, createdAt, handleMetadataChange }) => {
    const [takeaways, setTakeaways] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [useAI, setUseAI] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({});
    const [conceptQuestions, setConceptQuestions] = useState([]);
    const [aiSummary, setAiSummary] = useState('');
    const [conceptsLoading, setConceptsLoading] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [recommendedTags, setRecommendedTags] = useState([]);
    const [tagsLoading, setTagsLoading] = useState(false);

    const toggleSection = (category) => {
        setCollapsedSections((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const toggleAI = async () => {
        setUseAI(!useAI);
        // Clear previous AI results when switching
        if (!useAI) {
            setConceptQuestions([]);
            setAiSummary('');
            setRecommendedTags([]);
        }
    };

    const generateConcepts = async () => {
        if (!article?.plaintext || !useAI) return;

        setConceptsLoading(true);
        try {
            const questions = await generateConceptQuestions(article.plaintext);
            setConceptQuestions(questions || []);
        } catch (error) {
            console.error('Error generating concepts:', error);
        } finally {
            setConceptsLoading(false);
        }
    };

    const generateSummary = async () => {
        if (!article?.plaintext || !useAI) return;

        setSummaryLoading(true);
        try {
            const summary = await generateAISummary(article.plaintext);
            setAiSummary(summary || '');
        } catch (error) {
            console.error('Error generating summary:', error);
            setAiSummary('');
        } finally {
            setSummaryLoading(false);
        }
    };

    const generateRuleBasedTags = (text, availableTags) => {
        if (!text || !availableTags?.length) return [];

        // Convert text to lowercase for case-insensitive matching
        const lowerText = text.toLowerCase();
        const words = lowerText.split(/\W+/).filter(word => word.length > 3);

        // Count word frequencies
        const wordFrequency = {};
        words.forEach(word => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        });

        // Define categories and their related terms
        const categoryTerms = {
            'technology': ['software', 'hardware', 'programming', 'code', 'computer', 'digital', 'tech', 'algorithm', 'data'],
            'science': ['research', 'study', 'experiment', 'scientific', 'discovery', 'analysis', 'hypothesis', 'theory'],
            'business': ['market', 'company', 'startup', 'business', 'entrepreneur', 'finance', 'industry', 'economic'],
            'health': ['medical', 'health', 'disease', 'treatment', 'patient', 'clinical', 'medicine', 'healthcare'],
            'education': ['learning', 'education', 'student', 'teaching', 'academic', 'school', 'university', 'training'],
            'design': ['design', 'interface', 'user', 'experience', 'visual', 'creative', 'aesthetic', 'layout'],
            'development': ['development', 'engineering', 'implementation', 'architecture', 'system', 'framework', 'platform'],
            'ai': ['intelligence', 'artificial', 'machine', 'learning', 'neural', 'model', 'prediction', 'automation']
        };

        // Score each available tag based on term frequency and category matches
        const tagScores = availableTags.map(tag => {
            const lowerTag = tag.toLowerCase();
            let score = 0;

            // Direct word frequency match
            const tagWords = lowerTag.split(/\W+/);
            tagWords.forEach(word => {
                if (wordFrequency[word]) {
                    score += wordFrequency[word] * 2;
                }
            });

            // Category term matches
            Object.entries(categoryTerms).forEach(([category, terms]) => {
                if (terms.some(term => lowerText.includes(term))) {
                    if (lowerTag === category || tagWords.some(word => terms.includes(word))) {
                        score += 1;
                    }
                }
            });

            return { tag, score };
        });

        // Sort by score and take top matches
        return tagScores
            .filter(({ score }) => score > 0)
            .filter(({ tag }) => !tags.split(',').map(t => t.trim()).includes(tag))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(({ tag }) => tag);
    };

    const generateRecommendedTags = async () => {
        if (!article?.plaintext) return;

        setTagsLoading(true);
        try {
            // Fetch available tags from Firestore
            const tagsSnapshot = await getDocs(collection(db, 'tags'));
            const availableTags = tagsSnapshot.docs.map(doc => doc.data().name);

            // Get tag recommendations based on whether AI is enabled
            const recommendations = useAI
                ? await recommendTags(article.plaintext, availableTags)
                : generateRuleBasedTags(article.plaintext, availableTags)

            setRecommendedTags(recommendations);
        } catch (error) {
            console.error('Error generating tag recommendations:', error);
            setRecommendedTags([]);
        } finally {
            setTagsLoading(false);
        }
    };

    useEffect(() => {
        processTakeaways();
    }, [article?.plaintext, useAI]);

    // Clear concepts when switching modes
    useEffect(() => {
        if (!useAI) {
            setConceptQuestions([]);
            setAiSummary('');
            generateRecommendedTags(); 
        }
    }, [useAI]);

    useEffect(() => {
        if (useAI && !aiSummary && article?.plaintext) {
            generateSummary();
        }
    }, [useAI, article?.plaintext]);

    useEffect(() => {
        if (article?.plaintext) {
            generateRecommendedTags();
        }
    }, [article?.plaintext, useAI]);

    const processTakeaways = async () => {
        if (!article?.plaintext) {
            setError('No article content available');
            return;
        }

        setLoading(true);
        setError(null);
        setTakeaways({});

        try {
            let results;
            if (useAI) {
                try {
                    results = await extractInsightsWithAI(article.plaintext);
                } catch (error) {
                    console.error('AI extraction failed:', error);
                    setError('AI analysis failed. Please try again.');
                    setLoading(false);
                    return;
                }
            } else {
                results = extractKeyTakeaways(article.plaintext);
            }

            if (!results || Object.keys(results).length === 0) {
                setError(useAI ? 'AI analysis failed to extract insights.' : 'No insights found in the article content.');
            } else {
                setTakeaways(results);
            }
        } catch (error) {
            console.error('Processing error:', error);
            setError('Failed to process article content');
        } finally {
            setLoading(false);
        }
    };

    const colorScheme = useAI
        ? 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-800'
        : 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <motion.button
                    onClick={() => !loading && toggleAI()}
                    disabled={loading}
                    className={`
                        flex items-center gap-3 px-6 py-3 rounded-xl font-medium text-sm
                        shadow-lg hover:shadow-xl transform transition-all duration-300
                        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}
                        ${useAI
                            ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white'
                            : 'bg-gradient-to-r from-blue-500 to-blue-700 text-white'
                        }
                    `}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                    <FontAwesomeIcon icon={useAI ? faRobot : faBook} className="text-lg" />
                    <span>{useAI ? 'AI Analysis' : 'Rule-Based Analysis'}</span>
                    {useAI && <FontAwesomeIcon icon={faMagic} className="text-sm opacity-75" />}
                </motion.button>

                {loading && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className={`text-xl ${useAI ? 'text-purple-500' : 'text-blue-500'}`}
                    >
                        <FontAwesomeIcon icon={faSync} />
                    </motion.div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {error ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-6 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 mb-8 shadow-md"
                    >
                        <div className="font-medium mb-1">Analysis Error</div>
                        <div className="text-sm">{error}</div>
                    </motion.div>
                ) : loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`
                            text-center p-8 rounded-xl shadow-lg mb-8
                            ${useAI ? 'bg-purple-50' : 'bg-blue-50'}
                        `}
                    >
                        <div className="text-xl font-medium mb-2 text-gray-800">
                            Analyzing article content...
                        </div>
                        <div className="text-sm text-gray-600">
                            Using {useAI ? 'AI-powered' : 'rule-based'} analysis to extract insights
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid gap-6"
                    >
                        {/* Summary Section */}
                        {(article?.summary || aiSummary) && (
                            <motion.div
                                key="summary"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`
                                    bg-white rounded-xl shadow-lg overflow-hidden
                                    transform transition-all duration-300 hover:shadow-xl
                                    ${useAI ? 'border-l-4 border-purple-500' : 'border-l-4 border-blue-500'}
                                `}
                            >
                                <button
                                    onClick={() => toggleSection('Summary')}
                                    className={`
                                        w-full p-6 flex justify-between items-center cursor-pointer
                                        ${useAI
                                            ? 'bg-gradient-to-r from-purple-50 to-white'
                                            : 'bg-gradient-to-r from-blue-50 to-white'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            p-3 rounded-lg
                                            ${useAI ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}
                                        `}>
                                            <FontAwesomeIcon
                                                icon={CATEGORY_ICONS.Summary}
                                                className="text-xl"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <Tooltip
                                                title={CATEGORY_DESCRIPTIONS.Summary}
                                                placement="top"
                                                arrow
                                            >
                                                <h3 className="text-lg font-semibold text-gray-800 cursor-help">
                                                    Summary
                                                </h3>
                                            </Tooltip>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            p-2 rounded-full transition-colors duration-200
                                            ${useAI ? 'text-purple-400' : 'text-blue-400'}
                                            ${useAI
                                                ? 'hover:bg-purple-50 hover:text-purple-600'
                                                : 'hover:bg-blue-50 hover:text-blue-600'
                                            }
                                        `}>
                                            <FontAwesomeIcon
                                                icon={collapsedSections.Summary ? faChevronDown : faChevronUp}
                                                className={`transform transition-transform duration-200 text-lg
                                                    ${collapsedSections.Summary ? '' : 'rotate-180'}
                                                `}
                                            />
                                        </div>
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {!collapsedSections.Summary && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="border-t border-gray-100"
                                        >
                                            <div className="p-6">
                                                {useAI && !aiSummary ? (
                                                    <div className="text-center py-6">
                                                        <button
                                                            onClick={generateSummary}
                                                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
                                                            disabled={summaryLoading}
                                                        >
                                                            {summaryLoading ? (
                                                                <span className="flex items-center gap-2">
                                                                    <FontAwesomeIcon icon={faSync} spin />
                                                                    Generating Summary...
                                                                </span>
                                                            ) : (
                                                                'Generate AI Summary'
                                                            )}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-700">
                                                        {useAI ? aiSummary || 'Failed to generate AI summary.' : article.summary}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* Insights Grid */}
                        {Object.keys(takeaways).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Object.entries(takeaways).map(([category, items]) => (
                                    items && items.length > 0 && (
                                        <motion.div
                                            key={category}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`
                                                bg-white rounded-xl shadow-lg overflow-hidden
                                                transform transition-all duration-300 hover:shadow-xl
                                                ${useAI ? 'border-l-4 border-purple-500' : 'border-l-4 border-blue-500'}
                                            `}
                                        >
                                            <button
                                                onClick={() => toggleSection(category)}
                                                className={`
                                                    w-full p-6 flex justify-between items-center cursor-pointer
                                                    ${useAI
                                                        ? 'bg-gradient-to-r from-purple-50 to-white'
                                                        : 'bg-gradient-to-r from-blue-50 to-white'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`
                                                        p-3 rounded-lg
                                                        ${useAI ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}
                                                    `}>
                                                        <FontAwesomeIcon
                                                            icon={CATEGORY_ICONS[category]}
                                                            className="text-xl"
                                                        />
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Tooltip
                                                            title={CATEGORY_DESCRIPTIONS[category]}
                                                            placement="top"
                                                            arrow
                                                        >
                                                            <h3 className="text-lg font-semibold text-gray-800 cursor-help">
                                                                {category}
                                                            </h3>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                                <div className={`
                                                    p-2 rounded-full transition-colors duration-200
                                                    ${useAI ? 'text-purple-400' : 'text-blue-400'}
                                                    ${useAI
                                                        ? 'hover:bg-purple-50 hover:text-purple-600'
                                                        : 'hover:bg-blue-50 hover:text-blue-600'
                                                    }
                                                `}>
                                                    <FontAwesomeIcon
                                                        icon={collapsedSections[category] ? faChevronDown : faChevronUp}
                                                        className={`transform transition-transform duration-200 text-lg
                                                            ${collapsedSections[category] ? '' : 'rotate-180'}
                                                        `}
                                                    />
                                                </div>
                                            </button>
                                            <AnimatePresence>
                                                {!collapsedSections[category] && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="border-t border-gray-100"
                                                    >
                                                        <div className="p-6">
                                                            <ul className="space-y-3">
                                                                {items.map((item, index) => (
                                                                    <li key={index} className="flex items-start">
                                                                        <span className={`mr-2 ${useAI ? 'text-purple-500' : 'text-blue-500'}`}>•</span>
                                                                        <p className="text-gray-700">{item}</p>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                No insights available.
                            </div>
                        )}

                        {/* Recommended Tags Section */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-semibold">
                                    {useAI ? "AI Recommended Tags" : "Suggested Tags"}
                                </h2>
                                {tagsLoading && (
                                    <FontAwesomeIcon icon={faSync} spin className="text-gray-500" />
                                )}
                            </div>
                            {recommendedTags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {recommendedTags.map((tag, index) => (
                                        <button
                                            key={index}
                                            // onClick={() => handleTagClick(tag)}
                                            className={`px-3 py-1 rounded-full text-sm hover:bg-opacity-80 transition-colors duration-200 cursor-pointer ${useAI
                                                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {!tagsLoading && recommendedTags.length === 0 && (
                                <p className="text-gray-500">No tags suggested for this article.</p>
                            )}
                        </div>

                        {/* Key Concepts Section */}
                        <motion.div
                            key="concepts"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`
                                mt-6 bg-white rounded-xl shadow-lg overflow-hidden
                                transform transition-all duration-300 hover:shadow-xl
                                ${useAI ? 'border-l-4 border-purple-500' : 'border-l-4 border-blue-500'}
                            `}
                        >
                            <button
                                onClick={() => toggleSection('Concepts')}
                                className={`
                                    w-full p-6 flex justify-between items-center cursor-pointer
                                    ${useAI
                                        ? 'bg-gradient-to-r from-purple-50 to-white'
                                        : 'bg-gradient-to-r from-blue-50 to-white'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        p-3 rounded-lg
                                        ${useAI ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}
                                    `}>
                                        <FontAwesomeIcon
                                            icon={CATEGORY_ICONS.Concepts}
                                            className="text-xl"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <Tooltip
                                            title={CATEGORY_DESCRIPTIONS.Concepts}
                                            placement="top"
                                            arrow
                                        >
                                            <h3 className="text-lg font-semibold text-gray-800 cursor-help">
                                                Key Concepts & Questions
                                            </h3>
                                        </Tooltip>
                                    </div>
                                </div>
                                <div className={`
                                    p-2 rounded-full transition-colors duration-200
                                    ${useAI ? 'text-purple-400' : 'text-blue-400'}
                                    ${useAI
                                        ? 'hover:bg-purple-50 hover:text-purple-600'
                                        : 'hover:bg-blue-50 hover:text-blue-600'
                                    }
                                `}>
                                    <FontAwesomeIcon
                                        icon={collapsedSections.Concepts ? faChevronDown : faChevronUp}
                                        className={`transform transition-transform duration-200 text-lg
                                            ${collapsedSections.Concepts ? '' : 'rotate-180'}
                                        `}
                                    />
                                </div>
                            </button>
                            <AnimatePresence>
                                {!collapsedSections.Concepts && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="border-t border-gray-100"
                                    >
                                        <div className="p-6">
                                            {!useAI ? (
                                                <div className="text-center py-6">
                                                    <p className="text-gray-600 mb-4">
                                                        Switch to AI mode to generate deep, thought-provoking questions about this article.
                                                    </p>
                                                    <button
                                                        onClick={toggleAI}
                                                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
                                                    >
                                                        Enable AI Mode
                                                    </button>
                                                </div>
                                            ) : conceptsLoading ? (
                                                <div className="animate-pulse space-y-3">
                                                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                                    <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                                                    <div className="h-4 bg-gray-100 rounded w-4/5"></div>
                                                </div>
                                            ) : conceptQuestions.length > 0 ? (
                                                <ul className="space-y-3">
                                                    {conceptQuestions.map((question, index) => (
                                                        <li key={index} className="flex items-start">
                                                            <span className={`mr-2 ${useAI ? 'text-purple-500' : 'text-blue-500'}`}>•</span>
                                                            <p className="text-gray-700">{question}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="text-center py-6">
                                                    <button
                                                        onClick={generateConcepts}
                                                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
                                                    >
                                                        Generate Concepts
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SummaryTab;
