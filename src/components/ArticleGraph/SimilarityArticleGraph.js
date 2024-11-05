import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ForceGraph3D } from "react-force-graph";
import {
  fetchUserArticles,
  computeTFIDF,
  cosineSimilarity,
} from "../../utils/articleUtils"; // Import the utility functions
import { useNavigate } from "react-router-dom";

const SimilarityArticleGraph = () => {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const articlesData = await fetchUserArticles(currentUser);
        setArticles(articlesData);
      } catch (error) {
        console.error("Error fetching articles:", error);
      }
    };

    if (currentUser) {
      fetchArticles();
    }
  }, [currentUser]);

  const generateColorFromTitle = (title) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }

    const r = (hash >> 24) & 0xff;
    const g = (hash >> 16) & 0xff;
    const b = (hash >> 8) & 0xff;

    return `rgb(${Math.abs(r)}, ${Math.abs(g)}, ${Math.abs(b)})`;
  };

  const createGraphData = (articles) => {
    const nodes = [];
    const links = [];

    articles.forEach((article) => {
      nodes.push({
        id: article.id,
        name: article.title,
        color: generateColorFromTitle(article.title),
      });
    });

    // Compute TFIDF vectors for all articles
    const tfidfVectors = computeTFIDF(articles);

    for (let i = 0; i < articles.length; i++) {
      const targetVector = tfidfVectors[i];
      if (!targetVector) {
        console.error("Target vector is undefined for article index:", i);
        continue;
      }

      for (let j = i + 1; j < articles.length; j++) {
        const similarity = cosineSimilarity(targetVector, tfidfVectors[j]);
        if (similarity > 0.05) {
          links.push({
            source: articles[i].id,
            target: articles[j].id,
            width: similarity * 10, // Increase line thickness based on similarity
            color: generateColorFromTitle(articles[i].id),
          });
        }
      }
    }

    return { nodes, links };
  };

  return (
    <div style={{ backgroundColor: "#000000" }}>
      <ForceGraph3D
        graphData={createGraphData(articles)}
        nodeAutoColorBy="group"
        onNodeClick={(node) => navigate(`/articles/${node.id}`)}
        nodeLabel={(node) => `${node.name}`}
        linkDirectionalParticles={0}
        linkDirectionalParticleWidth={1.5}
        linkCurvature={0.3}
        linkWidth={(link) => Math.sqrt(link.width || 1)}
        backgroundColor="#000000"
        linkDirectionalArrowLength={8}
        linkDirectionalArrowRelPos={0.5}
        d3VelocityDecay={0.25}
        d3AlphaDecay={0.008}
        d3Force={(force) => {
          if (force.name === "charge") {
            force.strength(-150);
          }
          return force;
        }}
        width={1200}
        height={600}
      />
    </div>
  );
};

export default SimilarityArticleGraph;
