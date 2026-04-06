// UpperRightPanel wraps Monaco so the main problem page does not have to care about editor setup details.
// It handles language switching and keeps the editor laid out correctly inside resizable panels.
import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";

export default function UpperRightPanle({ prop, code, setCode, language, setLanguage }) {
  const editorRef = useRef(null);

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
  }

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      editorRef.current?.layout();
    });

    const container = document.getElementById("editor-wrapper");
    if (container) resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="h-full min-h-0 flex flex-col bg-white">

      {/* Toolbar */}
      <div className="h-10 bg-white flex items-center justify-between px-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Language:</span>
          <select
            className="select select-sm w-32 bg-white text-slate-700 border border-slate-200 focus:bg-white focus:text-slate-900 focus:border-indigo-400 focus:outline-none"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="cpp" className="bg-white text-slate-700">C++</option>
            <option value="javascript" className="bg-white text-slate-700">JavaScript</option>
            <option value="java" className="bg-white text-slate-700">Java</option>
            <option value="python" className="bg-white text-slate-700">Python</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
          Auto-saved
        </div>
      </div>

      {/* Editor */}
      <div id="editor-wrapper" className="flex-1 overflow-hidden min-h-0">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value ?? "")}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            scrollbar: {
              vertical: "hidden",
              horizontal: "hidden",
            },
          }}
        />
      </div>
    </div>
  );
}
