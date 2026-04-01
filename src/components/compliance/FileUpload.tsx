"use client";

import { useState, useRef, useCallback } from "react";
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/validation/schemas";

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  error: string | null;
  onError: (error: string | null) => void;
}

const ACCEPT = ALLOWED_EXTENSIONS.join(",");

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return "Invalid file type. Please upload a PDF or Word document (.docx).";
  }
  if (
    !ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number]) &&
    file.type !== ""
  ) {
    return "Invalid file type. Please upload a PDF or Word document (.docx).";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large (${formatFileSize(file.size)}). Maximum file size is 10MB.`;
  }
  if (file.size === 0) {
    return "File is empty. Please select a valid document.";
  }
  return null;
}

export default function FileUpload({
  file,
  onFileSelect,
  error,
  onError,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (f: File) => {
      const validationError = validateFile(f);
      if (validationError) {
        onError(validationError);
        onFileSelect(null);
      } else {
        onError(null);
        onFileSelect(f);
      }
    },
    [onFileSelect, onError]
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
    // Reset input so re-selecting the same file triggers onChange
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleClear() {
    onFileSelect(null);
    onError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleInputChange}
        style={{ display: "none" }}
      />

      {!file ? (
        /* Drop zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? "var(--color-accent)" : "var(--color-border)"}`,
            borderRadius: "2px",
            padding: "40px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: isDragging
              ? "color-mix(in srgb, var(--color-accent) 5%, var(--color-bg-tertiary))"
              : "var(--color-bg-tertiary)",
            transition: "border-color 0.15s ease, background 0.15s ease",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "14px",
              color: "var(--color-text-primary)",
              marginBottom: "8px",
            }}
          >
            Drop your file here or{" "}
            <span style={{ color: "var(--color-accent)", fontWeight: 500 }}>
              click to browse
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "12px",
              color: "var(--color-text-secondary)",
            }}
          >
            PDF or DOCX, up to 10MB
          </div>
        </div>
      ) : (
        /* Selected file display */
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-border)",
            borderRadius: "2px",
            padding: "14px 16px",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-geist)",
                fontSize: "13px",
                color: "var(--color-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-ibm-plex-mono)",
                fontSize: "11px",
                color: "var(--color-text-secondary)",
                marginTop: "2px",
              }}
            >
              {formatFileSize(file.size)}
            </div>
          </div>
          <button
            onClick={handleClear}
            aria-label="Remove selected file"
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              fontFamily: "var(--font-geist)",
              fontSize: "12px",
              padding: "4px 8px",
              flexShrink: 0,
            }}
          >
            Remove
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "12px",
            color: "var(--color-critical)",
            marginTop: "8px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
