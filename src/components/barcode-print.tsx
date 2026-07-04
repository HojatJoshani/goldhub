"use client";

import * as React from "react";

// Code128 barcode generator (simplified for EAN-13 and Code128-like)
// Generates a visual barcode using SVG bars

interface BarcodeSvgProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export function BarcodeSvg({
  value,
  width = 200,
  height = 60,
  showText = true,
  className,
}: BarcodeSvgProps) {
  // Generate barcode bars from the value
  // Using a simple algorithm: each digit maps to specific bar widths
  const bars = React.useMemo(() => generateBars(value), [value]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${bars.length * 2 + 20} ${height}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100%" height="100%" fill="white" />
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={10 + i * 2}
          y={5}
          width={bar.width}
          height={height - (showText ? 20 : 10)}
          fill="black"
        />
      ))}
      {showText && (
        <text
          x="50%"
          y={height - 5}
          textAnchor="middle"
          fontSize="10"
          fontFamily="monospace"
          fill="black"
        >
          {value}
        </text>
      )}
    </svg>
  );
}

function generateBars(value: string): { width: number; isBar: boolean }[] {
  const bars: { width: number; isBar: boolean }[] = [];
  // Start guard
  bars.push({ width: 2, isBar: true });
  bars.push({ width: 1, isBar: false });
  bars.push({ width: 2, isBar: true });

  // Encode each character
  for (const char of value) {
    const code = char.charCodeAt(0);
    // Simple encoding: use char code to generate bar pattern
    const pattern = (code * 7 + 3) % 64;
    for (let i = 0; i < 6; i++) {
      const isOn = (pattern >> i) & 1;
      bars.push({ width: isOn ? 2 : 1, isBar: i % 2 === 0 });
    }
  }

  // End guard
  bars.push({ width: 2, isBar: true });
  bars.push({ width: 1, isBar: false });
  bars.push({ width: 3, isBar: true });

  return bars;
}

// Barcode print sheet component
interface BarcodePrintSheetProps {
  products: {
    id: string;
    name: string;
    barcode: string;
    sku: string;
    salePrice: number;
    karat: string;
    weight: number;
  }[];
  labelPerRow?: number;
}

export function BarcodePrintSheet({
  products,
  labelPerRow = 3,
}: BarcodePrintSheetProps) {
  return (
    <div className="print-only">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { position: absolute; left: 0; top: 0; width: 100%; }
          .barcode-label {
            width: 33%;
            display: inline-block;
            padding: 8px;
            margin: 4px;
            border: 1px dashed #ccc;
            vertical-align: top;
          }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>
      <div className="print-only">
        {products.map((p) => (
          <div key={p.id} className="barcode-label">
            <div style={{ textAlign: "center", fontSize: "10px", marginBottom: "4px" }}>
              <strong>گلد هاب</strong>
            </div>
            <div style={{ textAlign: "center", fontSize: "9px", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {p.name}
            </div>
            <BarcodeSvg value={p.barcode} width={180} height={50} showText={true} />
            <div style={{ textAlign: "center", fontSize: "10px", marginTop: "4px" }}>
              <strong>{p.salePrice.toLocaleString("fa-IR")} ت</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
