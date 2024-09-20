import { CellList, INotebookTracker } from '@jupyterlab/notebook';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { IKernelConnection } from '@jupyterlab/services/lib/kernel/kernel';
import { customAlphabet } from "nanoid";
// import { LabIcon } from '@jupyterlab/ui-components';

import { CompletionHandler } from '@jupyterlab/completer';
import { _commonDict, _debugVarInfo, _myCompletionItem } from "./interfaces";
import { IColStyleAll, IDFInfoAll, IDFStyleAll, IPreviewItems, IPreviewNewTables, TCellSpecialStyle, TCellValue, TDFRow, TSupportOp } from './sidePanel/interface';
import _ from 'lodash';

// 保留两位小数
export const toFix = (s: number | string) => {
  if (typeof s !== "number") return s;
  let t = Number(s);
  if (t % 1 != 0) {
    return t.toFixed(2);
  } else {
    return t;
  }
};

export const isNumeric = (value: string) => {
  const value_n = parseFloat(value);
  const cond1 = !isNaN(value_n);
  const cond2 = isFinite(value_n);
  return cond1 && cond2;
};

const _nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz", 30);

export function myNanoid(len?: number) {
  return _nanoid(len);
};

export function fillNull<T> (arr: Array<T | null>, num: number): Array<T | null> {
  for(let i = 0; i < num; i++){
    arr.push(null);
  }
  return arr;
}

export function tableAddPreviewColumn(header: TCellValue[], table: TCellValue[][], previewItem: IPreviewItems, dfName: string) {
  const piOfDfName = previewItem.newColumns[dfName];
  if (piOfDfName === undefined) {
    return;
  }
  for (const colName in piOfDfName) {
    const idx = header.indexOf(colName);
    // Insert to the right
    header.splice(idx + 1, 0, piOfDfName[colName].newColumn); // @TODO to make the column unique
    table.forEach((row, numRow) => {
      row.splice(idx + 1, 0, piOfDfName[colName].sample[numRow]);
    });
  }
} 

// BR: bounding rectangle
export function getTableBRShape<T>(table: T[][]): [number, number] {
  let rowSize = table.length;
  let columnSize = 0;
  for (let i = 0; i < rowSize; i++) {
    if (columnSize < table[i].length) {
      columnSize = table[i].length;
    }
  }
  return [rowSize, columnSize];
}

function _getCellTextLines(cells: CellList, i: number) {
  const _s = cells.get(i).toJSON().source;
  let sListComplete: string[];
  if (_s instanceof Array) {
    sListComplete = _s
  } else {
    sListComplete = _s.split("\n");
  }
  return sListComplete;
}

function _getCellTextLineBeforeCursor(sListComplete: string[], cursorPos: CodeEditor.IPosition) {
  const sListPartial = sListComplete.slice(0, cursorPos.line);
  sListPartial.push(sListComplete[cursorPos.line].slice(0, cursorPos.column));
  return sListPartial;
}

export function getKernel(notebooks: INotebookTracker) {
  const currentNotebook = notebooks.currentWidget;
  let session = null;
  let kernel = null;
  if (currentNotebook) {
    session = currentNotebook.sessionContext.session;
  } else {
    console.warn("[getKernel] No notebook available");
    return null;
  }
  if (session) {
    kernel = session.kernel;
  } else {
    console.warn("[getKernel]: No session available");
    return null;
  }
  if (kernel) {
    return kernel;
  } else {
    console.warn("[getKernel]: No kernel available");
    return null;
  }
}

export async function getActiveDataFrames(kernel: IKernelConnection) {
  let dfList: _debugVarInfo[] = [];
  try {
    //I don't know the seq
    const result = await kernel.requestDebug({seq: 2, command: "inspectVariables", type: "request"}).done;
    const body: _commonDict | null | undefined = result.content.body;
    if(body && body.variables) {
      const v: _debugVarInfo[] = body.variables;
      dfList = v.filter(v => v.type === "DataFrame");
    } else {
      console.warn("[getActiveDataFrames] No body or body.variables found");
    }
  } catch (error) {
    console.error("[getActiveDataFrames] Error fetching variable value:", error);
  }

  return dfList;
}

export function getPreviousText(notebooks: INotebookTracker, cursorPos: CodeEditor.IPosition): string[][] {
  const sources: string[][] = []; // every element source codes from a single cell
  const cw = notebooks.currentWidget;
  if (!cw || !cw.model) {
    console.warn("[getPreviousText] Warning: No current notebook or model");
    return sources;
  }
  const aci = cw.content.activeCellIndex;
  const cells = cw.model.cells;
  // We only consider code before cursor
  for (let i = 0; i <= aci; i++) {
    let s: string[] = _getCellTextLines(cells, i);
    if (i === aci) {
      s = _getCellTextLineBeforeCursor(s, cursorPos);
    }
    sources.push(s);
  }
  return sources;
}

export function getLastLine(notebooks: INotebookTracker, cursorPos: CodeEditor.IPosition): string | null {
  const pCode2D = getPreviousText(notebooks, cursorPos);
  if (pCode2D.length === 0) {
    console.warn("[getLastLine] no pCode2D found.");
    return null;
  }
  const lastCell = pCode2D[pCode2D.length-1];
  if (lastCell.length === 0) {
    console.warn("[getLastLine] no lastCell found.");
    return null;
  }
  const lastLine = lastCell[lastCell.length-1];
  return lastLine;
}

export function deDuplicateCompletionItems(items: _myCompletionItem[]): CompletionHandler.ICompletionItem[] {
  const seen: {[key: string]: boolean} = {};
  return items.filter(item => {
    if (seen[item.value]) {
      return false;
    }
    seen[item.value] = true;
    return true;
  }).map(item => {
    return {
      label: item.value,
      type: item.type,
      // documentation: (item.explanation) ? item.explanation : "1", // @TODO: add explanation to completion item
      // icon: new LabIcon({
      //   name: "svgstr",
      //   svgstr: SVGSTR,
      // })
    };
  });
}

export function getAllNewTablesFromPI(oldNewTables: IPreviewNewTables | undefined, oldAllDfInfo: IDFInfoAll | undefined): string[] {
  if (oldNewTables === undefined || oldAllDfInfo === undefined) {
    return [];
  }
  const res: string[] = [];  
  for (const dfName in oldNewTables) {
    const maybeNewTable: string = oldNewTables[dfName].newTable;
    if (!(maybeNewTable in oldAllDfInfo)) {
      res.push(maybeNewTable);
    }
  }
  return res;
}


export function initAllDfStyle(allDfInfo: IDFInfoAll, oldDfStyle: IDFStyleAll | undefined = undefined, oldNewTables: IPreviewNewTables | undefined = undefined, oldAllDfInfo: IDFInfoAll | undefined = undefined): IDFStyleAll {
  const allDfStyle: IDFStyleAll = {};
  const allNewTable = getAllNewTablesFromPI(oldNewTables, oldAllDfInfo);
  for (const dfName in allDfInfo) {
    const colsStyle: IColStyleAll = {};
    if (dfName in allDfStyle) {
      console.error(`[initialDfStyle] DataFrame name ${dfName} already exists in the allDfStyle object.`);
      continue;
    }
    // 1. init column style
    allDfInfo[dfName].columnNameList.forEach((col, i) => {
      if (col in colsStyle) {
        console.error(`[initialDfStyle] Column name ${col} already exists in the columns object.`);
        return;
      }
      if (oldDfStyle !== undefined && dfName in oldDfStyle && col in oldDfStyle[dfName].columns) {
        colsStyle[col] = _.cloneDeep(oldDfStyle[dfName].columns[col]);
      } else {
        colsStyle[col] = {
          colName: col,
          isHighlight: false
        };
      }
    });
    // 2. init DataFrame style
    if (oldDfStyle !== undefined && dfName in oldDfStyle) { // For existing DataFrame
      allDfStyle[dfName] = _.cloneDeep(oldDfStyle[dfName]);
      allDfStyle[dfName].columns = colsStyle;
    } else if (allNewTable.includes(dfName)) { // For the DataFrame previewed before
      allDfStyle[dfName] = {
        tableName: dfName,
        isFold: false,
        columns: colsStyle,
        isShowRows: true
      };
    } else { // For other cases
      allDfStyle[dfName] = {
        tableName: dfName,
        isFold: false, // @TODO: Currently we will automatically show the schema of the new table
        columns: colsStyle,
        isShowRows: false
      };
    }
  }
  return allDfStyle;
}

export function initAllDfSeq(allDfInfo: IDFInfoAll, oldAllDfSeq: string[] | undefined = undefined): string[] {
  if (oldAllDfSeq === undefined) {
    return Object.keys(allDfInfo);
  }
  const newAllDfSeq: string[] = [];
  oldAllDfSeq.forEach((d) => {
    if (d in allDfInfo) {
      newAllDfSeq.push(d);
    }
  });
  for (const d in allDfInfo) {
    if (!newAllDfSeq.includes(d)) {
      newAllDfSeq.push(d);
    }
  }
  return newAllDfSeq;
}

export function isCateColumn(dtype: string) {
  if (["string", "str", 'bool', '_bool'].includes(dtype)) {
    console.warn("[isCateColumn] Column type is string or boolean, which may not be supported.");
  } 
  return ["object", "string", "str", "category", 'bool', '_bool'].includes(dtype);
}

export function isTimeColumn(dtype: string) {
  return ["datetime64", "datetime64[ns]"].includes(dtype);
}

export function isNumColumn(dtype: string) {
  const INT_TYPE = ['int', 'int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'Int8', 'Int16', 'Int32', 'Int64', 'UInt8', 'UInt16', 'UInt32', 'UInt64'];
  const FLOAT_TYPE = ['float', 'float_', 'float16', 'float32', 'float64'];
  const NUM_TYPE = [...INT_TYPE, ...FLOAT_TYPE];
  return NUM_TYPE.includes(dtype) || isTimeColumn(dtype);
}

export function formatNumber(num: number, maxDecimalPlaces: number = 3, maxDecimalPlacesExp: number = 1, veryLargeThreshold: number = 1e5, verySmallThreshold: number = 1e-3): string {
  let numStr = num.toString();
  // Special case
  if (numStr === "0" || numStr === "NaN") {
    return numStr;
  }
  // If the number is very large or very small, use exponential notation
  if (Math.abs(num) >= veryLargeThreshold || Math.abs(num) <= verySmallThreshold) {
    numStr = num.toExponential();
  }

  // Exponential
  const numStrSplit = numStr.split("e");
  if (numStrSplit.length > 2) {
    console.error("[formatNumber] Invalid number format:", numStr);
    return "NaN";
  } else if (numStrSplit.length === 2) {
    return `${formatNumber(parseFloat(numStrSplit[0]), maxDecimalPlaces - 2, maxDecimalPlacesExp)}e${numStrSplit[1]}`;
  }
  // Common case
  const decimalPlaces = getDecimalPlaces(num);
  if (decimalPlaces > maxDecimalPlaces) {
    return num.toFixed(maxDecimalPlaces);
  } else {
    return num.toString();
  }
}

// 辅助函数，用于获取数字的小数位数
function getDecimalPlaces(num: number): number {
  const match = /\.(\d+)/.exec(num.toString());
  if (match) {
    return match[1].length;
  }
  return 0;
}

export function timeMilliSecond(t: number): number { //must be 13-bit.
  while(t < 1000000000000) { //10^12: 2001-9-9 9:46:40
    t *= 10;
  }
  while(t >= 10000000000000) { //10^13: 2286-11-21 1:46:40
    t /= 10;
  }
  return t;
};

export function removeQuotes(s: string): string {
  if (s.startsWith("'''") && s.endsWith("'''")) {
    return s.slice(3, -3);
  } else if (s.startsWith('"""') && s.endsWith('"""')) {
    return s.slice(3, -3);
  } else if (s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1);
  } else if (s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1);
  } else {
    return s;
  }
}

export function removeSuffix(str: string, suffix: string) {
  if (suffix.length === 0) {
    return str;
  }
  if (str.endsWith(suffix)) {
    return str.slice(0, -suffix.length);
  }
  return str;
}

export function removeBrackets(s: string): string {
  let res = s;
  if (res.startsWith("[")) {
    res = res.slice(1);
  }
  if (res.endsWith("]")) {
    res = res.slice(0, -1);
  }
  return res;
}

export function findPositionedAncestor(element: HTMLElement | null): HTMLElement | null {
  element = element === null ? element : element.parentElement;
  while (element) {
      var position = window.getComputedStyle(element).getPropertyValue('position');
      if (position !== 'static') {
          return element;
      }
      element = element.parentElement;
  }
  return null; // 如果没有找到定位祖先，返回null
}

export function isSupportPreviewOp(op: TSupportOp | null | undefined): boolean {
  if (op === null || op === undefined) {
    return false;
  }
  return ["str_replace", "column_fillna", "column_add", "column_rename"].includes(op);
}

export function isSingleColumnOp(op: TSupportOp | null | undefined): boolean {
  if (op === null || op === undefined) {
    return false;
  }
  return ["str_replace", "column_fillna"].includes(op);
}

export function isSupportDeleteRowOp(op: TSupportOp | null | undefined): boolean {
  if (op === null || op === undefined) {
    return false;
  }
  return ["table_filter"].includes(op);
}

export function isSupportMultiSchemaOp(op: TSupportOp | null | undefined): boolean {
  if (op === null || op === undefined) {
    return false;
  }
  return ["table_concat"].includes(op);
}

export function tableShouldInSituPreview(dfName: string, previewItems: IPreviewItems | undefined): boolean {
  if (previewItems === undefined) {
    return false;
  }
  return dfName in previewItems.newTables && previewItems.newTables[dfName].isInSituIfSameTable;
}

export function calCellCtnSpecialStyle(deletedRowsFound: boolean, isPreview: boolean, isDeleted: boolean, isHighlight: boolean, op: TSupportOp | null | undefined): TCellSpecialStyle {
  if (op === null || op === undefined) {
    return isHighlight ? "highlight" : "normal";
  } else if (isSupportDeleteRowOp(op)) {
    const deleteLogic = isDeleted && deletedRowsFound;
    return (isHighlight && deleteLogic) ? "highlightAndDelete" : (isHighlight && !deleteLogic) ? "highlight" : (!isHighlight && deleteLogic) ? "deleted" : "normal";
  } else if (isSupportPreviewOp(op)) {
    return isPreview ? "preview" : isHighlight ? "highlight" : "normal";
  }
  return isHighlight ? "highlight" : "normal";
}

export function countLetterInStr(str: string, letter: string) {
  return str.split('').filter(char => char === letter).length;
}

export function dfRows2SSRows(arr: TDFRow[], header: string[], removeDummy: boolean = true): TCellValue[][] {
  // Remove dummy element of header
  const headerWithoutDummy = removeDummy ? header.slice(0, -1) : header;
  let res: TCellValue[][] = [];
  for (let i = 0; i < arr.length; i++) {
    let row = arr[i];
    let rowArr: TCellValue[] = [];
    for (let j = 0; j < headerWithoutDummy.length; j++) {
      let colName = headerWithoutDummy[j];
      rowArr.push(row[colName]);
    }
    res.push(rowArr);
  }
  return res;
}

export function canFindRows(row: TCellValue[], sourceRows: TCellValue[][]): boolean {
  const clearDummyR = _.cloneDeep(row);
  clearDummyR.pop(); // remove the last dummy element
  for (const sourceRow of sourceRows) {
    if (_.isEqual(clearDummyR, sourceRow)) {
      return true;
    }
  }
  return false;
}

export function getValidFilterCond(filterCond: string): string | null {
  let cond = filterCond;
  const signStack: string[] = ["["];
  for (let i = 0; i < cond.length; i++) {
    if (cond[i] === "[") {
      signStack.push("[");
    } else if (cond[i] === "]") {
      if (signStack.length > 0) {
        signStack.pop();
      } else {
        return null; // invalid
      }
    }
    if (signStack.length === 0) { // find the end of the filter condition
      cond = cond.slice(0, i + 1);
      break;
    }
  }
  // returned cond may end with ']' or not
  return cond;
}

export function calcPreviewRowsCols(pnt: IPreviewNewTables): {num_rows: number, num_cols: number} {
  const tables = Object.keys(pnt);
  if (tables.length === 0) {
    return {num_rows: NaN, num_cols: NaN};
  }
  const firstTable = pnt[tables[0]];
  const firstTableColList = [...firstTable.dfMeta.columnNameList].sort();
  let num_rows = firstTable.dfMeta.numRows;
  let num_cols = firstTable.dfMeta.numCols;
  for (let i = 1; i < tables.length; i++) {
    const curTableColList = [...pnt[tables[i]].dfMeta.columnNameList].sort();
    if (pnt[tables[i]].dfMeta.numCols !== num_cols || !_.isEqual(firstTableColList, curTableColList)) {
      console.warn("[calcPreviewRowsCols] Number of columns not consistent.");
      num_rows = NaN;
      num_cols = NaN;
      break;
    }
    num_rows += pnt[tables[i]].dfMeta.numRows;
  }
  return {num_rows, num_cols};
}