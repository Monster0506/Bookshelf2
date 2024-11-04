// RelatedArticles.js
import React from "react";
import { motion } from "framer-motion";

function RelatedArticles({ relatedArticles }) {
  return (
    <div className="space-y-4">
      {relatedArticles.length > 0 && (
        <>
          <h2 className="text-xl font-semibold">Related Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedArticles.map((relatedArticle) => (
              <motion.div
                key={relatedArticle.id}
                className="p-4 bg-white shadow rounded-lg hover:shadow-lg transition"
                whileHover={{ scale: 1.05 }}
              >
                <a
                  href={`/articles/${relatedArticle.id}`}
                  className="text-blue-600 hover:underline text-lg font-medium"
                >
                  {relatedArticle.title}
                </a>
                <p className="text-sm text-gray-500">
                  Similarity Score:{" "}
                  {(relatedArticle.similarity * 100).toFixed(0)}%
                </p>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default RelatedArticles;
