export type TDirection = "right" | "down";

export type TDFRow = {
  [key: string]: number | string | boolean | null
};

export type TEditMode = "r" | "rw";
export type TOverflowOption = "auto" | "hidden" | "scrollX";
export type TCellSpecialStyle = "normal" | "highlight" | "preview" | "deleted" | "highlightAndDelete";
export type TCellValue = number | string | boolean | null | undefined;
export type TSortedness = "asc" | "desc" | "no";
export type TSupportOp = "str_replace" | "column_fillna" | "column_select" | "table_filter" | "table_concat" | "table_sort" | "table_merge" | "groupby" | "column_add" | "column_rename";

export interface IDfMode {
  [dfName: string]: number;
}

export interface IColMode {
  [dfName: string]: {
    [colName: string]: number;
  }
}

export interface IDFInfoAll {
  [key: string]: IDFInfo
};

export interface IDFInfo {
  tableName: string;
  python_id: string;
  numRows: number;
  numCols: number;
  columnNameList: string[];
  columns: IColInfoAll;
};

export interface IColInfoAll {
  [key: string]: IColInfo 
};

export interface IColInfo {
  colName: string;
  dtype: string;
  cardinality: number | null;
  nullCount: number;
  sortedness: TSortedness;
  maxValue: number | string | null;
  minValue: number | string | null;
};

export interface IDFStyleAll {
  [key: string]: IDFStyle
};

export interface IDFStyle {
  tableName: string;
  isFold: boolean;
  isShowRows: boolean;
  columns: IColStyleAll;
};

export interface IColStyleAll {
  [key: string]: IColStyle
};

export interface IColStyle {
  colName: string;
  isHighlight: boolean;
};

/* DC = Data Context */

// Interface for method preview params

export interface IFillnaParam {
  table: string;
  column: string;
  fillValue: string; // Has quote if string, no quote if number
  newColumn: string;
}

export interface IStrReplaceParam {
  table: string;
  column: string;
  newColumn: string;
  oldPattern: string;
  newValue: string;
}

export interface IColumnSelectParam {
  table: string;
  columns: string[];
  newTable: string;
}

export interface ITableFilterParam {
  table: string;
  newTable: string;
  cond: string;
  condValues: (string | number)[];
}

export interface ITableConcatParam {
  tables: string[];
  newTable: string;
}

export interface ITableSortParam {
  table: string;
  newTable: string;
  sortCols: string[];
  asc: boolean[];
}

export interface ITableMergeParam {
  leftTable: string;
  rightTable: string;
  newTable: string;
  leftCol: string | null;
  rightCol: string | null;
  how: string | null;
}

export interface IGroupbyParam {
  newTableName: string;
  tableName: string;
  groupbyCols: string[];
  selectCols: string[] | null;
  aggFunc: string;
}

export interface IColumnComputeParam {
  table: string;
  column: string;
  operator: string;
  addedColumns: string[]
}

export interface IColumnRenameParam {
  table: string;
  oldColName: string;
  newColName: string; 
}

export interface IPreviewNewColumns {
  [dfName: string]: {
    [colName: string]: {
      newColumn: string;
      colMeta: IColInfo;
      sample: (string | null)[];
    };
  }
}

export interface IPreviewNewTables {
  [dfName: string]: {
    newTable: string;
    isInSituIfSameTable: boolean;
    dfMeta: IDFInfo;
    rows: TDFRow[];
    histograms: {
      [colName: string]: IHistogramBin[]; 
    },
    condValues: (string | number)[] | null;
  }
}

export interface IPreviewItems {
  op: TSupportOp | null;
  newColumns: IPreviewNewColumns;
  newTables: IPreviewNewTables;
}


export interface IValueCount {
  value: string | number;
  count: number;
}

export interface IHistogramBin {
  bucket: number;
  low: number;
  high: number;
  count: number;
}

export interface IValueCountCache {
  [dfName: string]: {[colName: string]: IValueCount[]}
}

export interface IHistogramBinCache {
  [dfName: string]: {[colName: string]: IHistogramBin[]}
}

export interface INumColumnSampleCache {
  [dfName: string]: {[colName: string]: (number | string)[]}
}

export interface IRowSampleCache {
  [dfName: string]: IRowSampleCacheItem;
}

export interface IRowSampleCacheItem {
  condition: IDfCondAll | null; // These condition are connected by "and". Null if select all
  rows: TDFRow[];
}

export interface IDfCondAll {
  [colName: string]: IDfRowSelect;
}

export interface IDfRowSelect { // currently we only support one dataframe
  dfName: string;
  colName: string;
  cateSelect: (string | number)[] | null; /* Null means select all */
  rangeSelect: IRange[] | null; /* Null means select all */
}

export interface IDfColSelect {
  [dfName: string]: {
    [colName: string]: boolean;
  }
}

export interface IRange {
  start: number;
  end: number;
  startOpen: boolean;
  endOpen: boolean;
}

export interface IDfCateColItemSearch {
  [dfName: string]: {
    [colName: string]: string;
  }
}

export interface ITableLvInfo {
  [tableName: string]: {
    columnNameList: string[];
    numRows: number | null;
    numCols: number | null;
  }
}

export interface IColLvInfo {
  [tableName: string]: {
    [columnName: string]: {
      // Common
      dtype: string | null;
      nullCount: number | null;
      sortedness: TSortedness | null;
      // For categorical columns
      cardinality: number | null; // Number of unique values
      uniqueValues: (string | number) [] | null; // At most 1000 unique values
      uvCounts: number[] | null; // If not null, must have the same length as uniqueValues
      // For numerical columns
      minValue: number | string | null;
      maxValue: number | string | null;
      sample: (number | string)[] | null;
    }
  }
}

export interface IRowLvInfo {
  [tableName: string]: {
    columnNameList: string[];
    sampleRows: TDFRow[] | null;
  }
}