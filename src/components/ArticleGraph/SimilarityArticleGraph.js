import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import {
  fetchUserArticles,
  computeTFIDF,
  cosineSimilarity,
} from "../../utils/articleUtils"; // Import the utility functions
import { useNavigate } from "react-router-dom";
import options from "../../utils/graphOptions";

const SimilarityArticleGraph = () => {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const articlesData = await fetchUserArticles(currentUser);
        setArticles(articlesData);
        createGraph(articlesData);
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

  const createGraph = (articles) => {
    if (!articles || articles.length === 0) {
      console.error("No articles available to create graph");
      return;
    }

    const nodes = [];
    const edges = [];

    articles.forEach((article) => {
      nodes.push({
        id: article.id,
        label: article.title,
        title: article.title,
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
        if (similarity > 0.1) {
          edges.push({
            from: articles[i].id,
            to: articles[j].id,
            width: similarity * 10, // Increase line thickness based on similarity
            physics: { springConstant: similarity * 10 }, // Increase gravity based on similarity
            color: { color: "#848484" },
          });
        }
      }
    }

    const data = {
      nodes: new DataSet(nodes),
      edges: new DataSet(edges),
    };

    const container = document.getElementById("similarity-network");
    if (!container) {
      console.error("Graph container not found");
      return;
    }

    const network = new Network(container, data, options);

    network.on("click", (params) => {
      if (params.nodes.length > 0) {
        const articleId = params.nodes[0];
        navigate(`/articles/${articleId}`);
      }
    });
  };

  return (
    <div>
      <div
        id="similarity-network"
        style={{ height: "600px", border: "1px solid #ddd" }}
      />
    </div>
  );
};

export default SimilarityArticleGraph;
