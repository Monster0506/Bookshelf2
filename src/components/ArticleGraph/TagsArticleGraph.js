import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ForceGraph3D } from "react-force-graph";
import { fetchUserArticles } from "../../utils/articleUtils";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaFilter, FaExpand, FaCompress } from "react-icons/fa";
import * as d3 from "d3";
import * as THREE from 'three';
import ArticleHoverCard from "./ArticleHoverCard";

const createTextSprite = (text, color = '#ffffff', backgroundColor = 'rgba(0,0,0,0.8)') => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // Set canvas size
  const fontSize = 24;
  context.font = `${fontSize}px Arial`;
  const textWidth = context.measureText(text).width;
  canvas.width = textWidth + 20;
  canvas.height = fontSize + 16;

  // Draw background
  context.fillStyle = backgroundColor;
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.roundRect(0, 0, canvas.width, canvas.height, 6);
  context.fill();
  context.stroke();

  // Draw text
  context.fillStyle = color;
  context.font = `${fontSize}px Arial`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  // Create texture and sprite
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);

  // Scale sprite based on text length
  const scaleFactor = 0.05;
  sprite.scale.set(canvas.width * scaleFactor, canvas.height * scaleFactor, 1);

  return sprite;
};

const TagsArticleGraph = () => {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [minSharedTags, setMinSharedTags] = useState(1);
  const [maxSharedTags, setMaxSharedTags] = useState(1);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [showTags, setShowTags] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadArticles = async () => {
      const fetchedArticles = await fetchUserArticles(currentUser);
      if (Array.isArray(fetchedArticles)) {
        setArticles(fetchedArticles);
        
        // Calculate max shared tags
        let maxShared = 1;
        for (let i = 0; i < fetchedArticles.length; i++) {
          for (let j = i + 1; j < fetchedArticles.length; j++) {
            if (fetchedArticles[i].tags && fetchedArticles[j].tags) {
              const sharedTags = fetchedArticles[i].tags.filter((tag) =>
                fetchedArticles[j].tags.includes(tag)
              );
              maxShared = Math.max(maxShared, sharedTags.length);
            }
          }
        }
        setMaxSharedTags(maxShared);
        setMinSharedTags(1);
      }
    };
    loadArticles();
  }, [currentUser]);

  const generateColorFromTag = (tag) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }

    const r = (hash >> 24) & 0xff;
    const g = (hash >> 16) & 0xff;
    const b = (hash >> 8) & 0xff;

    return `rgb(${Math.abs(r)}, ${Math.abs(g)}, ${Math.abs(b)})`;
  };

  const getFilteredArticles = useCallback(() => {
    if (!searchTerm.trim()) return articles;

    const searchTerms = searchTerm
      .toLowerCase()
      .split(',')
      .map(term => term.trim())
      .filter(term => term.length > 0);

    if (searchTerms.length === 0) return articles;

    return articles.filter(article => {
      const title = article.title?.toLowerCase() || '';
      return searchTerms.some(term => title.includes(term));
    });
  }, [articles, searchTerm]);

  const createGraphData = useCallback(() => {
    const filteredArticles = getFilteredArticles();
    if (!filteredArticles || filteredArticles.length === 0) return { nodes: [], links: [] };

    let nodes = [];
    let links = [];
    const searchTerms = searchTerm
      .toLowerCase()
      .split(',')
      .map(term => term.trim())
      .filter(term => term.length > 0);

    // Create nodes
    if (showTags) {
      // Create both article and tag nodes
      const tagNodes = new Set();
      
      filteredArticles.forEach(article => {
        // Add article node
        const isSearched = searchTerms.some(term => 
          article.title?.toLowerCase().includes(term)
        );

        nodes.push({
          ...article, // Include all article properties
          id: article.id,
          name: article.title,
          type: 'article',
          color: isSearched ? '#FFD700' : '#3B82F6', // Highlight searched articles in gold
          val: 1,
          desc: article.description || article.desc,
          tags: article.tags || []
        });

        // Add tag nodes
        article.tags?.forEach(tag => {
          if (!tagNodes.has(tag)) {
            tagNodes.add(tag);
            nodes.push({
              id: `tag-${tag}`,
              name: tag,
              type: 'tag',
              color: generateColorFromTag(tag),
              val: 1
            });
          }
        });
      });

      // Create links between articles and their tags
      filteredArticles.forEach(article => {
        if (article.tags) {
          article.tags.forEach(tag => {
            links.push({
              source: article.id,
              target: `tag-${tag}`,
              color: generateColorFromTag(tag),
              width: 1
            });
          });
        }
      });
    } else {
      // Only article nodes with direct connections
      nodes = filteredArticles.map(article => {
        const isSearched = searchTerms.some(term => 
          article.title?.toLowerCase().includes(term)
        );
        
        return {
          ...article, // Include all article properties
          id: article.id,
          name: article.title,
          type: 'article',
          color: isSearched ? '#FFD700' : '#3B82F6', // Highlight searched articles in gold
          val: 1,
          desc: article.description || article.desc,
          tags: article.tags || []
        };
      });

      // Create links between articles based on shared tags
      for (let i = 0; i < filteredArticles.length; i++) {
        for (let j = i + 1; j < filteredArticles.length; j++) {
          if (!filteredArticles[i].tags || !filteredArticles[j].tags) continue;

          const sharedTags = filteredArticles[i].tags.filter((tag) =>
            filteredArticles[j].tags.includes(tag)
          );

          if (sharedTags.length >= minSharedTags) {
            const isSearchedConnection = 
              searchTerms.some(term => filteredArticles[i].title?.toLowerCase().includes(term)) &&
              searchTerms.some(term => filteredArticles[j].title?.toLowerCase().includes(term));

            links.push({
              source: filteredArticles[i].id,
              target: filteredArticles[j].id,
              sharedTags,
              color: isSearchedConnection ? '#FFD700' : generateColorFromTag(sharedTags[0]),
              width: sharedTags.length,
            });
          }
        }
      }
    }

    return { nodes, links };
  }, [articles, searchTerm, showTags, minSharedTags]);

  const graphData = useMemo(() => createGraphData(),
    [createGraphData]);

  const handleNodeHover = (node) => {
    if (!node) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      setSelectedNode(null);
      return;
    }

    const neighbors = new Set();
    const links = new Set();

    graphData.links.forEach(link => {
      if (link.source.id === node.id || link.target.id === node.id) {
        neighbors.add(link.source);
        neighbors.add(link.target);
        links.add(link);
      }
    });

    setHighlightLinks(links);
    setHighlightNodes(neighbors);
    setSelectedNode(node);
  };

  return (
    <div className="relative w-full h-full">
      {/* Controls Panel */}
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg space-y-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Articles
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Article 1, Article 2, Article 3..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate multiple articles with commas
          </p>
        </div>

        {/* Show Tags Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Show Tags as Nodes
          </label>
          <button
            onClick={() => setShowTags(!showTags)}
            className={`px-3 py-1 rounded-md transition-colors ${showTags
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
              }`}
          >
            {showTags ? 'On' : 'Off'}
          </button>
        </div>

        {/* Min Shared Tags (only show when tags are not nodes) */}
        {!showTags && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Shared Tags: {minSharedTags}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max={maxSharedTags}
                value={minSharedTags}
                onChange={(e) => setMinSharedTags(parseInt(e.target.value))}
                className="w-32"
              />
              <span className="text-xs text-gray-500">
                (Max: {maxSharedTags})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Graph */}
      <ForceGraph3D
        graphData={graphData}
        nodeAutoColorBy="group"
        onNodeClick={(node) => {
          if (node.type === 'article') {
            navigate(`/articles/${node.id}`);
          }
        }}
        onNodeHover={handleNodeHover}
        nodeLabel={(node) => `${node.name}`}
        nodeRelSize={6}
        nodeVal={(node) => node.val}
        linkWidth={(link) =>
          highlightLinks.has(link) ? 4 : Math.sqrt(link.width || 1)
        }
        linkColor={(link) => link.color}
        linkOpacity={0.8}
        linkDirectionalParticles={4}
        linkDirectionalParticleWidth={(link) =>
          highlightLinks.has(link) ? 4 : 0
        }
        linkDirectionalParticleSpeed={0.005}
        nodeThreeObject={(node) => {
          const color = highlightNodes.has(node) ? '#ffffff' : '#aaaaaa';
          const bgColor = highlightNodes.has(node) ? node.color :
            node.type === 'tag' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)';
          return createTextSprite(node.name, color, bgColor);
        }}
        backgroundColor="#000000"
        width={1200}
        height={600}
      />
      <ArticleHoverCard 
        article={selectedNode}
        onDismiss={() => setSelectedNode(null)} 
      />
    </div>
  );
};

export default TagsArticleGraph;
