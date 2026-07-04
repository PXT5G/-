'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeDisplayProps {
  value: string;
  className?: string;
}

export function BarcodeDisplay({ value, className }: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          lineColor: '#D4AF37',
          background: 'transparent',
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 10,
          margin: 4,
        });
      } catch {
        /* invalid barcode value */
      }
    }
  }, [value]);

  return (
    <div className={`bg-white/5 rounded-lg p-2 ${className ?? ''}`}>
      <svg ref={svgRef} className="w-full" />
    </div>
  );
}
