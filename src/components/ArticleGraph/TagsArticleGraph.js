import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import { fetchUserArticles } from "../../utils/articleUtils"; // Import the utility function
import { useNavigate } from "react-router-dom";

const TagsArticleGraph = () => {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticles = async () => {
      const articlesData = await fetchUserArticles(currentUser);
      setArticles(articlesData);
      createGraph(articlesData);
    };

    fetchArticles();
  }, [currentUser]);

  const getRandomColor = () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
  };

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

  const createTagColorMap = (articles) => {
    const tagColorMap = {};
    articles.forEach((article) => {
      if (Array.isArray(article.tags)) {
        article.tags.forEach((tag) => {
          if (!tagColorMap[tag]) {
            tagColorMap[tag] = generateColorFromTag(tag);
          }
        });
      }
    });
    return tagColorMap;
  };

  const createGraph = (articles) => {
    const nodes = [];
    const edges = [];
    const tagColorMap = createTagColorMap(articles);

    articles.forEach((article) => {
      if (Array.isArray(article.tags) && article.tags.length > 0) {
        nodes.push({
          id: article.id,
          label: article.title,
          title: article.title,
          color: generateColorFromTag(article.title),
        });
      }
    });

    for (let i = 0; i < articles.length; i++) {
      for (let j = i + 1; j < articles.length; j++) {
        if (articles[i].tags) {
          const sharedTags = articles[i].tags.filter((tag) =>
            articles[j].tags.includes(tag),
          );

          if (sharedTags.length > 0) {
            const edgeColor = tagColorMap[sharedTags[0]] || "#848484";
            edges.push({
              from: articles[i].id,
              to: articles[j].id,
              label: sharedTags.join(", "),
              color: { color: edgeColor },
            });
          }
        }
      }
    }

    const data = {
      nodes: new DataSet(nodes),
      edges: new DataSet(edges),
    };

    const container = document.getElementById("article-network");
    const options = {
      nodes: {
        shape: "dot",
        size: 16,
        font: {
          color: "#343434",
        },
      },
      edges: {
        arrows: {
          to: { enabled: true, scaleFactor: 0.5 },
        },
        smooth: {
          type: "dynamic",
        },
      },
      physics: {
        enabled: true,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -30,
          centralGravity: 0.005,
          springLength: 130,
          springConstant: 0.1,
        },
        maxVelocity: 50,
        minVelocity: 0.1,
        timestep: 0.5,
        stabilization: {
          enabled: true,
          iterations: 1000,
          updateInterval: 50,
          onlyDynamicEdges: false,
          fit: true,
        },
      },
      interaction: {
        tooltipDelay: 200,
        hideEdgesOnDrag: false,
        hover: true,
      },
    };

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
        id="article-network"
        style={{ height: "600px", border: "1px solid #ddd" }}
      ></div>
    </div>
  );
};

export default TagsArticleGraph;
