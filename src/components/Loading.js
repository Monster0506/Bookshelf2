// Loading.js
import React from "react";

function Loading({ loading }) {
  return <p>{loading ? loading : "Loading Articles..."}</p>;
}

export default Loading;
