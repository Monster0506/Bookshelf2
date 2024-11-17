import React, { useState, useEffect } from 'react';
import { processArticleContent } from '../../../utils/contentUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faRobot, 
    faBrain, 
    faSpinner,
    faFileAlt,
    faClock,
    faCalendarAlt,
    faBookmark,
    faTag,
    faLightbulb,
    faCode,
    faChartLine,
    faExclamationTriangle,
    faQuoteLeft,
    faList,
    faCheckSquare
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const getCategoryIcon = (category) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('key')) return faLightbulb;
    if (categoryLower.includes('code') || categoryLower.includes('technical')) return faCode;
    if (categoryLower.includes('insight') || categoryLower.includes('analysis')) return faChartLine;
    if (categoryLower.includes('warning') || categoryLower.includes('caution')) return faExclamationTriangle;
    if (categoryLower.includes('quote') || categoryLower.includes('reference')) return faQuoteLeft;
    if (categoryLower.includes('action') || categoryLower.includes('todo')) return faCheckSquare;
    return faList;
};

const getCategoryColor = (category) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('key')) return 'bg-blue-50 border-blue-200';
    if (categoryLower.includes('code') || categoryLower.includes('technical')) return 'bg-purple-50 border-purple-200';
    if (categoryLower.includes('insight') || categoryLower.includes('analysis')) return 'bg-green-50 border-green-200';
    if (categoryLower.includes('warning') || categoryLower.includes('caution')) return 'bg-yellow-50 border-yellow-200';
    if (categoryLower.includes('quote') || categoryLower.includes('reference')) return 'bg-indigo-50 border-indigo-200';
    if (categoryLower.includes('action') || categoryLower.includes('todo')) return 'bg-pink-50 border-pink-200';
    return 'bg-gray-50 border-gray-200';
};

const getCategoryTextColor = (category) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('key')) return 'text-blue-700';
    if (categoryLower.includes('code') || categoryLower.includes('technical')) return 'text-purple-700';
    if (categoryLower.includes('insight') || categoryLower.includes('analysis')) return 'text-green-700';
    if (categoryLower.includes('warning') || categoryLower.includes('caution')) return 'text-yellow-700';
    if (categoryLower.includes('quote') || categoryLower.includes('reference')) return 'text-indigo-700';
    if (categoryLower.includes('action') || categoryLower.includes('todo')) return 'text-pink-700';
    return 'text-gray-700';
};

const SummaryItem = ({ icon, label, value }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        <div className="text-blue-500 text-xl">
            <FontAwesomeIcon icon={icon} />
        </div>
        <div>
            <p className="text-gray-600 text-sm">{label}</p>
            <p className="font-semibold text-gray-800">{value}</p>
        </div>
    </div>
);

const SummaryTab = ({ article, status, tags, createdAt }) => {
    const [ruleBasedTakeaways, setRuleBasedTakeaways] = useState(null);
    const [aiTakeaways, setAiTakeaways] = useState(null);
    const [currentTakeaways, setCurrentTakeaways] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [useAI, setUseAI] = useState(false); // Default to rule-based
    const readingTime = Math.ceil((article?.plaintext?.length || 0) / 1000);

    const loadKeyTakeaways = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load rule-based takeaways first
            const ruleBasedContent = await processArticleContent(article.plaintext, false);
            setRuleBasedTakeaways(ruleBasedContent.keyTakeaways);
            setCurrentTakeaways(ruleBasedContent.keyTakeaways);

            // Load AI takeaways in the background if not already loaded
            if (!aiTakeaways) {
                const aiContent = await processArticleContent(article.plaintext, true);
                setAiTakeaways(aiContent.keyTakeaways);
            }
        } catch (err) {
            console.error('Error loading takeaways:', err);
            setError('Failed to extract takeaways. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (article?.plaintext) {
            loadKeyTakeaways();
        }
    }, [article]); // Only reload when article changes

    const toggleAI = () => {
        const newUseAI = !useAI;
        setUseAI(newUseAI);
        setCurrentTakeaways(newUseAI ? aiTakeaways : ruleBasedTakeaways);
    };

    if (loading && !currentTakeaways) { // Only show loading on initial load
        return (
            <div className="flex items-center justify-center p-4">
                <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-gray-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 p-4">
                {error}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 space-y-6"
        >
            <div className="grid gap-4 md:grid-cols-2">
                <SummaryItem
                    icon={faFileAlt}
                    label="Word Count"
                    value={article?.plaintext ? Math.ceil(article.plaintext.split(/\s+/).length) : 0}
                />
                <SummaryItem
                    icon={faClock}
                    label="Estimated Reading Time"
                    value={`${readingTime} minute${readingTime !== 1 ? 's' : ''}`}
                />
                <SummaryItem
                    icon={faCalendarAlt}
                    label="Created"
                    value={createdAt ? format(new Date(createdAt.seconds * 1000), "PPp") : 'N/A'}
                />
                <SummaryItem
                    icon={faBookmark}
                    label="Status"
                    value={status || 'Unread'}
                />
            </div>

            {tags && tags.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <FontAwesomeIcon icon={faTag} className="mr-2 text-blue-500" />
                        Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {article?.summary && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <FontAwesomeIcon icon={faFileAlt} className="mr-2 text-blue-500" />
                        Summary
                    </h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                        {article.summary}
                    </p>
                </div>
            )}

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                        <FontAwesomeIcon icon={faLightbulb} className="mr-2 text-blue-500" />
                        Key Takeaways
                    </h3>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleAI}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            useAI 
                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                    >
                        <FontAwesomeIcon icon={useAI ? faRobot : faBrain} />
                        {useAI ? 'AI-Powered' : 'Rule-Based'}
                    </motion.button>
                </div>

                {currentTakeaways && Object.keys(currentTakeaways).length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {Object.entries(currentTakeaways).map(([category, items]) => (
                            items && items.length > 0 && (
                                <motion.div
                                    key={category}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`rounded-lg border p-4 shadow-sm ${getCategoryColor(category)}`}
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <FontAwesomeIcon 
                                            icon={getCategoryIcon(category)} 
                                            className={`text-lg ${getCategoryTextColor(category)}`}
                                        />
                                        <h3 className={`text-lg font-medium ${getCategoryTextColor(category)}`}>
                                            {category}
                                        </h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {items.map((item, index) => (
                                            <motion.li
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className={`flex items-start gap-2 ${getCategoryTextColor(category)}`}
                                            >
                                                <span className="mt-1.5">•</span>
                                                <span className="flex-1">{item}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-gray-500 text-center p-4">
                        No takeaways found. Try adjusting the content or switching extraction method.
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default SummaryTab;
