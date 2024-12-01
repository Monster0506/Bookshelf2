import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHighlighter, FaTimes, FaEdit, FaStickyNote, FaBook, FaEye, 
  FaVolumeUp, FaVolumeMute, FaPlay, FaPause
} from 'react-icons/fa';
import { useActiveReading } from './ActiveReadingProvider';
import Tooltip from '../../common/Tooltip';

const HIGHLIGHT_COLORS = {
  yellow: { bg: 'bg-yellow-200', text: 'text-yellow-800', border: 'border-yellow-300' },
  green: { bg: 'bg-green-200', text: 'text-green-800', border: 'border-green-300' },
  blue: { bg: 'bg-blue-200', text: 'text-blue-800', border: 'border-blue-300' },
  purple: { bg: 'bg-purple-200', text: 'text-purple-800', border: 'border-purple-300' },
  red: { bg: 'bg-red-200', text: 'text-red-800', border: 'border-red-300' },
};

const TTSPopup = ({ isOpen, onClose, settings, onSettingsChange, isSpeaking, isPaused, onPlayPause, onStop }) => {
  const [voices, setVoices] = useState([]);
  
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-72"
        >
          {isSpeaking && (
            <div className="flex items-center justify-center space-x-2 mb-4 pb-4 border-b border-gray-200">
              <button
                onClick={onPlayPause}
                className="px-4 py-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors flex items-center space-x-2"
              >
                {isPaused ? <><FaPlay /> <span>Resume</span></> : <><FaPause /> <span>Pause</span></>}
              </button>
              <button
                onClick={onStop}
                className="px-4 py-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors flex items-center space-x-2"
              >
                <FaVolumeMute />
                <span>Stop</span>
              </button>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
              <select
                value={settings.voice}
                onChange={(e) => onSettingsChange({ voice: e.target.value })}
                className="w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm"
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.rate}
                  onChange={(e) => onSettingsChange({ rate: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">{settings.rate}x</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pitch</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.pitch}
                  onChange={(e) => onSettingsChange({ pitch: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">{settings.pitch}x</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const HighlightManager = ({
  activeHighlightColor,
  setActiveHighlightColor,
  isHighlighting,
  setIsHighlighting,
  onAddNote,
  onLookupWord,
  highlightsLoading
}) => {
  const [showTTSPopup, setShowTTSPopup] = useState(false);
  const [ttsSettings, setTTSSettings] = useState({
    voice: '',
    rate: 1,
    pitch: 1
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const { isFocusMode, toggleFocusMode } = useActiveReading();
  
  const speechSynthRef = useRef(window.speechSynthesis);
  const currentUtteranceRef = useRef(null);

  const handleColorSelect = useCallback((color) => {
    setActiveHighlightColor(color);
    setIsHighlighting(true);
  }, [setActiveHighlightColor, setIsHighlighting]);

  const handleDictionaryClick = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.split(/\s+/).length === 1) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      onLookupWord(selectedText, {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY
      });
    }
  }, [onLookupWord]);

  const handleTTSSettings = useCallback((newSettings) => {
    setTTSSettings(prev => ({ ...prev, ...newSettings }));
    
    if (currentUtteranceRef.current) {
      const utterance = currentUtteranceRef.current;
      if (newSettings.rate !== undefined) utterance.rate = newSettings.rate;
      if (newSettings.pitch !== undefined) utterance.pitch = newSettings.pitch;
      if (newSettings.voice !== undefined) {
        const voice = speechSynthesis.getVoices().find(v => v.name === newSettings.voice);
        if (voice) utterance.voice = voice;
      }
    }
  }, []);

  const handleTTS = useCallback(() => {
    if (!voicesLoaded) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (isSpeaking) {
      if (isPaused) {
        speechSynthRef.current.resume();
        setIsPaused(false);
      } else {
        speechSynthRef.current.pause();
        setIsPaused(true);
      }
      return;
    }

    if (selectedText) {
      const utterance = new SpeechSynthesisUtterance(selectedText);
      utterance.rate = ttsSettings.rate;
      utterance.pitch = ttsSettings.pitch;
      
      if (ttsSettings.voice) {
        const voice = speechSynthesis.getVoices().find(v => v.name === ttsSettings.voice);
        if (voice) utterance.voice = voice;
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
      };

      currentUtteranceRef.current = utterance;
      setIsSpeaking(true);
      speechSynthRef.current.speak(utterance);
    }
  }, [isSpeaking, isPaused, ttsSettings, voicesLoaded]);

  const stopTTS = useCallback(() => {
    speechSynthRef.current.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    currentUtteranceRef.current = null;
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadTTSVoices = async () => {
      if (typeof speechSynthesis !== 'undefined') {
        const loadVoices = () => {
          const voices = speechSynthesis.getVoices();
          if (voices.length > 0) {
            if (mounted) {
              setTTSSettings(prev => ({
                ...prev,
                voice: voices[0].name
              }));
              setVoicesLoaded(true);
            }
            speechSynthesis.onvoiceschanged = null;
          }
        };

        if (speechSynthesis.getVoices().length > 0) {
          loadVoices();
        } else {
          speechSynthesis.onvoiceschanged = loadVoices;
        }
      }
    };

    loadTTSVoices();
    return () => {
      mounted = false;
      if (typeof speechSynthesis !== 'undefined') {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  if (highlightsLoading || !voicesLoaded) {
    return null;
  }

  return (
    <motion.div 
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg border border-gray-200 p-2 z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
    >
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsHighlighting(!isHighlighting)}
          className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
            isHighlighting ? `${HIGHLIGHT_COLORS[activeHighlightColor].bg} ${HIGHLIGHT_COLORS[activeHighlightColor].text}` : ''
          }`}
          title="Highlight Text"
        >
          <FaHighlighter />
        </button>

        <div className="relative">
          <Tooltip
            title="Text-to-Speech"
            content={
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 whitespace-nowrap">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">Click</kbd>
                </div>
                <span>{isSpeaking ? (isPaused ? "Resume speaking" : "Pause speaking") : "Start speaking selected text"}</span>

                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">Right-click</kbd>
                </div>
                <span>Open TTS settings</span>

                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">Long press</kbd>
                </div>
                <span>Open TTS settings</span>
              </div>
            }
          >
            <button
              onClick={handleTTS}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowTTSPopup(!showTTSPopup);
              }}
              onMouseDown={(e) => {
                if (e.button === 0) { // Left click
                  const timer = setTimeout(() => {
                    setShowTTSPopup(!showTTSPopup);
                  }, 500);
                  e.currentTarget.dataset.longPressTimer = timer;
                }
              }}
              onMouseUp={(e) => {
                if (e.button === 0) {
                  const timer = e.currentTarget.dataset.longPressTimer;
                  if (timer) clearTimeout(timer);
                }
              }}
              onMouseLeave={(e) => {
                const timer = e.currentTarget.dataset.longPressTimer;
                if (timer) clearTimeout(timer);
              }}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors
                         ${isSpeaking || showTTSPopup ? 'text-blue-500 bg-blue-50' : ''}`}
            >
              {isSpeaking ? (isPaused ? <FaPlay /> : <FaPause />) : <FaVolumeUp />}
            </button>
          </Tooltip>
          
          <TTSPopup
            isOpen={showTTSPopup}
            onClose={() => setShowTTSPopup(false)}
            settings={ttsSettings}
            onSettingsChange={handleTTSSettings}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            onPlayPause={handleTTS}
            onStop={stopTTS}
          />
        </div>

        <button
          onClick={handleDictionaryClick}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Look up in Dictionary"
        >
          <FaBook />
        </button>

        <button
          onClick={onAddNote}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Add Marginal Note"
        >
          <FaStickyNote />
        </button>

        <Tooltip 
          title="Spotlight Mode"
          content={
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 whitespace-nowrap">
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">↑</kbd>
                <span className="text-gray-400">/</span>
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">k</kbd>
              </div>
              <span>Previous paragraph</span>

              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">↓</kbd>
                <span className="text-gray-400">/</span>
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">j</kbd>
              </div>
              <span>Next paragraph</span>

              <div className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">b</kbd>
              </div>
              <span>Toggle bookmark</span>

              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">v</kbd>
                <span className="text-gray-400">/</span>
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">n</kbd>
              </div>
              <span>Previous/Next bookmark</span>

              <div className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">z</kbd>
              </div>
              <span>Toggle zoom</span>

              <div className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">t</kbd>
              </div>
              <span>Toggle typewriter mode</span>

              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">[</kbd>
                <span className="text-gray-400">/</span>
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">]</kbd>
              </div>
              <span>Adjust spotlight</span>

              <div className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">c</kbd>
              </div>
              <span>Change accent color</span>
            </div>
          }
          className="min-w-[240px]"
        >
          <motion.button
            className={`p-2 rounded-full hover:bg-gray-100 relative ${isFocusMode ? 'bg-purple-100' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFocusMode();
              document.activeElement.blur();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaEye className={`w-5 h-5 ${isFocusMode ? 'text-purple-600' : 'text-gray-600'}`} />
          </motion.button>
        </Tooltip>

        {isHighlighting && (
          <button
            onClick={() => setIsHighlighting(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            title="Cancel Highlighting"
          >
            <FaTimes />
          </button>
        )}

        <AnimatePresence>
          {showTTSPopup && (
            <motion.div 
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex space-x-2">
                {Object.entries(HIGHLIGHT_COLORS).map(([color, styles]) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-6 h-6 rounded-full ${styles.bg} ${styles.border} border-2 hover:scale-110 transition-transform`}
                    title={`${color.charAt(0).toUpperCase() + color.slice(1)} Highlight`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default HighlightManager;
