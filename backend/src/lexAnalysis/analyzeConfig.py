from src.constant import AST_POS, DF_INFO_TYPE, AnalyzeClasses, AnalyzeEntry, SpecialTokens, SptMethodName
from src.datatypes import MultiLevelPrefix

ANALYZE_RULES = {
  # global
  AnalyzeClasses.GLOBAL: {
    SptMethodName.PD_FUNC_NAME: {
      AnalyzeEntry.FULL_NAME: SptMethodName.PD_FUNC_NAME,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.PANDAS, "."],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.MULTI_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    SptMethodName.DF_METHOD_NAME: {
      AnalyzeEntry.FULL_NAME: SptMethodName.DF_METHOD_NAME,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "."],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", "[", SpecialTokens.COLIDX_LIST, "]", "]", "."],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    SptMethodName.COL_METHOD_NAME: {
      AnalyzeEntry.FULL_NAME: SptMethodName.COL_METHOD_NAME,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", SpecialTokens.COLIDX, "]", "."],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_COL,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    SptMethodName.VALUE_FILTER: {
      AnalyzeEntry.FULL_NAME: SptMethodName.VALUE_FILTER,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", SpecialTokens.DF, "[", SpecialTokens.COLIDX, "]"],
          AnalyzeEntry.NEED_OBJ: AST_POS.CONDITION,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False 
        },
        # {
        #   AnalyzeEntry.ML_PREFIX: None,
        #   AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", SpecialTokens.COLIDX, "]", SpecialTokens.OP, SpecialTokens.CELL_VALUE],
        #   AnalyzeEntry.NEED_OBJ: AST_POS.CELL_VALUE,
        #   AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_COL,
        #   AnalyzeEntry.IS_TRIVIAL: True
        # },
        # {
        #   AnalyzeEntry.ML_PREFIX: None,
        #   AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", SpecialTokens.COLIDX, "]", SpecialTokens.OP],
        #   AnalyzeEntry.NEED_OBJ: AST_POS.CELL_VALUE,
        #   AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_COL,
        #   AnalyzeEntry.IS_TRIVIAL: True
        # }
      ]
    },
    SptMethodName.DF_COL: {
      AnalyzeEntry.FULL_NAME: SptMethodName.DF_COL,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", SpecialTokens.COLIDX, "]"],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_COL, # Deprecated
          AnalyzeEntry.IS_TRIVIAL: False # Deprecated
        }
      ]
    },
    SptMethodName.ASSIGN_STMT: {
      AnalyzeEntry.FULL_NAME: SptMethodName.ASSIGN_STMT,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", SpecialTokens.COLIDX, "]", "="],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_COL,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: ["="],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
      ]
    },
    SptMethodName.GROUPBY_COLSELECT: {
      AnalyzeEntry.FULL_NAME: SptMethodName.GROUPBY_COLSELECT,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, ".", "groupby", "(", SpecialTokens.COLIDX, ")", "[", "[", "'"],
          AnalyzeEntry.NEED_OBJ: AST_POS.COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: True  
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, ".", "groupby", "(", SpecialTokens.COLIDX, ")", "[", "[", '"'],
          AnalyzeEntry.NEED_OBJ: AST_POS.COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: True  
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, ".", "groupby", "(", "[", SpecialTokens.COLIDX_LIST, "]", ")", "[", "[", "'"],
          AnalyzeEntry.NEED_OBJ: AST_POS.COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: True
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, ".", "groupby", "(", "[", SpecialTokens.COLIDX_LIST, "]", ")", "[", "[", '"'],
          AnalyzeEntry.NEED_OBJ: AST_POS.COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: True  
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, ".", "groupby", "(", SpecialTokens.COLIDX, ")", "[", "["],
          AnalyzeEntry.NEED_OBJ: AST_POS.LIST_COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, ".", "groupby", "(", "[", SpecialTokens.COLIDX_LIST, "]", ")", "[", "["],
          AnalyzeEntry.NEED_OBJ: AST_POS.LIST_COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    SptMethodName.GROUPBY_AGGNAME: {
      AnalyzeEntry.FULL_NAME: SptMethodName.GROUPBY_AGGNAME,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, ".", "groupby", "(", SpecialTokens.COLIDX, ")", "[", "[", SpecialTokens.COLIDX_LIST, "]", "]", "."],
          AnalyzeEntry.NEED_OBJ: AST_POS.AGG_METHOD_NAME,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, ".", "groupby", "(", "[", SpecialTokens.COLIDX_LIST, "]", ")", "[", "[", SpecialTokens.COLIDX_LIST, "]", "]", "."],
          AnalyzeEntry.NEED_OBJ: AST_POS.AGG_METHOD_NAME,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    SptMethodName.COLUMNS_SELECT: {
      AnalyzeEntry.FULL_NAME: SptMethodName.COLUMNS_SELECT,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", "[", SpecialTokens.COLIDX_LIST, ",", " ", "'"],
          AnalyzeEntry.NEED_OBJ: AST_POS.COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: True
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", "[", SpecialTokens.COLIDX_LIST, ",", " ", '"'],
          AnalyzeEntry.NEED_OBJ: AST_POS.COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: True  
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", "[", SpecialTokens.COLIDX_LIST, ",", "'"],
          AnalyzeEntry.NEED_OBJ: AST_POS.COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: True
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", "[", SpecialTokens.COLIDX_LIST, ",", '"'],
          AnalyzeEntry.NEED_OBJ: AST_POS.COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: True  
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", "[", SpecialTokens.COLIDX_LIST, ","],
          AnalyzeEntry.NEED_OBJ: AST_POS.COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: True
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", "[", "'"],
          AnalyzeEntry.NEED_OBJ: AST_POS.COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: True  
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", "[", '"'],
          AnalyzeEntry.NEED_OBJ: AST_POS.COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: True
        },
        {
          AnalyzeEntry.ML_PREFIX: None,
          AnalyzeEntry.LL_PREFIX: [SpecialTokens.DF, "[", "["],
          AnalyzeEntry.NEED_OBJ: AST_POS.LIST_COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    }
  },
  # In pandas function signature
  AnalyzeClasses.IN_PD_FUNC_SIG: {
    "concat": {
      AnalyzeEntry.FULL_NAME: SptMethodName.PD_CONCAT,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.MULTI_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1]), MultiLevelPrefix(start_symbol="[", delimiter=",", index_range=[None, None])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.DF_VAR,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.MULTI_TABLE,
          AnalyzeEntry.IS_TRIVIAL: True,
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[1, None])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.MULTI_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    "merge": {
      AnalyzeEntry.FULL_NAME: SptMethodName.PD_MERGE,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 2])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.MULTI_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[2, None])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.MULTI_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    }
    
  },
  # In DataFrame method signature
  AnalyzeClasses.IN_DF_METHOD_SIG: {
    "merge": {
      AnalyzeEntry.FULL_NAME: SptMethodName.DF_MERGE,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.MULTI_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[1, None])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.MULTI_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    "drop": {
      AnalyzeEntry.FULL_NAME: SptMethodName.DF_DROP,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: ["columns", "=", "["],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: ["columns", "="],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[1, None])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.OPT_PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    "groupby": {
      AnalyzeEntry.FULL_NAME: SptMethodName.DF_GROUPBY,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [
            MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1]),
            MultiLevelPrefix(start_symbol="[", delimiter=",", index_range=[None, None])
          ],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    "join": {
      AnalyzeEntry.FULL_NAME: SptMethodName.DF_JOIN,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.MULTI_TABLE,
          AnalyzeEntry.IS_TRIVIAL: True
        }
      ]
    },
    "sort_values": {
      AnalyzeEntry.FULL_NAME: SptMethodName.DF_SORT_VALUES,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[1, None])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    "drop_duplicates": {
      AnalyzeEntry.FULL_NAME: SptMethodName.DF_DROP_DUPLICATES,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: ["subset", "=", "["],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: ["subset", "="],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    "melt": {
      AnalyzeEntry.FULL_NAME: SptMethodName.DF_MELT,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 2])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.CODE_LINE,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 2])],
          AnalyzeEntry.LL_PREFIX: ["["],
          AnalyzeEntry.NEED_OBJ: AST_POS.LIST_COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 2]), MultiLevelPrefix(start_symbol="[", delimiter=",", index_range=[None, None])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.LIST_COL_IDX,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[2, None])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.OPT_PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    "rename": {
      AnalyzeEntry.FULL_NAME: SptMethodName.DF_RENAME,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: ["columns", "="],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    "dropna": {
      AnalyzeEntry.FULL_NAME: SptMethodName.DF_DROPNA,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: ["subset", "=", "["],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: ["subset", "="],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        },
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    "pivot": {
      AnalyzeEntry.FULL_NAME: SptMethodName.DF_PIVOT,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 2])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    "pivot_table": {
      AnalyzeEntry.FULL_NAME: SptMethodName.DF_PIVOT_TABLE,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 2])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_TABLE,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    }

  },
  # In Column method signature
  AnalyzeClasses.IN_COL_METHOD_SIG: {
    "isin": {
      AnalyzeEntry.FULL_NAME: SptMethodName.COL_ISIN,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.COL_VAR,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_COL,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    "astype": {
      AnalyzeEntry.FULL_NAME: SptMethodName.COL_ASTYPE,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_COL,
          AnalyzeEntry.IS_TRIVIAL: True
        }
      ],
    },
    "fillna": {
      AnalyzeEntry.FULL_NAME: SptMethodName.COL_FILLNA,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 1])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_COL,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    },
    "replace": {
      AnalyzeEntry.FULL_NAME: SptMethodName.COL_REPLACE,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 2])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_COL,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    }
  },
  AnalyzeClasses.IN_COL_STR_METHOD_SIG: {
    "replace": {
      AnalyzeEntry.FULL_NAME: SptMethodName.COL_STR_REPLACE,
      AnalyzeEntry.RULES: [
        {
          AnalyzeEntry.ML_PREFIX: [MultiLevelPrefix(start_symbol="(", delimiter=",", index_range=[0, 2])],
          AnalyzeEntry.LL_PREFIX: [],
          AnalyzeEntry.NEED_OBJ: AST_POS.PARAM,
          AnalyzeEntry.DF_INFO_TYPE: DF_INFO_TYPE.SIN_COL,
          AnalyzeEntry.IS_TRIVIAL: False
        }
      ]
    }
  }
}