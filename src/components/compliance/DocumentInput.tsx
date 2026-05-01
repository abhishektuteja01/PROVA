"use client";

import { useState } from "react";
import TextArea from "@/components/ui/TextArea";
import Button from "@/components/ui/Button";
import FileUpload from "./FileUpload";
import {
  ModelTypeEnum,
  MODEL_TYPE_LABELS,
  type ModelType,
} from "@/lib/validation/schemas";

type InputMode = "text" | "file";

interface DocumentInputProps {
  onSubmit: (data: {
    modelName: string;
    modelType: ModelType;
    documentText?: string;
    file?: File;
  }) => void;
  isLoading: boolean;
}

export default function DocumentInput({
  onSubmit,
  isLoading,
}: DocumentInputProps) {
  const [mode, setMode] = useState<InputMode>("text");
  const [modelName, setModelName] = useState("");
  const [modelType, setModelType] = useState<ModelType>("other");
  const [documentText, setDocumentText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [modelNameError, setModelNameError] = useState<string | null>(null);

  const isTextValid = mode === "text" && documentText.length >= 100;
  const isFileValid = mode === "file" && file !== null && !fileError;
  const isModelNameValid = modelName.trim().length > 0 && modelName.length <= 200;
  const canSubmit = isModelNameValid && (isTextValid || isFileValid) && !isLoading;

  function handleModelNameChange(value: string) {
    setModelName(value);
    if (value.trim().length === 0) {
      setModelNameError("Model name is required.");
    } else if (value.length > 200) {
      setModelNameError("Model name must be under 200 characters.");
    } else if (!/^[a-zA-Z0-9 \-_().]+$/.test(value)) {
      setModelNameError("Model name contains invalid characters.");
    } else {
      setModelNameError(null);
    }
  }

  function handleSubmit() {
    if (!canSubmit) return;

    if (mode === "text") {
      onSubmit({ modelName: modelName.trim(), modelType, documentText });
    } else if (file) {
      onSubmit({ modelName: modelName.trim(), modelType, file });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Model Name */}
      <div>
        <label
          style={{
            display: "block",
            fontFamily: "var(--font-geist)",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Model Name
        </label>
        <input
          type="text"
          value={modelName}
          onChange={(e) => handleModelNameChange(e.target.value)}
          placeholder="e.g., Credit Risk Model v3"
          maxLength={200}
          className="focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "14px",
            color: "var(--color-text-primary)",
            background: "var(--color-bg-tertiary)",
            border: `1px solid ${modelNameError ? "var(--color-critical)" : "var(--color-border)"}`,
            borderRadius: "2px",
            padding: "10px 14px",
            width: "100%",
            transition: "border-color 0.15s ease",
          }}
        />
        {modelNameError && (
          <div
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "12px",
              color: "var(--color-critical)",
              marginTop: "6px",
            }}
          >
            {modelNameError}
          </div>
        )}
      </div>

      {/* Model Type */}
      <div>
        <label
          htmlFor="model-type-select"
          style={{
            display: "block",
            fontFamily: "var(--font-geist)",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Model Type
        </label>
        <select
          id="model-type-select"
          value={modelType}
          onChange={(e) => setModelType(e.target.value as ModelType)}
          className="focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "14px",
            color: "var(--color-text-primary)",
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-border)",
            borderRadius: "2px",
            padding: "10px 14px",
            width: "100%",
            transition: "border-color 0.15s ease",
            appearance: "none",
            cursor: "pointer",
          }}
        >
          {ModelTypeEnum.options.map((value) => (
            <option key={value} value={value}>
              {MODEL_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
        <div
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "11px",
            color: "var(--color-text-secondary)",
            marginTop: "6px",
            opacity: 0.7,
          }}
        >
          Used to compare your assessment against similar models in the corpus.
        </div>
      </div>

      {/* Mode toggle */}
      <div>
        <div
          style={{
            display: "flex",
            gap: "0",
            marginBottom: "16px",
          }}
        >
          {(["text", "file"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                fontFamily: "var(--font-geist)",
                fontSize: "12px",
                fontWeight: 500,
                padding: "8px 20px",
                cursor: "pointer",
                border: "1px solid var(--color-border)",
                borderRadius: m === "text" ? "2px 0 0 2px" : "0 2px 2px 0",
                marginLeft: m === "file" ? "-1px" : 0,
                background:
                  mode === m ? "var(--color-accent)" : "transparent",
                color:
                  mode === m
                    ? "var(--color-text-primary)"
                    : "var(--color-text-secondary)",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              {m === "text" ? "Paste Text" : "Upload File"}
            </button>
          ))}
        </div>

        {/* Text input */}
        {mode === "text" && (
          <div>
            <TextArea
              value={documentText}
              onChange={setDocumentText}
              placeholder="Paste your model documentation here (minimum 100 characters)..."
              rows={12}
              maxLength={50000}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "6px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-ibm-plex-mono)",
                  fontSize: "11px",
                  color:
                    documentText.length > 0 && documentText.length < 100
                      ? "var(--color-warning)"
                      : "var(--color-text-secondary)",
                }}
              >
                {documentText.length.toLocaleString()} / 50,000
                {documentText.length > 0 && documentText.length < 100 && (
                  <span style={{ marginLeft: "8px" }}>
                    ({100 - documentText.length} more needed)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* File upload */}
        {mode === "file" && (
          <FileUpload
            file={file}
            onFileSelect={setFile}
            error={fileError}
            onError={setFileError}
          />
        )}
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: "100%",
          padding: "14px",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        {isLoading ? "Analyzing document..." : "Run Compliance Check"}
      </Button>
    </div>
  );
}
