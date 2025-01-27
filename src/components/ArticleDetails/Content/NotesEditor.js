// NotesEditor.js
import React, { useState, useCallback, useEffect, useRef } from "react";
import MdEditor from "react-markdown-editor-lite";
import ReactMarkdown from "react-markdown";
import debounce from "lodash.debounce";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import "react-markdown-editor-lite/lib/index.css";
import { fetchAllArticles } from "../../../utils/firestoreUtils";
import ArticleLinks from './ArticleLinks';
import Loading from "../../Loading";

function NotesEditor({ 
  notes, 
  setNotes, 
  saveNotes, 
  canEdit = true,
  saving,
  articleId,
  articleTitle
}) {
  // Initialize with empty string and ensure proper conversion of notes
  const [editorValue, setEditorValue] = useState(() => {
    if (!notes) return '';
    if (typeof notes === 'string') return notes;
    if (Array.isArray(notes)) {
      // Combine notes array into a single string
      return notes.map(note => note.content || '').join('\n\n');
    }
    return '';
  });
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [editorHeight, setEditorHeight] = useState("300px");
  const [showArticlePicker, setShowArticlePicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editorRef = useRef(null);
  const [stats, setStats] = useState({
    paragraphs: 0,
    sentences: 0,
    lines: 0,
    readingTime: 0,
    headings: 0,
    links: 0
  });
  const [outgoingLinks, setOutgoingLinks] = useState([]);

  // Initialize editor value when notes prop changes
  useEffect(() => {
    const processNotes = () => {
      if (!notes) return '';
      if (typeof notes === 'string') return notes;
      if (Array.isArray(notes)) {
        // Combine notes array into a single string
        return notes.map(note => note.content || '').join('\n\n');
      }
      return '';
    };
    setEditorValue(processNotes());
  }, [notes]);

  // Fetch articles on component mount
  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      try {
        const fetchedArticles = await fetchAllArticles();
        setArticles(fetchedArticles);
      } catch (error) {
        console.error('Error loading articles:', error);
      } finally {
        setLoading(false);
      }
    };
    loadArticles();
  }, []);

  // Create memoized debounced save function
  const debouncedSaveNotes = useCallback(
    debounce((text) => {
      saveNotes(text);
      setHasUnsavedChanges(false);
    }, 1000),
    [] // Empty dependency array since saveNotes is stable
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSaveNotes.cancel();
    };
  }, [debouncedSaveNotes]);

  // Calculate detailed stats
  useEffect(() => {
    const calculateStats = () => {
      const currentValue = String(editorValue || '');
      const words = currentValue.trim().split(/\s+/).filter(word => word.length > 0);
      const chars = currentValue.length;
      const paragraphs = currentValue.split(/\n\s*\n/).filter(para => para.trim().length > 0);
      const sentences = currentValue.split(/[.!?]+\s/).filter(sent => sent.trim().length > 0);
      const lines = currentValue.split('\n').filter(line => line.trim().length > 0);
      const headings = (currentValue.match(/^#{1,6}\s/gm) || []).length;
      const links = (currentValue.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
      
      setWordCount(words.length);
      setCharCount(chars);
      setStats({
        paragraphs: paragraphs.length,
        sentences: sentences.length,
        lines: lines.length,
        readingTime: Math.ceil(words.length / 200),
        headings,
        links
      });
    };

    calculateStats();
  }, [editorValue]);

  // Extract outgoing links from notes
  useEffect(() => {
    const extractLinks = () => {
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const links = new Set();
      let match;
      const currentValue = String(editorValue || '');
      
      while ((match = linkRegex.exec(currentValue)) !== null) {
        const [, title, id] = match;
        links.add(id);
      }
      
      setOutgoingLinks(Array.from(links));
    };

    if (articles.length > 0) {
      extractLinks();
    }
  }, [editorValue, articles]);

  // Custom link renderer for internal article links
  const linkRenderer = ({ href, children }) => {
    const isInternalLink = href.startsWith("@article:");
    if (isInternalLink) {
      const articleId = href.replace("@article:", "");
      const linkedArticle = articles.find(a => a.id === articleId);
      if (linkedArticle) {
        return (
          <a
            href={`/articles/${articleId}`}
            className="text-blue-600 hover:text-blue-800 underline"
            title={linkedArticle.title}
          >
            {children}
          </a>
        );
      }
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {children}
      </a>
    );
  };

  // Handle editor change
  const handleEditorChange = ({ text }) => {
    setEditorValue(text);
    setNotes(text); // Always set as string since we save as string in Firestore
    setHasUnsavedChanges(true);
    debouncedSaveNotes(text);
  };

  const handleImageUpload = async (file) => {
    // TODO: Implement image upload functionality
    return "https://via.placeholder.com/150";
  };

  // Filter articles based on search term
  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleArticleSelect = (article) => {
    const linkText = `[${article.title}](@article:${article.id})`;
    if (editorRef.current) {
      editorRef.current.insertText(linkText);
    }
    setShowArticlePicker(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Notes</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowArticlePicker(true)}
            className="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors duration-200"
          >
            Link Article
          </button>
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors duration-200"
          >
            {showStats ? "Hide Stats" : "Show Stats"}
          </button>
          <button
            onClick={() => setEditorHeight(editorHeight === "300px" ? "600px" : "300px")}
            className="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors duration-200"
          >
            {editorHeight === "300px" ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      {showArticlePicker && (
        <div className="absolute z-50 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Link Article</h3>
            <button
              onClick={() => setShowArticlePicker(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          />
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
            <Loading loading={"Loading Articles..."} boring />
            ) : (
              <>
                {filteredArticles.map(article => (
                  <button
                    key={article.id}
                    onClick={() => handleArticleSelect(article)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md transition-colors duration-150 text-sm truncate"
                    title={article.title}
                  >
                    {article.title}
                  </button>
                ))}
                {filteredArticles.length === 0 && (
                  <div className="text-gray-500 text-sm text-center py-2">
                    No articles found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showStats && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatBox 
              label="Words" 
              value={wordCount}
              icon={<span role="img" aria-label="words">📝</span>}
            />
            <StatBox 
              label="Characters" 
              value={charCount}
              icon={<span role="img" aria-label="characters">📊</span>}
            />
            <StatBox 
              label="Paragraphs" 
              value={stats.paragraphs}
              icon={<span role="img" aria-label="paragraphs">📋</span>}
            />
            <StatBox 
              label="Sentences" 
              value={stats.sentences}
              icon={<span role="img" aria-label="sentences">📜</span>}
            />
            <StatBox 
              label="Lines" 
              value={stats.lines}
              icon={<span role="img" aria-label="lines">📏</span>}
            />
            <StatBox 
              label="Reading Time" 
              value={`${stats.readingTime} min`}
              icon={<span role="img" aria-label="reading time">⏱️</span>}
            />
            <StatBox 
              label="Headings" 
              value={stats.headings}
              icon={<span role="img" aria-label="headings">📌</span>}
            />
            <StatBox 
              label="Links" 
              value={stats.links}
              icon={<span role="img" aria-label="links">🔗</span>}
            />
          </div>
        </div>
      )}

      <MdEditor
        ref={editorRef}
        value={editorValue}
        style={{ height: editorHeight }}
        renderHTML={text => (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
            components={{ a: linkRenderer }}
          >
            {text || ''}
          </ReactMarkdown>
        )}
        onChange={handleEditorChange}
        readOnly={!canEdit}
        onImageUpload={handleImageUpload}
        className="border rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
      />

      <div className="flex justify-between items-center text-sm mt-4">
        {saving ? (
          <div className="flex items-center">
            <Loading loading="Saving..." />
          </div>
        ) : hasUnsavedChanges ? (
          <span className="text-yellow-600">Unsaved changes</span>
        ) : (
          <span className="text-green-600">Saved</span>
        )}
      </div>

      <ArticleLinks 
        currentArticle={{ id: articleId, title: articleTitle }}
        outgoingLinks={outgoingLinks}
      />
    </div>
  );
}

const StatBox = ({ label, value, icon }) => (
  <div className="flex items-center bg-white p-2 rounded-lg shadow-sm border border-gray-100">
    <div className="text-gray-500 mr-2">{icon}</div>
    <div>
      <div className="text-lg font-semibold text-gray-700">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  </div>
);

export default NotesEditor;
