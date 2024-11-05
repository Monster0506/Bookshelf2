import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ForceGraph3D } from "react-force-graph";
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
    };

    fetchArticles();
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

  const createGraphData = (articles) => {
    const nodes = [];
    const links = [];
    const tagColorMap = {};

    articles.forEach((article) => {
      nodes.push({
        id: article.id,
        name: article.title,
        color: generateColorFromTag(article.title),
      });

      if (Array.isArray(article.tags)) {
        article.tags.forEach((tag) => {
          if (!tagColorMap[tag]) {
            tagColorMap[tag] = generateColorFromTag(tag);
          }
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
            links.push({
              source: articles[i].id,
              target: articles[j].id,
              color: tagColorMap[sharedTags[0]] || "#848484",
            });
          }
        }
      }
    }

    return { nodes, links };
  };

  return (
    <div>
      <ForceGraph3D
        graphData={createGraphData(articles)}
        nodeAutoColorBy="group"
        onNodeClick={(node) => navigate(`/articles/${node.id}`)}
        nodeLabel={(node) => `${node.name}`}
        linkDirectionalParticles={0}
        linkDirectionalParticleWidth={1}
        linkCurvature={0.25}
        linkWidth={(link) => Math.sqrt(link.value || 1) * 2}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={0.5}
        backgroundColor="#ffffff"
        d3VelocityDecay={0.3}
        d3AlphaDecay={0.01}
        d3Force={(force) => {
          if (force.name === "charge") {
            force.strength(-120);
          }
          return force;
        }}
        width={1200}
        height={600}
      />
    </div>
  );
};

export default TagsArticleGraph;
