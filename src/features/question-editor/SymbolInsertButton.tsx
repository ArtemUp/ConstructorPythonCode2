import React, { useState, useRef, useEffect } from 'react';
import { Sigma, Code2 } from 'lucide-react';
import { MathSymbolPalette } from './MathSymbolPalette';
import { PythonSymbolPalette } from './PythonSymbolPalette';

type Subject = 'python' | 'math';

interface SymbolInsertButtonProps {
  onInsert: (text: string) => void;
  subject?: Subject;
  title?: string;
}

export const SymbolInsertButton: React.FC<SymbolInsertButtonProps> = ({
  onInsert,
  subject = 'python',
  title,
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

  const isMath = subject === 'math';
  const Icon = isMath ? Sigma : Code2;
  const defaultTitle = isMath
    ? 'Вставить математический символ'
    : 'Вставить элемент Python';

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
        title={title || defaultTitle}
      >
        <Icon className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 mt-1 w-[420px] max-w-[90vw]">
          {isMath ? (
            <MathSymbolPalette
              mode="plain"
              onInsert={text => {
                onInsert(text);
                setOpen(false);
              }}
            />
          ) : (
            <PythonSymbolPalette
              onInsert={text => {
                onInsert(text);
                setOpen(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};