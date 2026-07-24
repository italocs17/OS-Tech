import { useEffect, useCallback, useRef } from 'react';

interface ActionDropdownProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function ActionDropdown({ open, onClose, anchorRef, title, children, width = 'w-80' }: ActionDropdownProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        cardRef.current &&
        !cardRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    },
    [onClose, anchorRef]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleClickOutside, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={cardRef}
        className={`rounded-xl border bg-card shadow-xl ${width}`}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            ✕
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
