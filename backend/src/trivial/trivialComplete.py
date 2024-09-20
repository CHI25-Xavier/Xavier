from typeguard import typechecked

from src.utils import getCompletionItemTypeFromAstPos, removeQuotes, findAllVarLastOccur, sortDfByOccur, getColInfoByName, formatNumber
from src.constant import AST_POS, SptMethodName
from src.datatypes import List, Tuple, Union, PartialCodeInfo, CompletionItem, JupyterlabToken, AllDataFrameInfoT, NumericalStatsT
from src.docCtrl import genCtrlDocumentation
from src.debugger import debugger

from .. import datatypes as dtX
from ..prompt import parseGPTOutput as parseGPTX

@typechecked
def dfVarComplete(need_obj: int, token: JupyterlabToken, previousCode: str, analyze_resp: PartialCodeInfo, allDfInfo) -> List[CompletionItem]:
  all_df_names = list(allDfInfo.keys())
  dfOcc = findAllVarLastOccur(previousCode, all_df_names)
  ordered_dfName = sortDfByOccur(dfOcc, analyze_resp["df_name"])
  return list(map(lambda x: CompletionItem(
    value=x,
    offset=token["offset"],
    type=getCompletionItemTypeFromAstPos(need_obj),
    explanation=None
  ), ordered_dfName))

@typechecked
def paramComplete(need_obj: int, token: JupyterlabToken, previousCode: str, analyze_resp: PartialCodeInfo, allDfInfo) -> List[CompletionItem]:
  if analyze_resp["method_name"] == SptMethodName.COL_ASTYPE:
    typearr = ["int", "float", "str", "bool"]
    return list(map(lambda x: CompletionItem(
      value=x,
      offset=token["offset"],
      type=getCompletionItemTypeFromAstPos(need_obj),
      explanation=None
    ), typearr))
  return []

@typechecked
def defaultNumCompleteByStats(need_obj: int, token_offset: int, numStats: Union[None, NumericalStatsT], df_info_type: str, known_df_name: str, known_col_name: str, allDfInfo) -> List[CompletionItem]:
  if numStats is None:
    debugger.warning(f"[trivialComplete] cell_value for value_filter should have valid numStats, but got {numStats}")
    return []

  q50 = formatNumber(numStats["q50"])
  q25 = formatNumber(numStats["q25"])
  q75 = formatNumber(numStats["q75"])
  min_val = formatNumber(numStats["min"])
  max_val = formatNumber(numStats["max"])
  mean_val = formatNumber(numStats["mean"])

  return [
    CompletionItem(
      value=str(q50),
      offset=token_offset,
      type=getCompletionItemTypeFromAstPos(need_obj),
      explanation=genCtrlDocumentation(df_info_type, str(q50), allDfInfo, known_df_name, known_col_name, str(q50), None)
    ),
    CompletionItem(
      value=str(q25),
      offset=token_offset,
      type=getCompletionItemTypeFromAstPos(need_obj),
      explanation=genCtrlDocumentation(df_info_type, str(q25), allDfInfo, known_df_name, known_col_name, str(q25), None)
    ),
    CompletionItem(
      value=str(q75),
      offset=token_offset,
      type=getCompletionItemTypeFromAstPos(need_obj),
      explanation=genCtrlDocumentation(df_info_type, str(q75), allDfInfo, known_df_name, known_col_name, str(q75), None)
    ),
    CompletionItem(
      value=str(min_val),
      offset=token_offset,
      type=getCompletionItemTypeFromAstPos(need_obj),
      explanation=genCtrlDocumentation(df_info_type, str(min_val), allDfInfo, known_df_name, known_col_name, str(min_val), None)
    ),
    CompletionItem(
      value=str(max_val),
      offset=token_offset,
      type=getCompletionItemTypeFromAstPos(need_obj),
      explanation=genCtrlDocumentation(df_info_type, str(max_val), allDfInfo, known_df_name, known_col_name, str(max_val), None)
    ),
    CompletionItem(
      value=str(mean_val),
      offset=token_offset,
      type=getCompletionItemTypeFromAstPos(need_obj),
      explanation=genCtrlDocumentation(df_info_type, str(mean_val), allDfInfo, known_df_name, known_col_name, str(mean_val), None)
    )
  ]

@typechecked
def cellValueComplete(need_obj: int, token: JupyterlabToken, previousCode: str, analyze_resp: PartialCodeInfo, allDfInfo) -> List[CompletionItem]:
  df_info_type = analyze_resp["df_info_type"]

  if analyze_resp["method_name"] == SptMethodName.VALUE_FILTER:
    df_name = analyze_resp["df_name"]
    col_name = None if analyze_resp["col_name"] is None else removeQuotes(analyze_resp["col_name"])
    cell_value = analyze_resp["cell_value"]
    if (df_name is None) or (col_name is None):
      debugger.warning("[trivialComplete] cell_value for value_filter should have df_name and col_name")
      return []
    df_info = allDfInfo.get(df_name, {"columns": [], "num_rows": 0, "num_cols": 0})
    col_info = getColInfoByName(df_info["columns"], col_name)
    if col_info is None:
      debugger.warning(f"[trivialComplete] cell_value for value_filter should have valid col_info, but got {col_info}")
      return []
    if col_info["statsType"] == "categorical":
      if cell_value is None:
        topK = col_info["topK"]
        if topK is None:
          debugger.warning(f"[trivialComplete] cell_value for value_filter should have valid topK, but got {topK}")
          return []
        return list(map(lambda x: CompletionItem(
          value="\"" + x["value"] + "\"",
          offset=token["offset"],
          type=getCompletionItemTypeFromAstPos(need_obj),
          explanation=genCtrlDocumentation(df_info_type, x["value"], allDfInfo, df_name, col_name, x["value"], None)
        ), topK))
      else:
        return [CompletionItem(
          value=cell_value,
          offset=token["offset"],
          type=getCompletionItemTypeFromAstPos(need_obj),
          explanation=genCtrlDocumentation(df_info_type, cell_value, allDfInfo, df_name, col_name, removeQuotes(cell_value), None)
        )]
    elif col_info["statsType"] == "numeric":
      if cell_value is None:
        return defaultNumCompleteByStats(need_obj, token["offset"], col_info["numStats"], df_info_type, df_name, col_name, allDfInfo)
      else:
        return [CompletionItem(
          value=cell_value,
          offset=token["offset"],
          type=getCompletionItemTypeFromAstPos(need_obj),
          explanation=genCtrlDocumentation(df_info_type, cell_value, allDfInfo, df_name, col_name, cell_value, None)
        )]

  return []

@typechecked
def colIdxComplete(need_obj: int, token: JupyterlabToken, previousCode: str, analyze_resp: PartialCodeInfo, allDfInfo: dtX.TableLevelInfoT) -> List[CompletionItem]:
  lastLineCode = previousCode.split("\n")[-1]
  token_list: List[CompletionItem] = []
  for coln in analyze_resp["col_name_list"]:
    txt = parseGPTX.keepSuffix(lastLineCode, coln)
    realTxt = ""
    if len(lastLineCode) > 0 and lastLineCode[-1] == "'":
      realTxt = txt + "'"
    elif len(lastLineCode) > 0 and lastLineCode[-1] == '"':
      realTxt = txt + '"'
    else:
      realTxt = '"' + txt + '"'


    token_list.append({
      "value": realTxt,
      "offset": token["offset"],
      "type": getCompletionItemTypeFromAstPos(analyze_resp["need_obj"]),
      "explanation": None
    })
  return token_list

@typechecked
def trivialComplete(need_obj: int, token: JupyterlabToken, previousCode: str, analyze_resp: PartialCodeInfo, allDfInfo: dtX.TableLevelInfoT) -> List[CompletionItem]:
  if need_obj == AST_POS.DF_VAR:
    return dfVarComplete(need_obj, token, previousCode, analyze_resp, allDfInfo)
  elif need_obj == AST_POS.PARAM:
    return paramComplete(need_obj, token, previousCode, analyze_resp, allDfInfo)
  elif need_obj == AST_POS.CELL_VALUE:
    return cellValueComplete(need_obj, token, previousCode, analyze_resp, allDfInfo)
  elif need_obj == AST_POS.COL_IDX:
    return colIdxComplete(need_obj, token, previousCode, analyze_resp, allDfInfo)
  return []