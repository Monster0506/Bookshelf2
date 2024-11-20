import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchUserArticles } from "../../utils/articleUtils";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaCalendar } from "react-icons/fa";
import * as d3 from "d3";
import ArticleHoverCard from "./ArticleHoverCard";

const TimelineArticleGraph = () => {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState([null, null]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const svgRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const loadArticles = async () => {
      if (currentUser) {
        const fetchedArticles = await fetchUserArticles(currentUser);
        setArticles(fetchedArticles);
        
        const dates = fetchedArticles
          .filter(article => article.date)
          .map(article => article.date.toDate());
        
        setTimeRange([d3.min(dates), d3.max(dates)]);
      }
    };
    loadArticles();
  }, [currentUser]);

  useEffect(() => {
    if (!articles.length || !timeRange[0] || !timeRange[1]) return;

    const filteredArticles = articles
      .filter(article => 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        article.date &&
        article.date.toDate() >= timeRange[0] &&
        article.date.toDate() <= timeRange[1]
      )
      .sort((a, b) => a.date.toDate() - b.date.toDate());

    // Group articles by date
    const articlesByDate = filteredArticles.reduce((acc, article) => {
      const dateStr = article.date.toDate().toDateString();
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(article);
      return acc;
    }, {});

    // SVG dimensions
    const margin = { top: 60, right: 40, bottom: 60, left: 40 };
    const width = window.innerWidth - margin.left - margin.right - 80;
    const height = 800; 
    const nodeRadius = 8;
    const verticalSpacing = 25; 
    const timelineY = height * 0.8; 

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create gradient for timeline
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "timeline-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("x2", width);

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3B82F6");

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#2563EB");

    // Create scales
    const xScale = d3.scaleTime()
      .domain([timeRange[0], timeRange[1]])
      .range([0, width]);

    // Create axis with more frequent ticks
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(filteredArticles.length * 2, 12))
      .tickFormat(d3.timeFormat("%b %Y"))
      .tickSize(-10);

    // Add main timeline line
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", timelineY)
      .attr("y2", timelineY)
      .style("stroke", "url(#timeline-gradient)")
      .style("stroke-width", 4);

    // Add axis with custom styling
    const axisGroup = svg.append("g")
      .attr("transform", `translate(0,${timelineY + 30})`)
      .call(xAxis);

    // Style axis
    axisGroup.select(".domain").remove(); 
    axisGroup.selectAll(".tick line")
      .style("stroke", "#6B7280")
      .style("stroke-width", 1);
    axisGroup.selectAll(".tick text")
      .style("fill", "#9CA3AF")
      .style("font-size", "12px")
      .attr("transform", "rotate(-45)")  
      .attr("text-anchor", "end")  
      .attr("dy", "0.5em")
      .attr("dx", "-0.5em");  

    // Add nodes with labels
    Object.entries(articlesByDate).forEach(([dateStr, articles]) => {
      const date = new Date(dateStr);
      const xPos = xScale(date);
      
      // Stack all nodes above the timeline
      const baseY = timelineY;  
      
      articles.forEach((article, index) => {
        // Calculate position from bottom up, starting at the timeline
        const yPos = baseY - ((index + 1) * verticalSpacing);

        // Create node group
        const node = svg.append("g")
          .attr("class", "node")
          .attr("transform", `translate(${xPos},${yPos})`);

        // Add connecting line to timeline
        node.append("line")
          .attr("x1", 0)
          .attr("x2", 0)
          .attr("y1", 0)
          .attr("y2", baseY - yPos)  
          .style("stroke", "#4B5563")
          .style("stroke-width", 1)
          .style("stroke-dasharray", "3,3");

        // Add circle
        node.append("circle")
          .attr("r", nodeRadius)
          .style("fill", "#3B82F6")
          .style("stroke", "#1E40AF")
          .style("stroke-width", 2)
          .style("cursor", "pointer")
          .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))")
          .on("mouseover", (event) => {
            setSelectedArticle(article);
            d3.select(event.currentTarget)
              .transition()
              .duration(200)
              .attr("r", nodeRadius * 1.5)
              .style("fill", "#2563EB")
              .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.2))");
          })
          .on("mouseout", (event) => {
            if (selectedArticle === article) return;
            d3.select(event.currentTarget)
              .transition()
              .duration(200)
              .attr("r", nodeRadius)
              .style("fill", "#3B82F6")
              .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");
          })
          .on("click", () => {
            navigate(`/articles/${article.id}`);
          });
      });
    });

  }, [articles, timeRange, searchTerm, navigate, selectedArticle]);

  return (
    <div className="p-4">
      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center bg-gray-800 p-4 rounded-lg shadow-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {timeRange[0] && timeRange[1] && (
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <FaCalendar className="text-gray-400" />
              <input
                type="date"
                value={timeRange[0]?.toISOString().split('T')[0] || ''}
                onChange={(e) => setTimeRange([new Date(e.target.value), timeRange[1]])}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaCalendar className="text-gray-400" />
              <input
                type="date"
                value={timeRange[1]?.toISOString().split('T')[0] || ''}
                onChange={(e) => setTimeRange([timeRange[0], new Date(e.target.value)])}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Timeline Graph */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Article Timeline</h2>
        <div className="overflow-auto" style={{ height: '600px' }}>
          <svg ref={svgRef} style={{ backgroundColor: "#1F2937" }}></svg>
        </div>
        <ArticleHoverCard article={selectedArticle} />
      </div>
    </div>
  );
};

export default TimelineArticleGraph;
