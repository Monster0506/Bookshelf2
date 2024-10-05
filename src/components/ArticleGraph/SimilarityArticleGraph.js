import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ForceGraph2D } from "react-force-graph";
import { useAuth } from "../../contexts/AuthContext"; // Adjust the path as needed
import {
  computeTFIDF,
  cosineSimilarity,
  fetchUserArticles,
} from "../../utils/articleUtils"; // Import the utility function

const SimilarityArticleGraph = () => {
  const [articles, setArticles] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const SIMILARITY_THRESHOLD = 0.1;

  useEffect(() => {
    const fetchArticles = async () => {
      const articlesData = await fetchUserArticles(currentUser);
      setArticles(articlesData);
    };

    fetchArticles();
  }, [currentUser]);

  useEffect(() => {
    if (articles.length === 0) return;

    const tfidfVectors = computeTFIDF(articles);
    const nodes = articles.map((article) => ({
      id: article.id,
      name: article.title,
    }));

    const links = [];
    for (let i = 0; i < articles.length; i++) {
      for (let j = i + 1; j < articles.length; j++) {
        const similarity = cosineSimilarity(tfidfVectors[i], tfidfVectors[j]);
        if (similarity > SIMILARITY_THRESHOLD) {
          links.push({
            source: articles[i].id,
            target: articles[j].id,
            value: similarity,
          });
        }
      }
    }

    setGraphData({ nodes, links });
  }, [articles]);

  return (
    <div style={{ width: "100%", height: "600px", border: "1px solid #ddd" }}>
      <ForceGraph2D
        graphData={graphData}
        nodeAutoColorBy="id"
        linkWidth={(link) => link.value * 5}
        nodeLabel={(node) => node.name}
        onNodeClick={(node) => {
          navigate(`/article/${node.id}`);
        }}
      />
    </div>
  );
};

export default SimilarityArticleGraph;
