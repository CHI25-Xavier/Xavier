class AST_POS:
  INVALID = -1
  GLOBAL = 0
  SIGNATURE = 1

  DF_VAR = 10
  LIST_DF_VARS = 11
  LIST_COL_IDX = 12
  OPT_PARAM = 13
  COL_VAR = 14
  PARAM = 15
  BINOP_RHS = 16
  COL_IDX = 17
  CELL_VALUE = 18

  COMMENT = 30
  CODE_LINE = 31
  CONDITION = 32

  PD_FUNC_NAME = 100
  DF_METHOD_NAME = 101
  COL_METHOD_NAME = 102
  AGG_METHOD_NAME = 103

class SPECIAL_CASE:
  NONE = 0
  DF_NAME_PREFIX = 2 # E.g. `covi` of dataframe `covid_19_data`
  SIN_COL_INDEX = 3
  DF_SELECT = 4 # E.g. `covid_19_data[`
  DF_SELECT_COL_1 = 5 # E.g. `covid_19_data["`
  DF_SELECT_COL_2 = 6 # E.g. `covid_19_data["Cou` of `covid_19_data["Country / Region"]`
  DF_SELECT_COL_3 = 7 # E.g. `"Country /`


class DF_INFO_TYPE:
  MULTI_TABLE = "multi_table"
  SIN_TABLE = "single_table"
  MULTI_COL = "multi_column"
  SIN_COL = "single_column"
  USER_SPECIFIED = "user_specified"


class AnalyzeClasses:
  GLOBAL = "global"
  IN_PD_FUNC_SIG = "inPDFuncSig"
  IN_DF_METHOD_SIG = "inDFMethodSig"
  IN_COL_METHOD_SIG = "inColMethodSig"
  IN_COL_STR_METHOD_SIG = "inColStrMethodSig"

class AnalyzeEntry:
  RULES = "rules"
  FULL_NAME = "fullName"
  ML_PREFIX = "multiLevelPrefixes"
  LL_PREFIX = "lastLevelPrefixes"
  NEED_OBJ = "needObj"
  DF_INFO_TYPE = "dfInfoType"
  IS_TRIVIAL = "isTrivial"

class SpecialTokens:
  PANDAS = "$$pandas"
  DF = "$$df"
  COLIDX = "$$colidx"
  COLIDX_LIST = "$$colidx_list"
  OP = "$$op"
  CELL_VALUE = "$$cell_value"

# support method full name
class SptMethodName:
  # special
  PD_FUNC_NAME = "pdFuncName"
  DF_METHOD_NAME = "dfMethodName"
  COL_METHOD_NAME = "colMethodName"
  DF_COL = "dfCol" # E.g. `df["col_name"]`
  COLUMNS_SELECT = "columnsSelect"
  GROUPBY_COLSELECT = "groupbyColSelect"
  GROUPBY_AGGNAME = "groupbyAggName"
  VALUE_FILTER = "valueFilter"
  EXPR = "expr"
  COMMENT = "comment"
  CODE_LINE = "codeLine"
  PREFIX_DF_NAME = "prefixDfName"
  PREFIX_COL_NAME = "prefixColName"
  DF_SELECT = "dfSelect"
  ASSIGN_STMT = "assignStmt"
  # pandas methods
  PD_CONCAT = "pandas.concat"
  PD_MERGE = "pandas.merge"
  # pandas.DataFrame methods
  DF_MERGE = "pandas.DataFrame.merge"
  DF_DROP = "pandas.DataFrame.drop"
  DF_GROUPBY = "pandas.DataFrame.groupby"
  DF_JOIN = "pandas.DataFrame.join"
  DF_SORT_VALUES = "pandas.DataFrame.sort_values"
  DF_DROP_DUPLICATES = "pandas.DataFrame.drop_duplicates"
  DF_MELT = "pandas.DataFrame.melt"
  DF_RENAME = "pandas.DataFrame.rename"
  DF_DROPNA = "pandas.DataFrame.dropna"
  DF_PIVOT = "pandas.DataFrame.pivot"
  DF_PIVOT_TABLE = "pandas.DataFrame.pivot_table"
  # pandas.Series methods
  COL_ISIN = "pandas.Series.isin"
  COL_ASTYPE = "pandas.core.series.Series.astype"
  COL_FILLNA = "pandas.core.series.Series.fillna"
  COL_REPLACE = "pandas.core.series.Series.replace"
  # pandas
  COL_STR_REPLACE = "pandas.core.strings.accessor.StringMethods.replace"


PROMPT_SPLITTER = "\n--------------------\n\n"
LLAMA3_70B_8192 ="llama3-70b-8192"
LLAMA31_70B_VERSATILE = "llama-3.1-70b-versatile"
RUN_HOST = "0.0.0.0"
RUN_PORT = 1022
MAX_OUTPUT_TOKENS = 70
TEMPERATURE = 0.01

COMPLETION_ITEM_KIND = {
  AST_POS.DF_VAR: "df",
  AST_POS.LIST_DF_VARS: "df",
  AST_POS.LIST_COL_IDX: "col",
  AST_POS.OPT_PARAM: "param",
  AST_POS.PD_FUNC_NAME: "func",
  AST_POS.DF_METHOD_NAME: "func",
  AST_POS.COL_METHOD_NAME: "func",
  AST_POS.COL_VAR: "col",
  AST_POS.PARAM: "param",
  AST_POS.BINOP_RHS: "calc",
  AST_POS.COL_IDX: "col",
  AST_POS.CELL_VALUE: "cell",
  AST_POS.AGG_METHOD_NAME: "func",
  AST_POS.CODE_LINE: "code",
}

COMPLETE_WHAT = {
  AST_POS.DF_VAR: "dataframe variable",
  AST_POS.LIST_DF_VARS: "list of dataframes",
  AST_POS.LIST_COL_IDX: "list of column indices",
  AST_POS.OPT_PARAM: "optional parameters",
  AST_POS.PD_FUNC_NAME: "function name of pandas module",
  AST_POS.DF_METHOD_NAME: "method name of the dataframe",
  AST_POS.COL_METHOD_NAME: "method name of the column",
  AST_POS.COL_VAR: "expression representing a column",
  AST_POS.PARAM: "mandatory parameter value(s)",
  AST_POS.BINOP_RHS: "binary operator and the right-hand-side operand",
  AST_POS.COL_IDX: "column index",
  AST_POS.CELL_VALUE: "value of a cell",
  AST_POS.AGG_METHOD_NAME: "method name of the aggregation function",
  AST_POS.COMMENT: "comment written by users",
  AST_POS.CODE_LINE: "a line of code",
  AST_POS.CONDITION: "condition",
}

class PROMPT_MARKER:
  CURSOR = "<INPUT_CURSOR>"
  CODE_CONTEXT = "**code context**"
  DATA_CONTEXT = "**data context**"