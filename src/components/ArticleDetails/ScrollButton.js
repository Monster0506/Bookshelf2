import React, { useState, useEffect } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

function ScrollButton() {
  const [isBottom, setIsBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const halfwayPoint = document.documentElement.scrollHeight / 2;

      setIsBottom(scrollPosition >= halfwayPoint);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTopOrBottom = () => {
    if (isBottom) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <button
      onClick={scrollToTopOrBottom}
      className="fixed bottom-5 right-5 p-3 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition duration-300"
    >
      {isBottom ? <FaArrowUp size={20} /> : <FaArrowDown size={20} />}
    </button>
  );
}

export default ScrollButton;
