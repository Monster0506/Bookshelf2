// SimilarityArticleGraph.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { ForceGraph2D } from "react-force-graph";
import { useAuth } from "../contexts/AuthContext"; // Adjust the path as needed
import { computeTFIDF, cosineSimilarity } from "../utils/articleUtils";
import { db } from "../firebaseConfig"; // Adjust the path as needed

const SimilarityArticleGraph = () => {
  const [articles, setArticles] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const SIMILARITY_THRESHOLD = 0.1; // Define a threshold for similarity to filter connections

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const articlesSnapshot = await getDocs(collection(db, "articles"));
        const articlesData = articlesSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((article) => article.userid === currentUser.uid);

        setArticles(articlesData);
      } catch (error) {
        console.error("Error fetching articles:", error);
      }
    };

    if (currentUser) {
      fetchArticles();
    }
  }, [currentUser]);

  useEffect(() => {
    if (articles.length === 0) return;

    // Compute TF-IDF vectors for all articles
    const tfidfVectors = computeTFIDF(articles);

    // Create nodes for all articles
    const nodes = articles.map((article) => ({
      id: article.id,
      name: article.title,
    }));

    // Create links based on cosine similarity between all article pairs
    const links = [];
    for (let i = 0; i < articles.length; i++) {
      for (let j = i + 1; j < articles.length; j++) {
        const similarity = cosineSimilarity(tfidfVectors[i], tfidfVectors[j]);
        if (similarity > SIMILARITY_THRESHOLD) {
          // Add links only if similarity is above the threshold
          links.push({
            source: articles[i].id,
            target: articles[j].id,
            value: similarity, // Use similarity score to define link thickness
          });
        }
      }
    }

    setGraphData({ nodes, links });
  }, [articles]);

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <ForceGraph2D
        graphData={graphData}
        nodeAutoColorBy="id"
        linkWidth={(link) => link.value * 5} // Adjust thickness based on similarity
        nodeLabel={(node) => node.name} // Show article title on hover
        onNodeClick={(node) => {
          navigate(`/article/${node.id}`); // Navigate to the article's page on click
        }}
      />
    </div>
  );
};

export default SimilarityArticleGraph;
