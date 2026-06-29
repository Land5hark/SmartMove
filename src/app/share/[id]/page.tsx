import { getBoxShareUrl } from "@/lib/app-url";
import { getBoxPublic } from "@/lib/supabase-boxes";
import type { BoxItem } from "@/types";
import Image from "next/image";
import { notFound } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ShareBoxPage({ params }: Props) {
  const { id } = await params;
  const box = await getBoxPublic(id);

  if (!box) notFound();

  const shareUrl = getBoxShareUrl(box.id);
  const thumbnailSrc =
    box.photoUrls?.[box.thumbnailIndex ?? 0] ?? box.photoUrl;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            SmartMove
          </p>
          <h1 className="text-xl font-bold">Box Contents</h1>
          <p className="text-sm font-mono text-muted-foreground">
            #{box.id.substring(0, 8)}
          </p>
          {box.assignedRoom && (
            <span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
              {box.assignedRoom}
            </span>
          )}
        </div>

        {/* Thumbnail */}
        {thumbnailSrc && (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-secondary">
            <Image
              src={thumbnailSrc}
              alt="Box contents"
              fill
              className="object-contain"
            />
          </div>
        )}

        {/* Items list */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Items ({box.items.length})
          </h2>
          {box.items.length > 0 ? (
            <ul className="space-y-1.5">
              {box.items.map((item: BoxItem, idx: number) => (
                <li
                  key={item.id ?? idx}
                  className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.count && item.count > 1 && (
                    <span className="text-xs text-muted-foreground">
                      ×{item.count}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              No items listed yet.
            </p>
          )}
        </div>

        {/* Manual notes */}
        {box.manualDescription && (
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Notes
            </h2>
            <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              {box.manualDescription}
            </p>
          </div>
        )}

        {/* Self-referencing QR */}
        <div className="flex flex-col items-center gap-2 border-t pt-6">
          <div className="rounded-xl border bg-white p-3 shadow-sm">
            <QRCodeCanvas
              value={shareUrl}
              size={120}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Scan to view this box
          </p>
        </div>
      </div>
    </div>
  );
}
