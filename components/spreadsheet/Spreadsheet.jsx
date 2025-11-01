'use client';

import { useEffect, useState, useCallback } from 'react';
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

  useEffect(() => {
    if (sheetId) {
      initializeSheet(sheetId);
    }
  }, [sheetId, initializeSheet]);

  const handleCellClick = (row, col) => {
    const cellRef = `${colToLetter(col)}${row + 1}`;
    selectCell(cellRef);
    
    // Get the raw value/formula for editing
    const store = useSpreadsheetStore.getState();
    const cellData = store.cells[cellRef];
    
    if (cellData?.formula) {
      setEditValue(cellData.formula);
    } else {
      setEditValue(cellData?.value || '');
    }
  };

  const handleCellDoubleClick = (row, col) => {
    const cellRef = `${colToLetter(col)}${row + 1}`;
    setEditingCell(cellRef);
    
    const store = useSpreadsheetStore.getState();
    const cellData = store.cells[cellRef];
    
    if (cellData?.formula) {
      setEditValue(cellData.formula);
    } else {
      setEditValue(cellData?.value || '');
    }
  };

  const handleCellChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleCellBlur = () => {
    if (editingCell && editValue !== '') {
      const isFormula = editValue.startsWith('=');
      updateCell(editingCell, editValue, isFormula);
    } else if (editingCell && editValue === '') {
      // Clear cell if empty
      const store = useSpreadsheetStore.getState();
      store.deleteCell(editingCell);
    }
    
    setEditingCell(null);
  };

  const handleCellKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCellBlur();
      e.target.blur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleFormulaBarChange = useCallback((value) => {
    if (selectedCell) {
      setEditValue(value);
      const isFormula = value.startsWith('=');
      updateCell(selectedCell, value, isFormula);
    }
  }, [selectedCell, updateCell]);

  const renderCell = (row, col) => {
    const cellRef = `${colToLetter(col)}${row + 1}`;
    const isSelected = selectedCell === cellRef;
    const isEditing = editingCell === cellRef;
    const displayValue = isEditing ? editValue : getCellValue(cellRef);

    return (
      <div
        key={cellRef}
        className={`
          spreadsheet-cell
          ${isSelected ? 'selected' : ''}
        `}
        onClick={() => handleCellClick(row, col)}
        onDoubleClick={() => handleCellDoubleClick(row, col)}
        style={{
          minWidth: '100px',
          maxWidth: '200px',
          height: '30px',
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
            className="w-full h-full px-2 py-1 text-sm outline-none"
          />
        ) : (
          <div className="px-2 py-1 text-sm truncate">
            {displayValue}
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
            <div className="spreadsheet-header" style={{ minWidth: '50px', maxWidth: '50px', height: '30px' }}>
              {/* Empty corner */}
            </div>
            {Array.from({ length: cols }, (_, col) => (
              <div
                key={col}
                className="spreadsheet-header"
                style={{ minWidth: '100px', maxWidth: '200px', height: '30px' }}
              >
                {colToLetter(col)}
              </div>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex">
              {/* Row Header */}
              <div className="spreadsheet-header" style={{ minWidth: '50px', maxWidth: '50px', height: '30px' }}>
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
