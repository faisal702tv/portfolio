'use client';

import { SHORTCUTS_GROUPS } from '@/hooks/use-keyboard-shortcuts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="text-right">
          <DialogTitle>اختصارات لوحة المفاتيح</DialogTitle>
          <DialogDescription>لتسريع التنقل وتنفيذ الإجراءات بسرعة.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {SHORTCUTS_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="mb-2 text-sm font-bold text-primary">{group.title}</h4>
              <div className="space-y-2">
                {group.items.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    <span>{shortcut.label}</span>
                    <kbd className="rounded border bg-muted px-2 py-1 text-xs font-medium">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
