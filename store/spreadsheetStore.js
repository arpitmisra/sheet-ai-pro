import { create } from 'zustand';
import { evaluateFormula } from '@/lib/spreadsheet/formulaEngine';
import { upsertCell, getSheetCells } from '@/lib/supabase/client';
import { debounce } from '@/lib/utils';

/**
 * Spreadsheet Store - Manages sheet state and operations
 */
export const useSpreadsheetStore = create((set, get) => ({
  // State
  sheetId: null,
  cells: {}, // { "A1": { value: 10, formula: null }, ... }
  selectedCell: null,
  isLoading: false,
  rows: 100,
  cols: 26,

  /**
   * Initialize spreadsheet with sheet ID
   */
  initializeSheet: async (sheetId) => {
    set({ isLoading: true, sheetId });
    
    try {
      const { data, error } = await getSheetCells(sheetId);
      
      if (error) throw error;
      
      // Convert array of cells to object
      const cellsObj = {};
      if (data) {
        data.forEach((cell) => {
          const ref = colToLetter(cell.col) + (cell.row + 1);
          cellsObj[ref] = {
            value: cell.value,
            formula: cell.formula,
            row: cell.row,
            col: cell.col,
          };
        });
      }
      
      set({ cells: cellsObj, isLoading: false });
    } catch (error) {
      console.error('Error loading sheet:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Get cell value (computed if formula)
   */
  getCellValue: (cellRef) => {
    const { cells } = get();
    const cell = cells[cellRef];
    
    if (!cell) return '';
    
    if (cell.formula) {
      return evaluateFormula(cell.formula, cells);
    }
    
    return cell.value || '';
  },

  /**
   * Update cell value
   */
  updateCell: (cellRef, value, isFormula = false) => {
    const { cells, sheetId } = get();
    const parsedRef = parseCellReference(cellRef);
    
    if (!parsedRef) return;
    
    const { row, col } = parsedRef;
    
    // Update local state immediately
    const updatedCells = {
      ...cells,
      [cellRef]: {
        value: isFormula ? null : value,
        formula: isFormula ? value : null,
        row,
        col,
      },
    };
    
    set({ cells: updatedCells });
    
    // Debounced save to database
    debouncedSave(sheetId, row, col, value, isFormula ? value : null);
  },

  /**
   * Select a cell
   */
  selectCell: (cellRef) => {
    set({ selectedCell: cellRef });
  },

  /**
   * Clear selection
   */
  clearSelection: () => {
    set({ selectedCell: null });
  },

  /**
   * Delete cell content
   */
  deleteCell: (cellRef) => {
    const { cells, sheetId } = get();
    const parsedRef = parseCellReference(cellRef);
    
    if (!parsedRef) return;
    
    const { row, col } = parsedRef;
    
    // Remove from local state
    const updatedCells = { ...cells };
    delete updatedCells[cellRef];
    
    set({ cells: updatedCells });
    
    // Save to database
    debouncedSave(sheetId, row, col, null, null);
  },

  /**
   * Get all cells
   */
  getAllCells: () => {
    return get().cells;
  },
}));

/**
 * Debounced save to database (500ms delay)
 */
const debouncedSave = debounce(async (sheetId, row, col, value, formula) => {
  try {
    await upsertCell(sheetId, row, col, value, formula);
  } catch (error) {
    console.error('Error saving cell:', error);
  }
}, 500);

/**
 * Helper functions
 */

function colToLetter(col) {
  let letter = '';
  while (col >= 0) {
    letter = String.fromCharCode((col % 26) + 65) + letter;
    col = Math.floor(col / 26) - 1;
  }
  return letter;
}

function letterToCol(letter) {
  let col = 0;
  for (let i = 0; i < letter.length; i++) {
    col = col * 26 + letter.charCodeAt(i) - 64;
  }
  return col - 1;
}

function parseCellReference(ref) {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  
  return {
    col: letterToCol(match[1]),
    row: parseInt(match[2], 10) - 1,
  };
}
