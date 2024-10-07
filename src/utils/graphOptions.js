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
      gravitationalConstant: -500,
      centralGravity: 0.1,
      springLength: 100,
      springConstant: 0.2,
    },
    maxVelocity: 50,
    minVelocity: 0.1,
    timestep: 0.5,
    stabilization: {
      enabled: true,
      iterations: 1500, // Increase iterations to allow more time for stabilization
      updateInterval: 100,
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
export default options;
