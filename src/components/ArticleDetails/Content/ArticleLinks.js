import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { findBacklinks } from '../../../utils/firestoreUtils';

const ArticleLinks = ({ currentArticle, outgoingLinks }) => {
  const [backlinks, setBacklinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBacklinks = async () => {
      try {
        const links = await findBacklinks(currentArticle.id);
        setBacklinks(links);
      } catch (error) {
        console.error('Error loading backlinks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBacklinks();
  }, [currentArticle.id]);

  if (loading) {
    return <div className="mt-4 text-gray-600">Loading links...</div>;
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Outgoing Links */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Links to</h3>
        {outgoingLinks.length > 0 ? (
          <ul className="space-y-1">
            {outgoingLinks.map((link) => (
              <li key={link.id} className="text-blue-600 hover:text-blue-800">
                <Link to={`/articles/${link.id}`} className="hover:underline">
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 italic">No outgoing links</p>
        )}
      </div>

      {/* Backlinks */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Links from</h3>
        {backlinks.length > 0 ? (
          <ul className="space-y-1">
            {backlinks.map((link) => (
              <li key={link.id} className="text-blue-600 hover:text-blue-800">
                <Link to={`/articles/${link.id}`} className="hover:underline">
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 italic">No incoming links</p>
        )}
      </div>
    </div>
  );
};

export default ArticleLinks;
