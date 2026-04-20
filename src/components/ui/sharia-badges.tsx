'use client';

import { Badge } from '@/components/ui/badge';

export interface ShariaData {
  shariaStatus?: string;
  shariaBilad?: string;
  shariaRajhi?: string;
  shariaMaqasid?: string;
  shariaZero?: string;
}

function badgeColor(value: string | undefined) {
  if (!value) return '';
  if (value === 'نقي' || value === 'حلال') return 'border-green-400 text-green-600 bg-green-50';
  if (value === 'مختلط') return 'border-yellow-400 text-yellow-600 bg-yellow-50';
  return 'border-red-400 text-red-600 bg-red-50';
}

function statusColor(value: string | undefined) {
  if (!value) return '';
  if (value === 'نقي' || value === 'حلال') return 'bg-green-100 text-green-700 border-green-300';
  if (value === 'مختلط') return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  return 'bg-red-100 text-red-700 border-red-300';
}

/** Full sharia panel for add/edit dialogs */
export function ShariaBadgesPanel({ shariaStatus, shariaBilad, shariaRajhi, shariaMaqasid, shariaZero }: ShariaData) {
  const hasAnyValue = Boolean(shariaStatus || shariaBilad || shariaRajhi || shariaMaqasid || shariaZero);
  if (!hasAnyValue) return null;

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="mb-2 text-xs font-semibold text-primary">التصنيف الشرعي</p>
      <div className="flex flex-wrap gap-2">
        {shariaStatus && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">الحالة:</span>
            <Badge className={`text-xs ${statusColor(shariaStatus)}`}>{shariaStatus}</Badge>
          </div>
        )}
        {shariaBilad && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">البلاد:</span>
            <Badge variant="outline" className={`text-xs ${badgeColor(shariaBilad)}`}>{shariaBilad}</Badge>
          </div>
        )}
        {shariaRajhi && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">الراجحي:</span>
            <Badge variant="outline" className={`text-xs ${badgeColor(shariaRajhi)}`}>{shariaRajhi}</Badge>
          </div>
        )}
        {shariaMaqasid && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">المقاصد:</span>
            <Badge variant="outline" className={`text-xs ${badgeColor(shariaMaqasid)}`}>{shariaMaqasid}</Badge>
          </div>
        )}
        {shariaZero && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">صفر ديون:</span>
            <Badge variant="outline" className={`text-xs ${badgeColor(shariaZero)}`}>{shariaZero}</Badge>
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact inline sharia badge for list items */
export function ShariaInlineBadge({ shariaStatus }: { shariaStatus?: string }) {
  if (!shariaStatus) return null;

  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${badgeColor(shariaStatus)}`}>
      {shariaStatus}
    </Badge>
  );
}
