import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Convert column index to letter (0 -> A, 1 -> B, etc.)
 */
export function colToLetter(col) {
  let letter = '';
  while (col >= 0) {
    letter = String.fromCharCode((col % 26) + 65) + letter;
    col = Math.floor(col / 26) - 1;
  }
  return letter;
}

/**
 * Convert column letter to index (A -> 0, B -> 1, etc.)
 */
export function letterToCol(letter) {
  let col = 0;
  for (let i = 0; i < letter.length; i++) {
    col = col * 26 + letter.charCodeAt(i) - 64;
  }
  return col - 1;
}

/**
 * Get cell reference (e.g., A1, B2)
 */
export function getCellRef(row, col) {
  return `${colToLetter(col)}${row + 1}`;
}

/**
 * Parse cell reference to row and column
 */
export function parseCellRef(ref) {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  
  return {
    col: letterToCol(match[1]),
    row: parseInt(match[2], 10) - 1,
  };
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  if (typeof num !== 'number') return num;
  return num.toLocaleString('en-US');
}

/**
 * Check if value is a number
 */
export function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}
