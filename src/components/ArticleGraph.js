import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function ArticleGraph() {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const articlesSnapshot = await getDocs(collection(db, "articles"));
        const articlesData = articlesSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((article) => article.userid === currentUser.uid);

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
  const getRandomColor = () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Usage

  // Generate a color based on a string (tag)
  const generateColorFromTag = (tag) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert hash to an RGB color
    const r = (hash >> 24) & 0xff;
    const g = (hash >> 16) & 0xff;
    const b = (hash >> 8) & 0xff;

    return `rgb(${Math.abs(r)}, ${Math.abs(g)}, ${Math.abs(b)})`;
  };

  // Create a map of tags to colors
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

    // Create a tag color map
    const tagColorMap = createTagColorMap(articles);

    // Create nodes for each article
    articles.forEach((article) => {
      nodes.push({
        id: article.id,
        label: article.title,
        title: article.title,
        color: getRandomColor(),
      });
    });

    // Create edges based on shared tags and assign color based on tags
    for (let i = 0; i < articles.length; i++) {
      for (let j = i + 1; j < articles.length; j++) {
        const sharedTags = articles[i].tags.filter((tag) =>
          articles[j].tags.includes(tag),
        );

        if (sharedTags.length > 0) {
          // Use the first shared tag to determine edge color
          const edgeColor = tagColorMap[sharedTags[0]] || "#848484";

          edges.push({
            from: articles[i].id,
            to: articles[j].id,
            label: sharedTags.join(", "),
            color: { color: edgeColor }, // Set the edge color
          });
        }
      }
    }

    // Create the network data
    const data = {
      nodes: new DataSet(nodes),
      edges: new DataSet(edges),
    };

    // Initialize the network
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
      <h2 className="text-2xl font-semibold mb-4">Articles Graph by Tags</h2>
      <div
        id="article-network"
        style={{ height: "600px", border: "1px solid #ddd" }}
      ></div>
    </div>
  );
}

export default ArticleGraph;
