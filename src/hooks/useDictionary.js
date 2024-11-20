import { useState, useCallback, useEffect } from 'react';

const useDictionary = () => {
    const [selectedWord, setSelectedWord] = useState(null);
    const [wordContext, setWordContext] = useState('');
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const getWordContext = (text, word, contextLength = 100) => {
        const wordIndex = text.toLowerCase().indexOf(word.toLowerCase());
        if (wordIndex === -1) return '';

        const start = Math.max(0, wordIndex - contextLength);
        const end = Math.min(text.length, wordIndex + word.length + contextLength);
        let context = text.slice(start, end);

        // Add ellipsis if we're not at the start/end
        if (start > 0) context = '...' + context;
        if (end < text.length) context = context + '...';

        return context;
    };

    const handleTextSelection = useCallback((event) => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText && selectedText.split(/\s+/).length === 1) {
            // Get the selection coordinates
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Get surrounding context
            const paragraph = range.startContainer.parentElement;
            const context = getWordContext(paragraph.textContent, selectedText);

            setSelectedWord(selectedText);
            setWordContext(context);
            setPosition({
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY
            });
        } else {
            setSelectedWord(null);
        }
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedWord(null);
        setWordContext('');
    }, []);

    useEffect(() => {
        document.addEventListener('mouseup', handleTextSelection);
        return () => {
            document.removeEventListener('mouseup', handleTextSelection);
        };
    }, [handleTextSelection]);

    return {
        selectedWord,
        wordContext,
        position,
        clearSelection
    };
};

export default useDictionary;
