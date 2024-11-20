import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ForceGraph3D } from "react-force-graph";
import * as THREE from 'three';
import {
  fetchUserArticles,
  computeTFIDF,
  cosineSimilarity,
} from "../../utils/articleUtils";
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

const SimilarityArticleGraph = () => {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadArticles = async () => {
      const fetchedArticles = await fetchUserArticles(currentUser);
      if (Array.isArray(fetchedArticles)) {
        setArticles(fetchedArticles);
      } else {
        console.error('Fetched articles is not an array:', fetchedArticles);
        setArticles([]);
      }
    };
    loadArticles();
  }, [currentUser]);

  const createGraphData = useCallback((articles) => {
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      console.error('No articles to process');
      return { nodes: [], links: [] };
    }

    
    // Create nodes first
    const nodes = articles.map(article => ({
      ...article, // Include all article properties
      id: article.id,
      name: article.title,
      title: article.title,
      content: article.plaintext || article.content || article.title || '',
      color: '#3B82F6',
      val: 1,
      desc: article.description || article.desc,
      tags: article.tags || []
    }));

    // Compute TF-IDF vectors for all articles
    const tfidfVectors = computeTFIDF(nodes);

    // Create links based on similarity
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const similarity = cosineSimilarity(tfidfVectors[i], tfidfVectors[j]);
        if (similarity > 0.05) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            value: similarity,
            color: `rgba(75, 85, 99, ${similarity*100})`,
          });
        }
      }
    }

    return { nodes, links };
  }, []);

  // Memoize graph data
  const graphData = useMemo(() => createGraphData(articles), [articles, createGraphData]);

  const handleNodeClick = useCallback(node => {
    navigate(`/articles/${node.id}`);
  }, [navigate]);

  const handleNodeHover = useCallback(node => {
    setSelectedNode(node);
  }, []);

  const handleDismiss = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Memoize node object generation
  const createNodeObject = useCallback((node) => {
    const color = selectedNode === node ? '#ffffff' : '#aaaaaa';
    const bgColor = selectedNode === node ? '#3B82F6' : 'rgba(0,0,0,0.5)';
    return createTextSprite(node.name, color, bgColor);
  }, [selectedNode]);

  return (
    <div>
      <ForceGraph3D
        graphData={graphData}
        nodeLabel="title"
        nodeColor="color"
        nodeVal={node => node.val}
        nodeRelSize={6}
        linkColor="color"
        linkWidth={link => link.value * 5}
        linkOpacity={0.8}
        linkDirectionalParticles={4}
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        nodeThreeObject={createNodeObject}
        nodeThreeObjectExtend={true}
        controlType="orbit"
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={true}
        backgroundColor="#000000"
        width={1200}
        height={600}
      />
      <ArticleHoverCard 
        article={selectedNode} 
        onDismiss={handleDismiss}
      />
    </div>
  );
};

export default SimilarityArticleGraph;
