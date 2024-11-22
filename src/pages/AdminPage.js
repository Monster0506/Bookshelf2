import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import Loading from "../components/Loading";

const AdminPage = () => {
  const [articles, setArticles] = useState([]);
  const [tags, setTags] = useState([]);
  const [userIds, setUserIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null
  });
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Admin UIDs - add your admin UIDs here
  const ADMIN_UIDS = [process.env.REACT_APP_ADMIN_UID];

  useEffect(() => {
    // Check if user is admin
    if (!ADMIN_UIDS.includes(currentUser?.uid)) {
      navigate('/');
      return;
    }

    fetchData();
  }, [currentUser, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch articles
      const articlesSnapshot = await getDocs(collection(db, 'articles'));
      const articlesData = articlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateFormatted: doc.data().date?.toDate().toLocaleDateString()
      }));
      setArticles(articlesData);

      // Get unique user IDs from articles
      const uniqueUserIds = new Set(articlesData.map(article => article.userid));
      setUserIds(uniqueUserIds);

      // Fetch tags
      const tagsSnapshot = await getDocs(collection(db, 'tags'));
      const tagsData = tagsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTags(tagsData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await deleteDoc(doc(db, 'articles', articleId));
        setArticles(articles.filter(article => article.id !== articleId));
      } catch (error) {
        console.error('Error deleting article:', error);
      }
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      try {
        await deleteDoc(doc(db, 'tags', tagId));
        setTags(tags.filter(tag => tag.id !== tagId));
      } catch (error) {
        console.error('Error deleting tag:', error);
      }
    }
  };

  const handleEditArticle = (article) => {
    setEditingArticle({ ...article });
  };

  const handleSaveArticle = async () => {
    try {
      await updateDoc(doc(db, 'articles', editingArticle.id), editingArticle);
      setArticles(articles.map(article => 
        article.id === editingArticle.id ? editingArticle : article
      ));
      setEditingArticle(null);
    } catch (error) {
      console.error('Error updating article:', error);
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortedItems = (items, config) => {
    if (!config.key || !config.direction) return items;

    return [...items].sort((a, b) => {
      let aValue = a[config.key];
      let bValue = b[config.key];

      // Special handling for dates
      if (config.key === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      }

      // Special handling for title and userid (case-insensitive)
      if (config.key === 'title' || config.key === 'userid') {
        aValue = (aValue || '').toLowerCase();
        bValue = (bValue || '').toLowerCase();
      }

      if (aValue < bValue) {
        return config.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return config.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    if (sortConfig.direction === 'ascending') {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const filteredArticles = articles.filter(article =>
    article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.userid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUserIds = new Set(
    Array.from(userIds).filter(userId => 
      userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      articles.some(article => 
        article.userid === userId && 
        article.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  );

  const sortedArticles = getSortedItems(filteredArticles, sortConfig);
  const sortedUsers = getSortedItems(
    Array.from(filteredUserIds).map(userId => {
      const userArticles = articles.filter(article => article.userid === userId);
      const latestArticle = userArticles.reduce((latest, article) => {
        return !latest || article.date > latest.date ? article : latest;
      }, null);
      return {
        userid: userId,
        articleCount: userArticles.length,
        latestDate: latestArticle?.date || null
      };
    }),
    {
      key: sortConfig.key === 'articleCount' || sortConfig.key === 'latestDate' ? sortConfig.key : 'userid',
      direction: sortConfig.direction
    }
  );

  if (loading) {
    return (
        <Loading />
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by article title or user ID..."
            className="w-full p-3 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            Found {filteredArticles.length} articles and {filteredUserIds.size} users
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-bold">Total Articles</h2>
          <p className="text-2xl">{articles.length}</p>
          {searchTerm && (
            <p className="text-sm text-gray-600">Filtered: {filteredArticles.length}</p>
          )}
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h2 className="font-bold">Total Tags</h2>
          <p className="text-2xl">{tags.length}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded">
          <h2 className="font-bold">Active Users</h2>
          <p className="text-2xl">{userIds.size}</p>
          {searchTerm && (
            <p className="text-sm text-gray-600">Filtered: {filteredUserIds.size}</p>
          )}
        </div>
      </div>

      {/* Articles Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Articles</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th 
                  className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-2">
                    <span>Title</span>
                    <SortIcon columnKey="title" />
                  </div>
                </th>
                <th 
                  className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('userid')}
                >
                  <div className="flex items-center gap-2">
                    <span>User ID</span>
                    <SortIcon columnKey="userid" />
                  </div>
                </th>
                <th 
                  className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    <span>Date</span>
                    <SortIcon columnKey="date" />
                  </div>
                </th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedArticles.map(article => (
                <tr key={article.id} className="border-t">
                  {editingArticle?.id === article.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editingArticle.title}
                          onChange={(e) => setEditingArticle({
                            ...editingArticle,
                            title: e.target.value
                          })}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="px-4 py-2">{article.userid}</td>
                      <td className="px-4 py-2">{article.dateFormatted}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={handleSaveArticle}
                          className="text-green-600 hover:text-green-800 mr-2"
                        >
                          <FaSave />
                        </button>
                        <button
                          onClick={() => setEditingArticle(null)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <FaTimes />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">{article.title}</td>
                      <td className="px-4 py-2">{article.userid}</td>
                      <td className="px-4 py-2">{article.dateFormatted}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleEditArticle(article)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tags Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Tags</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tags.map(tag => (
            <div key={tag.id} className="bg-gray-100 p-2 rounded flex justify-between items-center">
              <span>{tag.name}</span>
              <button
                onClick={() => handleDeleteTag(tag.id)}
                className="text-red-600 hover:text-red-800"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Users Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th 
                  className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('userid')}
                >
                  <div className="flex items-center gap-2">
                    <span>User ID</span>
                    <SortIcon columnKey="userid" />
                  </div>
                </th>
                <th 
                  className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('articleCount')}
                >
                  <div className="flex items-center gap-2">
                    <span>Articles</span>
                    <SortIcon columnKey="articleCount" />
                  </div>
                </th>
                <th 
                  className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('latestDate')}
                >
                  <div className="flex items-center gap-2">
                    <span>Latest Article</span>
                    <SortIcon columnKey="latestDate" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map(({ userid, articleCount, latestDate }) => {
                const userArticles = articles.filter(article => article.userid === userid);
                const latestArticle = userArticles.find(article => article.date === latestDate);

                return (
                  <tr 
                    key={userid} 
                    className={`border-t cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                      searchTerm === userid ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSearchTerm(searchTerm === userid ? '' : userid)}
                  >
                    <td className="px-4 py-2 flex items-center">
                      <span className="flex-grow">{userid}</span>
                      {searchTerm === userid && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchTerm('');
                          }}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2">{articleCount}</td>
                    <td className="px-4 py-2">
                      {latestArticle?.dateFormatted || 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
