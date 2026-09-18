import React, { useState, useRef, useEffect } from 'react';
import { Sigma } from 'lucide-react';
import { MathSymbolPalette } from './MathSymbolPalette';

interface MathInsertButtonProps {
  onInsert: (latex: string) => void;
  title?: string;
}

export const MathInsertButton: React.FC<MathInsertButtonProps> = ({
  onInsert,
  title = 'Вставить математический символ',
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [open]);

  return (
    <div className="relative inline-block" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex-shrink-0 p-2 rounded-lg border transition-colors ${
          open
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
        }`}
        title={title}
      >
        <Sigma className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 mt-1 w-[400px] max-w-[90vw]">
          <MathSymbolPalette
            mode="plain"
            onInsert={latex => {
              onInsert(latex);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};