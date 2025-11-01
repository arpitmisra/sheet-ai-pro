'use client';

import { useState, useEffect } from 'react';

export default function FormulaBar({ selectedCell, value, onChange }) {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    if (onChange) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (onChange) {
        onChange(localValue);
      }
      e.target.blur();
    }
  };

  return (
    <div className="formula-bar border-b border-gray-300 bg-white">
      <div className="flex items-center gap-4 px-4 py-2">
        {/* Cell Reference */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Cell:</span>
          <span className="px-3 py-1 bg-gray-100 rounded text-sm font-mono">
            {selectedCell || '—'}
          </span>
        </div>

        {/* Formula Input */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">fx</span>
          <input
            type="text"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Enter value or formula (=SUM(A1:A10))"
            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedCell}
          />
        </div>
      </div>
    </div>
  );
}
