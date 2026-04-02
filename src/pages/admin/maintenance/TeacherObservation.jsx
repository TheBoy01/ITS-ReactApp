import React, { useState, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const UPLOAD_TYPES = [
  {
    value: "observation",
    label: "Teacher Observation",
    icon: "fa-eye",
    color: "#2563eb",
  },
  {
    value: "performance",
    label: "Teacher Performance",
    icon: "fa-chart-line",
    color: "#0891b2",
  },
  {
    value: "attainment",
    label: "Teachers Attainment",
    icon: "fa-award",
    color: "#7c3aed",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// API  — swap BASE_URL and endpoint paths to match your .NET Core routes
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * uploadTPOFile
 * POST /api/TPO/upload
 * Body: multipart/form-data  { file, type }
 *
 * Returns the upload session ID used to subscribe to SSE progress.
 * Expected JSON response: { sessionId: "abc123" }
 */
export async function uploadTPOFile(file, type, signal) {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);

  const res = await fetch(`${BASE_URL}/api/TPO/upload`, {
    method: "POST",
    body: form,
    signal,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Upload failed");
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json(); // { sessionId: string }
}

/**
 * subscribeToUploadProgress
 * GET /api/TPO/upload-progress/{sessionId}  (SSE endpoint)
 *
 * Server should emit events like:
 *   data: {"percent": 42, "message": "Processing rows…"}
 *   data: {"percent": 100, "done": true, "message": "Done!"}
 *   data: {"error": "Something went wrong"}
 *
 * Returns a cleanup fn — call it to close the EventSource.
 */
export function subscribeToUploadProgress(
  sessionId,
  { onProgress, onDone, onError },
) {
  const url = `${BASE_URL}/api/TPO/upload-progress/${sessionId}`;
  const es = new EventSource(url, { withCredentials: true });

  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.error) {
        onError(data.error);
        es.close();
      } else if (data.done) {
        onProgress(100, data.message ?? "Complete");
        onDone();
        es.close();
      } else {
        onProgress(data.percent ?? 0, data.message ?? "");
      }
    } catch {
      onError("Unexpected server response");
      es.close();
    }
  };

  es.onerror = () => {
    onError("Connection to server lost");
    es.close();
  };

  return () => es.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
};

let _id = 0;
const uid = () => ++_id;

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Full-screen blocking overlay — user cannot interact with anything behind */
const UploadOverlay = ({ fileName, typeName, percent, message }) => (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center"
    style={{
      backgroundColor: "rgba(15,23,42,0.75)",
      backdropFilter: "blur(4px)",
    }}
  >
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
      {/* Thin progress stripe at top */}
      <div className="h-1.5 bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${percent}%`,
            background: "linear-gradient(90deg,#2563eb,#7c3aed)",
          }}
        />
      </div>

      <div className="px-8 py-7 flex flex-col items-center">
        {/* Animated icon */}
        <div className="relative w-16 h-16 mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fas fa-cloud-arrow-up text-xl text-blue-600" />
          </div>
        </div>

        <p className="text-base font-bold text-slate-800 mb-0.5">
          Uploading file…
        </p>
        <p className="text-xs text-slate-400 truncate max-w-[240px] mb-1 text-center">
          {fileName}
        </p>
        <p className="text-xs font-semibold text-blue-600 mb-5">{typeName}</p>

        {/* Big % counter */}
        <p className="text-5xl font-black text-slate-800 tabular-nums leading-none mb-3">
          {percent}
          <span className="text-2xl font-bold text-slate-300">%</span>
        </p>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${percent}%`,
              background: "linear-gradient(90deg,#2563eb,#7c3aed)",
            }}
          />
        </div>

        <p className="text-xs text-slate-400 min-h-[18px] text-center">
          {message || "Please wait…"}
        </p>

        <p className="text-[11px] text-slate-300 mt-4 flex items-center gap-1.5">
          <i className="fas fa-lock" />
          Do not close or navigate away
        </p>
      </div>
    </div>
  </div>
);

/** One row in the staged-files table */
const StagedFileRow = ({ item, index, onRemove, isUploading }) => {
  const type = UPLOAD_TYPES.find((t) => t.value === item.type);
  return (
    <tr className="group border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
      <td className="px-4 py-3 text-xs text-slate-400 font-mono w-8">
        {String(index + 1).padStart(2, "0")}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-file-excel text-sm text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate max-w-[240px]">
              {item.fileName}
            </p>
            <p className="text-xs text-slate-400">{item.fileSize}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {type && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
            style={{
              color: type.color,
              backgroundColor: `${type.color}12`,
              borderColor: `${type.color}30`,
            }}
          >
            <i className={`fas ${type.icon} text-[10px]`} />
            {type.label}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-slate-400 font-mono">
        {item.fileSize}
      </td>
      <td className="px-4 py-3 w-10">
        <button
          onClick={() => onRemove(item.id)}
          disabled={isUploading}
          className="opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity p-1.5 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-400"
          title="Remove"
        >
          <i className="fas fa-trash-can text-xs" />
        </button>
      </td>
    </tr>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const TeacherObservation = () => {
  const [selectedType, setSelectedType] = useState("");
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // ── File staging ──────────────────────────────────────────────────────────
  const stageFile = useCallback(
    (file) => {
      if (!file) return;
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        setUploadError("Only .xlsx or .xls files are accepted.");
        return;
      }
      setUploadError("");
      setUploadSuccess(false);
      // Replace any existing staged file (only 1 allowed)
      setStagedFiles([
        {
          id: uid(),
          fileName: file.name,
          fileSize: formatBytes(file.size),
          rawFile: file,
          type: selectedType,
        },
      ]);
    },
    [selectedType],
  );

  const handleBrowse = (e) => {
    stageFile(e.target.files[0]);
    e.target.value = "";
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    stageFile(e.dataTransfer.files[0]);
  };
  const handleRemove = (id) => {
    setStagedFiles((p) => p.filter((f) => f.id !== id));
    setUploadError("");
    setUploadSuccess(false);
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!canUpload) return;
    const item = stagedFiles[0];

    setIsUploading(true);
    setUploadPercent(0);
    setUploadMessage("Sending file to server…");
    setUploadError("");
    setUploadSuccess(false);

    let closeSSE = null;

    try {
      // 1. POST file → get SSE session ID
      const { sessionId } = await uploadTPOFile(item.rawFile, selectedType);

      setUploadMessage("Processing file…");

      // 2. Listen to SSE stream for live progress
      await new Promise((resolve, reject) => {
        closeSSE = subscribeToUploadProgress(sessionId, {
          onProgress: (pct, msg) => {
            setUploadPercent(pct);
            setUploadMessage(msg);
          },
          onDone: () => resolve(),
          onError: (err) => reject(new Error(err)),
        });
      });

      // 3. Success
      setUploadSuccess(true);
      setStagedFiles([]);
      setSelectedType("");
    } catch (err) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      if (closeSSE) closeSSE();
      setIsUploading(false);
      setUploadPercent(0);
      setUploadMessage("");
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const canUpload = stagedFiles.length > 0 && !!selectedType && !isUploading;
  const currentTypeMeta = UPLOAD_TYPES.find((t) => t.value === selectedType);
  const uploadingItem = stagedFiles[0];

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <style>{`
        * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        .mono { font-family: 'DM Mono', monospace; }
        .card { box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04); }
      `}</style>

      {/* ── Blocking overlay ── */}
      {isUploading && (
        <UploadOverlay
          fileName={uploadingItem?.fileName}
          typeName={currentTypeMeta?.label}
          percent={uploadPercent}
          message={uploadMessage}
        />
      )}

      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Header */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
              Data Import
            </p>
            <h1 className="text-2xl font-bold text-slate-800">
              <i className="fas fa-file-arrow-up mr-2.5 text-blue-600" />
              TPO File Upload
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Import Teacher Performance &amp; Observation records via Excel
            </p>
          </div>

          {/* Main card */}
          <div className="bg-white rounded-2xl card border border-slate-100 overflow-hidden">
            {/* ── Type + Drop zone ── */}
            <div className="px-6 pt-6 pb-6 space-y-5">
              {/* Combo box */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Upload Type <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {currentTypeMeta ? (
                      <i
                        className={`fas ${currentTypeMeta.icon} text-sm`}
                        style={{ color: currentTypeMeta.color }}
                      />
                    ) : (
                      <i className="fas fa-layer-group text-sm text-slate-300" />
                    )}
                  </span>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setStagedFiles([]);
                      setUploadError("");
                      setUploadSuccess(false);
                    }}
                    disabled={isUploading}
                    className="w-full appearance-none border rounded-xl pl-9 pr-10 py-3 text-sm font-medium text-slate-700 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={
                      currentTypeMeta
                        ? {
                            borderColor: `${currentTypeMeta.color}55`,
                            backgroundColor: `${currentTypeMeta.color}08`,
                          }
                        : { borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }
                    }
                  >
                    <option value="" disabled>
                      — Select upload type —
                    </option>
                    {UPLOAD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <i className="fas fa-chevron-down text-xs" />
                  </span>
                </div>
              </div>

              {/* Drop zone */}
              {selectedType ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Select File
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() =>
                      !isUploading && fileInputRef.current?.click()
                    }
                    className="relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer"
                    style={{
                      borderColor: isDragging
                        ? currentTypeMeta?.color
                        : "#cbd5e1",
                      backgroundColor: isDragging
                        ? `${currentTypeMeta?.color}0d`
                        : "#f8fafc",
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleBrowse}
                    />
                    <div className="flex flex-col items-center justify-center py-9 select-none">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                        style={{
                          backgroundColor: isDragging
                            ? `${currentTypeMeta?.color}18`
                            : "#f1f5f9",
                          border: `1.5px solid ${isDragging ? currentTypeMeta?.color + "44" : "#e2e8f0"}`,
                        }}
                      >
                        <i className="fas fa-file-excel text-xl text-emerald-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">
                        {isDragging
                          ? "Release to stage"
                          : "Drag & drop Excel file here"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        or{" "}
                        <span className="underline text-blue-500">browse</span>{" "}
                        — .xlsx / .xls only
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/40 flex flex-col items-center justify-center py-9">
                  <i className="fas fa-hand-pointer text-2xl text-slate-200 mb-2" />
                  <p className="text-sm text-slate-300">
                    Select an upload type above to begin
                  </p>
                </div>
              )}
            </div>

            {/* ── Staged files table ── */}
            <div className="border-t border-slate-100">
              <div className="flex items-center justify-between px-6 py-3 bg-slate-50/60">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  Staged File
                  {stagedFiles.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold text-[11px]">
                      {stagedFiles.length}
                    </span>
                  )}
                </p>
                {stagedFiles.length > 0 && !isUploading && (
                  <button
                    onClick={() => {
                      setStagedFiles([]);
                      setUploadError("");
                      setUploadSuccess(false);
                    }}
                    className="text-xs text-red-400 hover:text-red-500 font-medium flex items-center gap-1 transition-colors"
                  >
                    <i className="fas fa-xmark" /> Clear
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 w-8">
                        #
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
                        File Name
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
                        Type
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
                        Size
                      </th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {stagedFiles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center">
                          <i className="fas fa-inbox text-2xl text-slate-200 block mb-2" />
                          <p className="text-xs text-slate-300">
                            No file staged yet
                          </p>
                        </td>
                      </tr>
                    ) : (
                      stagedFiles.map((item, idx) => (
                        <StagedFileRow
                          key={item.id}
                          item={item}
                          index={idx}
                          onRemove={handleRemove}
                          isUploading={isUploading}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
              {/* Feedback */}
              <div className="flex-1 min-w-0">
                {uploadError && (
                  <p className="flex items-center gap-2 text-xs text-red-500">
                    <i className="fas fa-circle-xmark flex-shrink-0" />
                    <span className="truncate">{uploadError}</span>
                  </p>
                )}
                {uploadSuccess && !uploadError && (
                  <p className="flex items-center gap-2 text-xs text-emerald-600">
                    <i className="fas fa-circle-check flex-shrink-0" />
                    File uploaded successfully!
                  </p>
                )}
                {!uploadError && !uploadSuccess && (
                  <p className="text-xs text-slate-400">
                    {canUpload
                      ? `Ready — ${currentTypeMeta?.label}`
                      : "Select a type and stage a file to continue"}
                  </p>
                )}
              </div>

              {/* Upload button — only active when a file is staged + type selected */}
              <button
                onClick={handleUpload}
                disabled={!canUpload}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                style={
                  canUpload
                    ? {
                        background: `linear-gradient(135deg, ${currentTypeMeta?.color}, ${currentTypeMeta?.color}bb)`,
                        boxShadow: `0 4px 14px ${currentTypeMeta?.color}44`,
                      }
                    : { backgroundColor: "#94a3b8" }
                }
              >
                <i className="fas fa-cloud-arrow-up" />
                Upload
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-xs text-slate-400 text-center">
            <i className="fas fa-circle-info mr-1.5" />
            The page will be locked until the upload completes.
          </p>
        </div>
      </div>
    </>
  );
};

export default TeacherObservation;
