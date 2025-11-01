'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSpreadsheetStore } from '@/store/spreadsheetStore';
import { colToLetter } from '@/lib/utils';
import FormulaBar from './FormulaBar';

export default function Spreadsheet({ sheetId }) {
  const {
    initializeSheet,
    getCellValue,
    updateCell,
    selectCell,
    selectedCell,
    rows,
    cols,
  } = useSpreadsheetStore();

  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [columnWidths, setColumnWidths] = useState({});
  const [resizingCol, setResizingCol] = useState(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  useEffect(() => {
    if (sheetId) {
      initializeSheet(sheetId);
    }
  }, [sheetId, initializeSheet]);

  const handleCellClick = (row, col) => {
    const cellRef = `${colToLetter(col)}${row + 1}`;
    
    // If already editing this cell, don't reset
    if (editingCell === cellRef) return;
    
    // If clicking a different cell while editing, save and switch
    if (editingCell && editingCell !== cellRef) {
      handleCellBlur();
    }
    
    selectCell(cellRef);
    
    // Get the raw value/formula for editing
    const store = useSpreadsheetStore.getState();
    const cellData = store.cells[cellRef];
    
    if (cellData?.formula) {
      setEditValue(cellData.formula);
    } else {
      setEditValue(cellData?.value || '');
    }
    
    // Enter edit mode on single click
    setEditingCell(cellRef);
  };

  const handleCellDoubleClick = (row, col) => {
    // Double click is handled by single click now
    // This prevents issues with double-click selection
    return;
  };

  const handleCellChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleCellBlur = () => {
    if (editingCell) {
      if (editValue !== '') {
        const isFormula = editValue.startsWith('=');
        updateCell(editingCell, editValue, isFormula);
      } else {
        // Clear cell if empty
        const store = useSpreadsheetStore.getState();
        if (store.cells[editingCell]) {
          store.deleteCell(editingCell);
        }
      }
    }
    
    // Don't clear editing state on blur - only on Escape or cell switch
  };

  const handleCellKeyDown = (e) => {
    if (e.key === 'Enter') {
      const isFormula = editValue.startsWith('=');
      if (editingCell && editValue !== '') {
        updateCell(editingCell, editValue, isFormula);
      }
      setEditingCell(null);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
      e.preventDefault();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Save current cell
      if (editingCell && editValue !== '') {
        const isFormula = editValue.startsWith('=');
        updateCell(editingCell, editValue, isFormula);
      }
      
      // Move to next cell
      const match = selectedCell?.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const col = match[1];
        const row = parseInt(match[2]);
        const nextCol = String.fromCharCode(col.charCodeAt(0) + 1);
        const nextCell = `${nextCol}${row}`;
        selectCell(nextCell);
        setEditingCell(nextCell);
        
        const store = useSpreadsheetStore.getState();
        const cellData = store.cells[nextCell];
        setEditValue(cellData?.formula || cellData?.value || '');
      }
    }
  };

  const handleFormulaBarChange = useCallback((value) => {
    if (selectedCell) {
      setEditValue(value);
      const isFormula = value.startsWith('=');
      updateCell(selectedCell, value, isFormula);
    }
  }, [selectedCell, updateCell]);

  // Column resize handlers
  const handleResizeStart = (e, col) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(col);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = columnWidths[col] || 100;
  };

  useEffect(() => {
    if (resizingCol === null) return;

    const handleMouseMove = (e) => {
      const diff = e.clientX - resizeStartX.current;
      const newWidth = Math.max(50, resizeStartWidth.current + diff);
      setColumnWidths(prev => ({
        ...prev,
        [resizingCol]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setResizingCol(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol]);

  const getColumnWidth = (col) => {
    return columnWidths[col] || 100;
  };

  const renderCell = (row, col) => {
    const cellRef = `${colToLetter(col)}${row + 1}`;
    const isSelected = selectedCell === cellRef;
    const isEditing = editingCell === cellRef;
    const displayValue = isEditing ? editValue : getCellValue(cellRef);
    const width = getColumnWidth(col);

    return (
      <div
        key={cellRef}
        className={`
          spreadsheet-cell
          ${isSelected ? 'selected' : ''}
          ${isEditing ? 'editing' : ''}
        `}
        onClick={() => handleCellClick(row, col)}
        style={{
          width: `${width}px`,
          minWidth: `${width}px`,
          maxWidth: `${width}px`,
          height: '30px',
          cursor: 'cell',
        }}
      >
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={handleCellChange}
            onBlur={handleCellBlur}
            onKeyDown={handleCellKeyDown}
            autoFocus
            className="w-full h-full px-2 py-1 text-sm outline-none border-2 border-blue-500"
            style={{ backgroundColor: 'white' }}
          />
        ) : (
          <div 
            className="px-2 py-1 text-sm h-full flex items-center overflow-hidden"
            title={displayValue} // Show full text on hover
          >
            <span className="truncate">{displayValue || ''}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Formula Bar */}
      <FormulaBar
        selectedCell={selectedCell}
        value={editValue}
        onChange={handleFormulaBarChange}
      />

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="inline-block min-w-full">
          {/* Column Headers */}
          <div className="flex sticky top-0 z-10">
            <div className="spreadsheet-header" style={{ minWidth: '50px', maxWidth: '50px', width: '50px', height: '30px' }}>
              {/* Empty corner */}
            </div>
            {Array.from({ length: cols }, (_, col) => {
              const width = getColumnWidth(col);
              return (
                <div
                  key={col}
                  className="spreadsheet-header relative"
                  style={{ 
                    width: `${width}px`,
                    minWidth: `${width}px`,
                    maxWidth: `${width}px`,
                    height: '30px' 
                  }}
                >
                  {colToLetter(col)}
                  {/* Resize handle */}
                  <div
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 hover:w-1.5"
                    onMouseDown={(e) => handleResizeStart(e, col)}
                    style={{ 
                      background: resizingCol === col ? '#3b82f6' : 'transparent',
                      zIndex: 20
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex">
              {/* Row Header */}
              <div className="spreadsheet-header" style={{ minWidth: '50px', maxWidth: '50px', width: '50px', height: '30px' }}>
                {row + 1}
              </div>
              
              {/* Cells */}
              {Array.from({ length: cols }, (_, col) => renderCell(row, col))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
