'use client';

import Link from 'next/link';
import { BarChart3, Brain, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  buildAnalysisHref,
  getAnalysisTypeLabel,
  type AnalysisAssetContext,
} from '@/lib/analysis-links';

interface AssetAnalysisLinksProps {
  asset: AnalysisAssetContext;
}

export function AssetAnalysisLinks({ asset }: AssetAnalysisLinksProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="outline" className="text-[10px] h-6">
        {getAnalysisTypeLabel(asset.type)}
      </Badge>

      <Link href={buildAnalysisHref('/performance', asset)}>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-[11px] px-2">
          <Brain className="h-3 w-3" />
          تحليل AI
        </Button>
      </Link>

      <Link href={buildAnalysisHref('/technical-analysis', asset)}>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-[11px] px-2">
          <BarChart3 className="h-3 w-3" />
          فني
        </Button>
      </Link>

      <Link href={buildAnalysisHref('/risk-analysis', asset)}>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-[11px] px-2">
          <ShieldAlert className="h-3 w-3" />
          مخاطر
        </Button>
      </Link>
    </div>
  );
}
