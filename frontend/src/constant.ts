import { CodeEditor } from '@jupyterlab/codeeditor';

// The root of the completer documentation panel. Can find it by class name.
export const DOC_PANEL_CLASS = 'jp-Completer-docpanel';

export const PD_T: CodeEditor.IToken = {
  value: "pd",
  offset: -1,
  type: "VariableName"
};

export const LPAREN_T: CodeEditor.IToken = {
  value: "(",
  offset: -1,
  type: "("
};

export const DOT_T: CodeEditor.IToken = {
  value: ".",
  offset: -1,
  type: "."
};

export const COMMA_T: CodeEditor.IToken = {
  value: ",",
  offset: -1,
  type: ","
};

export const SQ_LBRACKET_T: CodeEditor.IToken = {
  value: "[",
  offset: -1,
  type: "["
};

export const CONCAT_T: CodeEditor.IToken = {
  value: "concat",
  offset: -1,
  type: "PropertyName"
};

export const AST_POS = {
  INVALID: -1,
  GLOBAL: 0,
  SIGNATURE: 1,

  DF_VAR: 10,
  LIST_DF_VARS: 11,
  LIST_COL_IDX: 12,
  OPT_PARAM: 13,
  COL_VAR: 14,
  PARAM: 15,
  BINOP_RHS: 16,
  COL_IDX: 17,
  CELL_VALUE: 18,


  PD_FUNC_NAME: 100,
  DF_METHOD_NAME: 101,
  COL_METHOD_NAME: 102,
  AGG_METHOD_NAME: 103,
}

export const METHOD_NAME = {
  // special
  PD_FUNC_NAME: "pdFuncName",
  DF_METHOD_NAME: "dfMethodName",
  COL_METHOD_NAME: "colMethodName",
  DF_COL: "dfCol",
  COLUMNS_SELECT: "columnsSelect",
  GROUPBY_COLSELECT: "groupbyColSelect",
  GROUPBY_AGGNAME: "groupbyAggName",
  VALUE_FILTER: "valueFilter",
  EXPR: "expr",
  COMMENT: "comment",
  CODE_LINE: "codeLine",
  PREFIX_DF_NAME: "prefixDfName",
  PREFIX_COL_NAME: "prefixColName",
  DF_SELECT: "dfSelect",
  // pandas methods
  PD_CONCAT: "pandas.concat",
  PD_MERGE: "pandas.merge",
  // pandas.DataFrame methods
  DF_MERGE: "pandas.DataFrame.merge",
  DF_DROP: "pandas.DataFrame.drop",
  DF_GROUPBY: "pandas.DataFrame.groupby",
  DF_JOIN: "pandas.DataFrame.join",
  DF_SORT_VALUES: "pandas.DataFrame.sort_values",
  DF_DROP_DUPLICATES: "pandas.DataFrame.drop_duplicates",
  DF_MELT: "pandas.DataFrame.melt",
  // pandas.Series methods
  COL_ISIN: "pandas.Series.isin",
  COL_ASTYPE: "pandas.core.series.Series.astype",
  COL_FILLNA: "pandas.core.series.Series.fillna",
  COL_REPLACE: "pandas.core.series.Series.replace",
  // pandas string methods
  COL_STR_REPLACE: "pandas.core.strings.accessor.StringMethods.replace",
}

export const DATAINFO_T = {
  INVALID: "invalid",
  DF_VAR: "df_var",
  LIST_DF_VARS: "list_df_vars",
  LIST_COL_IDX: "list_col_idx",
  METHOD_NAME: "method_name",
}

export const COMPLETION_ITEM_KIND = {
  [AST_POS.DF_VAR]: "df",
  [AST_POS.LIST_DF_VARS]: "df",
  [AST_POS.LIST_COL_IDX]: "col",
  [AST_POS.OPT_PARAM]: "param",
  [AST_POS.PD_FUNC_NAME]: "func",
  [AST_POS.DF_METHOD_NAME]: "func",
  [AST_POS.COL_METHOD_NAME]: "func",
  [AST_POS.COL_VAR]: "col",
  [AST_POS.PARAM]: "param",
  [AST_POS.BINOP_RHS]: "calc",
  [AST_POS.COL_IDX]: "col",
  [AST_POS.CELL_VALUE]: "cell",
  [AST_POS.AGG_METHOD_NAME]: "func",
}

export const COMPLETION_ITEM_KIND_STR = Object.values(COMPLETION_ITEM_KIND);

const DOCPANEL = {
  WIDTH: 530,
  PADDING: 10
};

// .column-icon-type
const COL_ICON = {
  MARGIN_LEFT: 22,
  MARGIN_RIGHT: 5,
};

export const QUANT = {
  SUMMARY_CHART_SVG_W: DOCPANEL.WIDTH - 2 * DOCPANEL.PADDING,
};

export const CATE_SUMMARY_CHART = {
  SVG_W: DOCPANEL.WIDTH - 2 * DOCPANEL.PADDING,
  TEXT_LEFT: COL_ICON.MARGIN_LEFT + 5,
}

export const CATE = {
  BAR_BG_COLOR: "#aed9f0",
  WIDTH: CATE_SUMMARY_CHART.SVG_W - 5,
};

export const SVGSTR = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 4.85749L2.4855 4L7.4855 1H8.5145L13.5145 4L14 4.85749V10.8575L13.5145 11.715L8.5145 14.715H7.4855L2.4855 11.715L2 10.8575V4.85749ZM7.5 13.5575L3 10.8575V5.69975L7.5 8.1543V13.5575ZM8.5 13.5575L13 10.8575V5.69975L8.5 8.1543V13.5575ZM8 1.85749L3.25913 4.70201L8 7.28794L12.7409 4.70201L8 1.85749Z" fill="#652D90"/></svg>`;

export const ViewMode = {
  INIT: 0,
  FILTER_COLUMN: 1,
  FILTER_VALUE: 2
};

export const SpecialCase = {
  NONE: 0,
  ASSIGN_STMT: 1,
  DF_NAME_PREFIX: 2,
  SIN_COL_INDEX: 3,
  DF_SELECT: 4,
  DF_SELECT_COL_1: 5,
  DF_SELECT_COL_2: 6
}

export const ViewIconStyle = {
  fill: "#777777",
}

// SpreadSheet column Highlight color
export const SSRowHLDelColor = "#f5eef7";

export const SSColumnHLColor = "#e9e9ff" //"#dfdfff" //"#d5d4ff";

export const SSColumnPreColor = "#fffcee";

export const SSRowDelColor = "#fff2f0";

export const SSAlternateColor = ["#f1f1f1", "#ffffff"] // "#eaebee"

export const SSCellMaxWidth = 75;

export const SSTableRowHeight = 30;

export const SSMaxHeight = 8.5 * SSTableRowHeight;