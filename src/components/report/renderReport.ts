import type { Gap } from "@/lib/validation/schemas";
import path from "path";

// Vercel Serverless Framework File Trace Hint:
// This statically analyzers the public/fonts/pdf directory so that 
// it gets bundled in production for @react-pdf/renderer
const _ = path.join(process.cwd(), "public/fonts/pdf");
export interface RenderReportProps {
  modelName: string;
  versionNumber: number;
  finalScore: number;
  status: string;
  pillarScores: {
    conceptual_soundness: number;
    outcomes_analysis: number;
    ongoing_monitoring: number;
  };
  gaps: Gap[];
  confidenceLabel: string;
  createdAt: string;
}

function patchReact19Elements(node: any): any {
  if (!node || typeof node !== "object") return node;

  if (Array.isArray(node)) {
    return node.map(patchReact19Elements);
  }

  // If node is a React element
  if (node.$$typeof) {
    let newChildren = node.props?.children;
    if (newChildren !== undefined) {
      newChildren = patchReact19Elements(newChildren);
    }
    
    const newProps = { ...node.props, children: newChildren };
    
    return {
      $$typeof: Symbol.for("react.element"),
      type: node.type,
      key: node.key ?? null,
      ref: null, // Avoid React 19 ref getter issues causing Error 284
      props: newProps,
      _owner: null,
      _store: {}
    };
  }

  return node;
}

export async function renderReport(props: RenderReportProps): Promise<Buffer> {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const React = require("react");
  const pdf = require("@react-pdf/renderer");
  const { buildReportElement } = require("./ReportDocument");
  /* eslint-enable @typescript-eslint/no-require-imports */

  let element = buildReportElement(React, pdf, props);
  element = patchReact19Elements(element);
  return pdf.renderToBuffer(element);
}
