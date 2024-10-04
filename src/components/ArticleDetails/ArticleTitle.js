import React from "react";

function ArticleTitle({ title, editing, canEdit, onChange, createdAt }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        {editing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={!canEdit}
          />
        ) : (
          title
        )}
      </h1>
      {createdAt && <p className="text-sm text-gray-500">Created: </p>}
    </div>
  );
}

export default ArticleTitle;
