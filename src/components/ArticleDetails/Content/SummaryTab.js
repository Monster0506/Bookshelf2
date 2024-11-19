import React, { useState, useEffect } from 'react';
import { extractInsightsWithAI, generateAISummary } from '../../../utils/aiUtils';
import { extractKeyTakeaways } from '../../../utils/keyTakeaways';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faRobot, faBook, faChevronDown, faChevronUp, faFileAlt, faLightbulb, faMagic, faBrain } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_ICONS = {
    Summary: faFileAlt,
    Insights: faBrain,
};

const SummaryTab = ({ article }) => {
    const [takeaways, setTakeaways] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [useAI, setUseAI] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({});
    const [aiSummary, setAiSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);

    const toggleSection = (category) => {
        setCollapsedSections((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const generateSummary = async () => {
        if (!article?.plaintext) return;

        setSummaryLoading(true);
        try {
            const summary = await generateAISummary(article.plaintext);
            setAiSummary(summary);
        } catch (error) {
            console.error('Failed to generate AI summary:', error);
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        if (useAI && !aiSummary && article?.plaintext) {
            generateSummary();
        }
    }, [useAI, article?.plaintext]);

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
                    if (Object.keys(results).length === 0) {
                        results = extractKeyTakeaways(article.plaintext);
                    }
                } catch (error) {
                    results = extractKeyTakeaways(article.plaintext);
                }
            } else {
                results = extractKeyTakeaways(article.plaintext);
            }

            if (Object.keys(results).length === 0) {
                setError('No insights found in the article content.');
            } else {
                setTakeaways(results);
            }
        } catch (error) {
            setError('Failed to process article content');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        processTakeaways();
    }, [article?.plaintext, useAI]);

    const colorScheme = useAI
        ? 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-800'
        : 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <motion.button
                    onClick={() => !loading && setUseAI(!useAI)}
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
                                        <div>
                                            <h3 className="font-semibold text-xl text-gray-800">Summary</h3>
                                            {useAI && (
                                                <span className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                    <FontAwesomeIcon icon={faRobot} className="text-purple-400" />
                                                    AI Enhanced
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {summaryLoading && (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className={`text-lg ${useAI ? 'text-purple-500' : 'text-blue-500'}`}
                                            >
                                                <FontAwesomeIcon icon={faSync} />
                                            </motion.div>
                                        )}
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
                                                <p className="text-gray-700 leading-relaxed">
                                                    {useAI ? (
                                                        summaryLoading ? (
                                                            <span className="text-purple-500 italic flex items-center gap-2">
                                                                <FontAwesomeIcon icon={faSync} spin />
                                                                Generating AI summary...
                                                            </span>
                                                        ) : aiSummary || (
                                                            <span className="text-gray-500 italic">
                                                                Failed to generate AI summary. Showing original summary.
                                                            </span>
                                                        )
                                                    ) : article.summary}
                                                </p>
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
                                    <motion.div
                                        key={category}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`
                                            bg-white rounded-xl shadow-lg overflow-hidden
                                            transform transition-all duration-300 hover:shadow-xl
                                            ${useAI ? 'border-t-4 border-purple-500' : 'border-t-4 border-blue-500'}
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
                                                        icon={CATEGORY_ICONS[category] || faLightbulb}
                                                        className="text-xl"
                                                    />
                                                </div>
                                                <h3 className="font-semibold text-lg text-gray-800">{category}</h3>
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
                                                    <div className="p-6 grid gap-4">
                                                        {items.map((item, index) => (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: index * 0.1 }}
                                                                className={`
                                                                    p-4 rounded-lg bg-gray-50
                                                                    transform transition-all duration-200
                                                                    hover:shadow-md hover:-translate-y-0.5
                                                                    ${useAI 
                                                                        ? 'hover:bg-purple-50 border border-purple-100' 
                                                                        : 'hover:bg-blue-50 border border-blue-100'
                                                                    }
                                                                `}
                                                            >
                                                                <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </div>
                        ) : !article?.summary && (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`
                                    text-center p-8 rounded-xl shadow-lg
                                    ${useAI ? 'bg-purple-50' : 'bg-blue-50'}
                                `}
                            >
                                <div className="text-xl font-medium text-gray-800 mb-2">No insights found</div>
                                <div className="text-sm text-gray-600">
                                    Try switching to {useAI ? 'rule-based' : 'AI'} analysis
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SummaryTab;
