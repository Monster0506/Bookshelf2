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

// Enhanced logger utility
const logger = {
  info: (message, data = {}) => {
    console.log(`[ActiveReading] 📘 ${message}`, data);
  },
  success: (message, data = {}) => {
    console.log(`[ActiveReading] ✅ ${message}`, data);
  },
  error: (message, error) => {
    console.error(`[ActiveReading] ❌ ${message}`, error);
  },
  warn: (message, data = {}) => {
    console.warn(`[ActiveReading] ⚠️ ${message}`, data);
  },
  debug: (message, data = {}) => {
    console.debug(`[ActiveReading] 🔍 ${message}`, {
      timestamp: new Date().toISOString(),
      ...data
    });
  }
};

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
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadHighlightsAndNotes = async () => {
      if (!articleId || !currentUser) {
        logger.warn('Missing articleId or user, skipping data load', { 
          articleId, 
          userId: currentUser?.uid,
          hasArticleId: !!articleId,
          hasUser: !!currentUser
        });
        return;
      }

      logger.info('Loading highlights and notes', { 
        articleId, 
        userId: currentUser.uid,
        timestamp: new Date().toISOString()
      });

      try {
        // Load highlights
        const highlightsQuery = query(
          collection(db, 'highlights'),
          where('articleId', '==', articleId),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'asc')
        );

        logger.debug('Executing highlights query', { 
          collection: 'highlights',
          filters: {
            articleId,
            userId: currentUser.uid
          }
        });

        const highlightsSnapshot = await getDocs(highlightsQuery);
        const loadedHighlights = highlightsSnapshot.docs.map(doc => {
          const data = doc.data();
          const highlight = {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          };
          logger.debug('Processed highlight', { highlight });
          return highlight;
        });

        logger.success('Highlights loaded successfully', { 
          count: loadedHighlights.length,
          highlights: loadedHighlights.map(h => ({
            id: h.id,
            text: h.text?.substring(0, 50) + '...',
            color: h.color
          }))
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

        logger.success('Notes loaded successfully', { 
          count: loadedNotes.length,
          notes: loadedNotes.map(note => ({
            id: note.id,
            text: note.text?.substring(0, 50) + '...'
          }))
        });

        setHighlights(loadedHighlights);
        setNotes(loadedNotes);
      } catch (error) {
        logger.error('Failed to load highlights and notes', {
          error,
          errorMessage: error.message,
          errorCode: error.code,
          articleId,
          userId: currentUser.uid
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadHighlightsAndNotes();
  }, [articleId, currentUser]);

  const addHighlight = useCallback(async (text, range, color = activeHighlightColor) => {
    if (!articleId || !currentUser) {
      logger.warn('Cannot add highlight: missing articleId or user', { articleId, userId: currentUser?.uid });
      return null;
    }

    logger.info('Adding new highlight', { 
      text: text.substring(0, 50) + '...',
      range,
      color 
    });

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
      logger.success('Highlight added successfully', { 
        highlightId: docRef.id,
        color,
        range
      });
      return docRef.id;
    } catch (error) {
      logger.error('Failed to add highlight', {
        error,
        text: text.substring(0, 50) + '...',
        range,
        color
      });
      return null;
    }
  }, [articleId, currentUser, activeHighlightColor]);

  const removeHighlight = useCallback(async (highlightId) => {
    if (!currentUser) {
      logger.warn('Cannot remove highlight: no user authenticated');
      return;
    }

    logger.info('Removing highlight', { highlightId });
    try {
      await deleteDoc(doc(db, 'highlights', highlightId));
      setHighlights(prev => prev.filter(h => h.id !== highlightId));
      logger.success('Highlight removed successfully', { highlightId });
    } catch (error) {
      logger.error('Failed to remove highlight', {
        error,
        highlightId,
        errorMessage: error.message
      });
    }
  }, [currentUser]);

  const addNote = useCallback(async (text, highlightId = null, color = null) => {
    if (!articleId || !currentUser) return null;

    try {
      const noteData = {
        text,
        highlightId,
        color: color || activeHighlightColor,
        articleId,
        userId: currentUser.uid,
        timestamp: new Date()
      };

      const docRef = await addDoc(collection(db, 'notes'), noteData);
      const newNote = { id: docRef.id, ...noteData };
      
      setNotes(prev => [...prev, newNote]);
      return docRef.id;
    } catch (error) {
      console.error('Error adding note:', error);
      return null;
    }
  }, [articleId, currentUser, activeHighlightColor]);

  const editNote = useCallback(async (noteId, newText) => {
    if (!currentUser) return;

    try {
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, { 
        text: newText,
        lastModified: new Date()
      });

      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, text: newText } : note
      ));
    } catch (error) {
      console.error('Error editing note:', error);
    }
  }, [currentUser]);

  const deleteNote = useCallback(async (noteId) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'notes', noteId));
      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }, [currentUser]);

  const value = {
    highlights,
    notes,
    activeHighlightColor,
    isHighlighting,
    isLoading,
    setActiveHighlightColor,
    setIsHighlighting,
    addHighlight,
    removeHighlight,
    addNote,
    editNote,
    deleteNote,
  };

  return (
    <ActiveReadingContext.Provider value={value}>
      {children}
    </ActiveReadingContext.Provider>
  );
};

export default ActiveReadingProvider;
