"use client";

import { QRCodeCanvas } from "qrcode.react";

interface MasterQRProps {
  value: string;
  label?: string;
  size?: number;
}

export function MasterQR({ value, label, size = 180 }: MasterQRProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-6 shadow-sm">
      <p className="text-sm font-medium text-foreground">
        {label || "Scan to view inventory"}
      </p>
      <div className="rounded-lg border border-border bg-white p-3">
        <QRCodeCanvas
          value={value}
          size={size}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
          includeMargin
        />
      </div>
      <p className="max-w-full truncate text-[10px] text-muted-foreground">
        {value}
      </p>
    </div>
  );
}
