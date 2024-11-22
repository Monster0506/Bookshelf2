import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, 
    faVolumeUp, 
    faSpinner, 
    faGripVertical,
    faBook,
    faGlobe,
    faGraduationCap,
    faComments
} from '@fortawesome/free-solid-svg-icons';
import { 
    fetchDictionaryData,
    DICTIONARY_SOURCES
} from '../../utils/dictionaryUtils';
import Loading from '../Loading';

const sourceIcons = {
    [DICTIONARY_SOURCES.FREE_DICTIONARY]: { icon: faGlobe, label: 'Free Dictionary' },
    [DICTIONARY_SOURCES.WIKTIONARY]: { icon: faBook, label: 'Wiktionary' },
};

const DictionaryOverlay = ({ word: initialWord, context, position, onClose }) => {
    const dragControls = useDragControls();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [entry, setEntry] = useState(null);
    const [source, setSource] = useState(DICTIONARY_SOURCES.FREE_DICTIONARY);
    const [showSourceMenu, setShowSourceMenu] = useState(false);
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

    const toggleSourceMenu = () => {
        setShowSourceMenu(prev => !prev);
    };

    const selectSource = (newSource) => {
        setSource(newSource);
        setShowSourceMenu(false);
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
            className="fixed bg-white rounded-lg shadow-xl hover:shadow-2xl transition-shadow p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            style={{ 
                top: `${localPosition.y}px`,
                left: `${localPosition.x}px`,
                transform: 'translate(-50%, -100%)'
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 cursor-move" onPointerDown={(e) => dragControls.start(e)}>
                    <FontAwesomeIcon icon={faGripVertical} className="text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-800">{word}</h3>
                    {entry?.pronunciation && (
                        <button 
                            onClick={playPronunciation}
                            className="text-blue-500 hover:text-blue-600 transition"
                        >
                            <FontAwesomeIcon icon={faVolumeUp} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={toggleSourceMenu}
                            className="text-gray-500 hover:text-gray-600 px-3 py-2 rounded-md hover:bg-gray-200 transition"
                            title={sourceIcons[source].label}
                        >
                            <FontAwesomeIcon 
                                icon={sourceIcons[source].icon}
                                className="text-lg"
                            />
                        </button>
                        {showSourceMenu && (
                            <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20">
                                {Object.entries(sourceIcons).map(([key, { icon, label }]) => (
                                    <button
                                        key={key}
                                        onClick={() => selectSource(key)}
                                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                                            source === key ? 'text-blue-500' : 'text-gray-700'
                                        }`}
                                    >
                                        <FontAwesomeIcon icon={icon} className="w-4" />
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-600 transition"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            </div>
    
            {/* Content */}
            <div className="space-y-6">
                {loading ? (
                    <Loading boring loading="Loading..." />
                ) : error ? (
                    <div className="text-red-500 text-center py-6">{error}</div>
                ) : (
                    <>
                        {entry?.pronunciation && (
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Pronunciation</h4>
                                <p className="text-gray-600">{entry.pronunciation}</p>
                            </div>
                        )}
                        {entry?.difficulty && (
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Difficulty Level</h4>
                                <span className={`px-3 py-1 rounded text-sm ${
                                    entry.difficulty === 'basic' ? 'bg-green-100 text-green-800' :
                                    entry.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}
                                </span>
                            </div>
                        )}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Definitions</h4>
                            {Object.entries(entry?.definitions || {}).map(([category, defs], index) => (
                                defs.length > 0 && (
                                    <div key={index} className="mb-4">
                                        {category !== 'general' && (
                                            <h5 className="text-sm font-medium text-gray-600 mb-1 capitalize">
                                                {category.replace(/_/g, ' ')}
                                            </h5>
                                        )}
                                        <ul className="list-disc list-inside space-y-2">
                                            {defs.map((def, i) => (
                                                <li key={i} className="text-gray-700">{def}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )
                            ))}
                        </div>
                        {entry?.examples?.general?.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Examples</h4>
                                <ul className="list-disc list-inside space-y-2">
                                    {entry.examples.general.map((example, index) => (
                                        <li key={index} className="text-gray-600 italic">"{example}"</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="mt-8 text-sm text-gray-500">
                            Source: {sourceIcons[source]?.label}
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
    
};

export default DictionaryOverlay;
