import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, 
    faVolumeUp, 
    faSpinner, 
    faGripVertical,
    faBook,
    faGlobe
} from '@fortawesome/free-solid-svg-icons';
import { 
    fetchDictionaryData,
    DICTIONARY_SOURCES
} from '../../utils/dictionaryUtils';

const DictionaryOverlay = ({ word: initialWord, context, position, onClose }) => {
    const dragControls = useDragControls();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [entry, setEntry] = useState(null);
    const [source, setSource] = useState(DICTIONARY_SOURCES.FREE_DICTIONARY);
    const [localPosition, setLocalPosition] = useState({
        x: Math.min(position.x, window.innerWidth - 200),
        y: Math.min(position.y, window.innerHeight - 100)
    });

    // Clean up the word by trimming and preserving case for proper nouns
    const word = initialWord.trim();

    useEffect(() => {
        const fetchWord = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await fetchDictionaryData(word, source);
                if (data) {
                    setEntry(data);
                } else {
                    setError('Word not found');
                }
            } catch (error) {
                console.error('Error fetching word:', error);
                setError('Failed to fetch word definition');
            } finally {
                setLoading(false);
            }
        };

        fetchWord();
    }, [word, source]);

    const toggleSource = () => {
        setSource(prev => 
            prev === DICTIONARY_SOURCES.FREE_DICTIONARY 
                ? DICTIONARY_SOURCES.WIKTIONARY 
                : DICTIONARY_SOURCES.FREE_DICTIONARY
        );
    };

    const playPronunciation = () => {
        if (entry?.pronunciation) {
            const utterance = new SpeechSynthesisUtterance(word);
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragMomentum={false}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bg-white rounded-lg shadow-xl p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
            style={{ 
                top: `${localPosition.y}px`,
                left: `${localPosition.x}px`,
                transform: 'translate(-25%, -25%)'
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3 cursor-move" onPointerDown={(e) => dragControls.start(e)}>
                    <FontAwesomeIcon icon={faGripVertical} className="text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-800">{word}</h3>
                    {entry?.pronunciation && (
                        <button 
                            onClick={playPronunciation}
                            className="text-blue-500 hover:text-blue-600"
                        >
                            <FontAwesomeIcon icon={faVolumeUp} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleSource}
                        className="text-gray-500 hover:text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100"
                        title={source === DICTIONARY_SOURCES.FREE_DICTIONARY ? 'Switch to Wiktionary' : 'Switch to Free Dictionary'}
                    >
                        <FontAwesomeIcon 
                            icon={source === DICTIONARY_SOURCES.FREE_DICTIONARY ? faGlobe : faBook} 
                            className="text-sm"
                        />
                    </button>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-600"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-blue-500" />
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-center py-4">{error}</div>
                ) : (
                    <>
                        {/* Definitions */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Definitions</h4>
                            <ul className="space-y-2">
                                {entry?.definitions?.general.map((def, index) => (
                                    <li key={index} className="text-gray-600">
                                        {index + 1}. {def}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Examples */}
                        {entry?.examples?.general.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Examples</h4>
                                <ul className="space-y-2">
                                    {entry.examples.general.map((example, index) => (
                                        <li key={index} className="text-gray-600 italic">
                                            "{example}"
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Context */}
                        {context && (
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">From Your Text</h4>
                                <p className="text-gray-600 italic">"{context}"</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default DictionaryOverlay;
