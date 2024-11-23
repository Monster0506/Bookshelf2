import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../firebaseConfig';
import { 
  doc, 
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import DictionaryOverlay from '../../Dictionary/DictionaryOverlay';

const ActiveReadingContext = createContext();

export const useActiveReading = () => {
  const context = useContext(ActiveReadingContext);
  if (!context) {
    throw new Error('useActiveReading must be used within an ActiveReadingProvider');
  }
  return context;
};

export const ActiveReadingProvider = ({ children, articleId }) => {
  const [highlights, setHighlights] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeHighlightColor, setActiveHighlightColor] = useState('yellow');
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordPosition, setWordPosition] = useState(null);
  const [error, setError] = useState(null);
  const [focusedParagraph, setFocusedParagraph] = useState(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadHighlightsAndNotes = async () => {
      if (!articleId || !currentUser) {
        return;
      }

      try {
        // Load highlights
        const highlightsQuery = query(
          collection(db, 'highlights'),
          where('articleId', '==', articleId),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'asc')
        );

      

        const highlightsSnapshot = await getDocs(highlightsQuery);
        const loadedHighlights = highlightsSnapshot.docs.map(doc => {
          const data = doc.data();
          const highlight = {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          };
          return highlight;
        });



        // Load notes
        const notesQuery = query(
          collection(db, 'notes'),
          where('articleId', '==', articleId),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'asc')
        );
        const notesSnapshot = await getDocs(notesQuery);
        const loadedNotes = notesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));



        setHighlights(loadedHighlights);
        setNotes(loadedNotes);
      } catch (error) {

        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHighlightsAndNotes();
  }, [articleId, currentUser]);

  const addHighlight = useCallback(async (text, range, color = activeHighlightColor) => {
    if (!articleId || !currentUser) {
      return null;
    }



    try {
      const highlightData = {
        text,
        range,
        color,
        articleId,
        userId: currentUser.uid,
        timestamp: new Date()
      };

      const docRef = await addDoc(collection(db, 'highlights'), highlightData);
      const newHighlight = { id: docRef.id, ...highlightData };
      
      setHighlights(prev => [...prev, newHighlight]);

      return docRef.id;
    } catch (error) {

      setError(error);
      return null;
    }
  }, [articleId, currentUser, activeHighlightColor]);

  const removeHighlight = useCallback(async (highlightId) => {
    if (!currentUser) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'highlights', highlightId));
      setHighlights(prev => prev.filter(h => h.id !== highlightId));
    } catch (error) {
      setError(error);
    }
  }, [currentUser]);

  const addNote = useCallback(async (text, highlightId = null, category = 'GENERAL', image = null, links = []) => {
    if (!articleId || !currentUser) {
      return null;
    }


    try {
      const noteData = {
        text,
        highlightId,
        category,
        image,
        links,
        articleId,
        userId: currentUser.uid,
        timestamp: new Date()
      };

      const docRef = await addDoc(collection(db, 'notes'), noteData);
      const newNote = { id: docRef.id, ...noteData };
      
      setNotes(prev => [...prev, newNote]);
      return docRef.id;
    } catch (error) {
      setError(error);
      return null;
    }
  }, [articleId, currentUser]);

  const editNote = useCallback(async (noteId, noteData) => {
    if (!currentUser) {
      return;
    }

    

    try {
      const noteRef = doc(db, 'notes', noteId);
      const updates = {
        ...noteData,
        lastModified: new Date()
      };
      
      await updateDoc(noteRef, updates);

      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, ...updates } : note
      ));
      
    } catch (error) {
      
      setError(error);
    }
  }, [currentUser]);

  const deleteNote = useCallback(async (noteId) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'notes', noteId));
      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      setError(error);
    }
  }, [currentUser]);

  const handleLookupWord = useCallback((word, position) => {
    setSelectedWord(word);
    setWordPosition(position);
  }, []);

  const handleCloseDictionary = useCallback(() => {
    setSelectedWord(null);
    setWordPosition(null);
  }, []);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => {
      if (!prev) {
        // When entering focus mode, don't focus any paragraph yet
        setFocusedParagraph(null);
        return true;
      } else {
        // When exiting focus mode, clear the focused paragraph
        setFocusedParagraph(null);
        return false;
      }
    });
  }, []);

  const focusOnParagraph = useCallback((paragraphElement) => {
    if (!isFocusMode) return;
    
    // Store both the element and its index for proper focusing
    const paragraphs = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6'));
    const index = paragraphs.indexOf(paragraphElement);
    
    setFocusedParagraph({
      element: paragraphElement,
      index: index
    });
  }, [isFocusMode]);

  const clearFocus = useCallback(() => {
    setFocusedParagraph(null);
  }, []);

  const value = {
    highlights,
    notes,
    activeHighlightColor,
    isHighlighting,
    selectedWord,
    wordPosition,
    error,
    isLoading,
    isFocusMode,
    focusedParagraph,
    setActiveHighlightColor,
    setIsHighlighting,
    addHighlight,
    removeHighlight,
    addNote,
    editNote,
    deleteNote,
    onLookupWord: handleLookupWord,
    toggleFocusMode,
    focusOnParagraph,
    clearFocus
  };

  return (
    <ActiveReadingContext.Provider value={value}>
      {children}
      {selectedWord && wordPosition && (
        <DictionaryOverlay
          word={selectedWord}
          position={wordPosition}
          onClose={() => {
            setSelectedWord(null);
            setWordPosition(null);
          }}
        />
      )}
    </ActiveReadingContext.Provider>
  );
};

export default ActiveReadingProvider;
