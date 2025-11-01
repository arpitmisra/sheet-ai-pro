import { parseCellRef } from '../utils';

/**
 * Formula Engine for basic spreadsheet calculations
 * Supports: +, -, *, /, %, SUM, AVERAGE, COUNT, MIN, MAX, IF
 */

/**
 * Evaluate a formula
 * @param {string} formula - The formula string (e.g., "=SUM(A1:A10)")
 * @param {Object} cells - Cell data object { "A1": {value: 10}, ... }
 * @returns {number|string|Error}
 */
export function evaluateFormula(formula, cells) {
  if (!formula || !formula.startsWith('=')) {
    return formula;
  }

  try {
    const expression = formula.substring(1).trim();
    return evaluateExpression(expression, cells);
  } catch (error) {
    return `#ERROR: ${error.message}`;
  }
}

/**
 * Evaluate an expression
 */
function evaluateExpression(expr, cells) {
  // Handle functions first
  expr = replaceFunctions(expr, cells);
  
  // Replace cell references with values
  expr = replaceCellReferences(expr, cells);
  
  // Evaluate the mathematical expression
  try {
    // Safe eval using Function constructor (limited scope)
    const result = new Function('return ' + expr)();
    return result;
  } catch (error) {
    throw new Error('Invalid expression');
  }
}

/**
 * Replace cell references (A1, B2, etc.) with their values
 */
function replaceCellReferences(expr, cells) {
  const cellRegex = /([A-Z]+\d+)/g;
  
  return expr.replace(cellRegex, (match) => {
    const cellData = cells[match];
    if (!cellData) return '0';
    
    const value = cellData.value;
    if (value === null || value === undefined || value === '') return '0';
    
    // If it's a number, return it
    if (!isNaN(value)) return value;
    
    // If it's a string number, parse it
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
    
    return '0';
  });
}

/**
 * Replace function calls with their computed values
 */
function replaceFunctions(expr, cells) {
  // SUM function
  expr = expr.replace(/SUM\(([^)]+)\)/gi, (match, range) => {
    return computeSum(range, cells);
  });
  
  // AVERAGE function
  expr = expr.replace(/AVERAGE\(([^)]+)\)/gi, (match, range) => {
    return computeAverage(range, cells);
  });
  
  // COUNT function
  expr = expr.replace(/COUNT\(([^)]+)\)/gi, (match, range) => {
    return computeCount(range, cells);
  });
  
  // MIN function
  expr = expr.replace(/MIN\(([^)]+)\)/gi, (match, range) => {
    return computeMin(range, cells);
  });
  
  // MAX function
  expr = expr.replace(/MAX\(([^)]+)\)/gi, (match, range) => {
    return computeMax(range, cells);
  });
  
  // IF function
  expr = expr.replace(/IF\(([^,]+),([^,]+),([^)]+)\)/gi, (match, condition, trueVal, falseVal) => {
    return computeIf(condition, trueVal, falseVal, cells);
  });
  
  return expr;
}

/**
 * Get values from a range (e.g., A1:A10)
 */
function getRangeValues(range, cells) {
  const values = [];
  
  if (range.includes(':')) {
    // Range like A1:B10
    const [start, end] = range.split(':');
    const startRef = parseCellRef(start.trim());
    const endRef = parseCellRef(end.trim());
    
    if (!startRef || !endRef) return values;
    
    for (let row = startRef.row; row <= endRef.row; row++) {
      for (let col = startRef.col; col <= endRef.col; col++) {
        const cellRef = colToLetter(col) + (row + 1);
        const cellData = cells[cellRef];
        if (cellData && cellData.value !== null && cellData.value !== undefined && cellData.value !== '') {
          const num = parseFloat(cellData.value);
          if (!isNaN(num)) {
            values.push(num);
          }
        }
      }
    }
  } else {
    // Single cell or comma-separated list
    const parts = range.split(',').map(p => p.trim());
    parts.forEach(part => {
      const cellData = cells[part];
      if (cellData && cellData.value !== null && cellData.value !== undefined && cellData.value !== '') {
        const num = parseFloat(cellData.value);
        if (!isNaN(num)) {
          values.push(num);
        }
      }
    });
  }
  
  return values;
}

/**
 * SUM function
 */
function computeSum(range, cells) {
  const values = getRangeValues(range, cells);
  return values.reduce((sum, val) => sum + val, 0);
}

/**
 * AVERAGE function
 */
function computeAverage(range, cells) {
  const values = getRangeValues(range, cells);
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * COUNT function
 */
function computeCount(range, cells) {
  const values = getRangeValues(range, cells);
  return values.length;
}

/**
 * MIN function
 */
function computeMin(range, cells) {
  const values = getRangeValues(range, cells);
  if (values.length === 0) return 0;
  return Math.min(...values);
}

/**
 * MAX function
 */
function computeMax(range, cells) {
  const values = getRangeValues(range, cells);
  if (values.length === 0) return 0;
  return Math.max(...values);
}

/**
 * IF function
 */
function computeIf(condition, trueVal, falseVal, cells) {
  // Replace cell references in condition
  const evaluatedCondition = replaceCellReferences(condition, cells);
  
  try {
    const result = new Function('return ' + evaluatedCondition)();
    return result ? trueVal.trim() : falseVal.trim();
  } catch {
    return falseVal.trim();
  }
}

/**
 * Helper to convert column index to letter
 */
function colToLetter(col) {
  let letter = '';
  while (col >= 0) {
    letter = String.fromCharCode((col % 26) + 65) + letter;
    col = Math.floor(col / 26) - 1;
  }
  return letter;
}

/**
 * Validate formula syntax
 */
export function validateFormula(formula) {
  if (!formula || !formula.startsWith('=')) {
    return { valid: true };
  }

  const expression = formula.substring(1).trim();
  
  // Check for balanced parentheses
  let parenthesesCount = 0;
  for (const char of expression) {
    if (char === '(') parenthesesCount++;
    if (char === ')') parenthesesCount--;
    if (parenthesesCount < 0) {
      return { valid: false, error: 'Unbalanced parentheses' };
    }
  }
  
  if (parenthesesCount !== 0) {
    return { valid: false, error: 'Unbalanced parentheses' };
  }

  return { valid: true };
}
