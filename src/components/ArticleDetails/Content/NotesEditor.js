// NotesEditor.js
import React from "react";
import MdEditor from "react-markdown-editor-lite";
import ReactMarkdown from "react-markdown";
import debounce from "lodash.debounce";

function NotesEditor({ notes, setNotes, saveNotes, canEdit, saving }) {
  const debouncedSaveNotes = debounce(saveNotes, 500);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Notes</h2>
      <MdEditor
        value={notes}
        style={{ height: "300px" }}
        renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
        onChange={({ text }) => {
          setNotes(text);
          debouncedSaveNotes();
        }}
        readOnly={!canEdit}
      />
      <div className="text-sm text-gray-500 mt-2">
        {saving ? "Saving..." : "Saved"}
      </div>
    </div>
  );
}

export default NotesEditor;
