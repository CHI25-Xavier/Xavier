from typeguard import typechecked
from typing import Union

from . import dataframeInfo as dfInfoX
from . import share as shareX
from .. import datatypes as dtX
from .. import utils as utilsX

from src.prompt.fmtCtrl import fmtCtrl_dfVar, fmtCtrl_listOfDf, fmtCtrl_optionalParams, fmtCtrl_selectColumnNames, fmtCtrl_methodRecommendation, fmtCtrl_colVar, fmtCtrl_params, fmtCtrl_binopRHS, fmtCtrl_colIdx, fmtCtrl_aggMethod, fmtCtrl_comment, fmtCtrl_codeLine, fmtCtrl_Param, fmtCtrl_condition
from src.prompt.parseGPTOutput import parseReCodeObj
from src.server.myAIClient import myAIClient
from src.datatypes import List, Tuple, Optional, PartialCodeInfo, CompletionItem, JupyterlabToken, TableLevelInfoT
from src.constant import AST_POS, DF_INFO_TYPE, PROMPT_SPLITTER, COMPLETE_WHAT, SptMethodName
from src.debugger import debugger

@typechecked
def dfHasColumn(allDfInfo, df_name: Optional[str] = None, col_name: Optional[str] = None) -> bool:
  if (not df_name) or (df_name not in allDfInfo) or (not col_name):
    return False
  oneDfInfo = allDfInfo[df_name]
  df_columns = oneDfInfo["columns"]
  found = False
  for dfc in df_columns:
    if dfc["colName"] == col_name:
      found = True
      break
  return found

@typechecked
def getDfInfoByType(allDfInfo, df_info_type: str, df_name: Optional[str] = None, col_name: Optional[str] = None) -> str:
  if df_info_type == DF_INFO_TYPE.MULTI_TABLE:
    return dfInfoX.multiTableInfo(allDfInfo)
  elif df_info_type == DF_INFO_TYPE.SIN_TABLE:
    if (not df_name) or (df_name not in allDfInfo):
      debugger.warning("[getDfInfoByType] df_name not specified or not in allDfInfo")
      return ""
    else:
      return f"{dfInfoX.dataInfoPreamble()}\n" + dfInfoX.sinTableInfo({
        df_name: allDfInfo[df_name]
      })
  elif df_info_type == DF_INFO_TYPE.SIN_COL:
    if (not dfHasColumn(allDfInfo, df_name, col_name)):
      debugger.warning(f"[getDfInfoByType] df_name: {df_name} or col_name: {col_name} not in allDfInfo")
      return ""
    else:
      return dfInfoX.sinColInfo(allDfInfo, df_name, col_name)
  else:
    debugger.warning(f"[getDfInfoByType] not supported df_info_type: {df_info_type}")
    return ""

@typechecked
def validateSelectedDC(allDfInfo, allDataContext):
  validDataContext = {
    "tableChannel": [],
    "columnChannel": allDataContext["columnChannel"], # @TODO
  }
  tableDC = allDataContext["tableChannel"]
  for dfName in tableDC:
    if dfName not in allDfInfo:
      debugger.warning(f"[validateSelectedDC] dfName {dfName} not in allDfInfo")
      continue
    validDataContext["tableChannel"].append(dfName)
  return validDataContext

@typechecked
def getDfInfoByUserSelect(allDfInfo, allDataContext):
  validDataContext = validateSelectedDC(allDfInfo, allDataContext)

  prompt = f"{dfInfoX.dataInfoPreamble()}\n"
  tableDC = validDataContext["tableChannel"]
  dfInfo = {}
  if len(tableDC) > 1:
    for dfName in tableDC:
      dfInfo[dfName] = allDfInfo[dfName]
    prompt += dfInfoX.multiTableInfo(dfInfo) + "\n\n"
  elif len(tableDC) == 1:
    prompt += dfInfoX.sinTableInfo({
      dfName: allDfInfo[dfName]
    }) + "\n\n"

  return prompt

@typechecked
def getFmtCtrlByAstPos(astPosEnum: int, method_name: str):
  completeWhatStr = COMPLETE_WHAT.get(astPosEnum, "")
  if not completeWhatStr:
    debugger.warning(f"[getFmtCtrlByAstPos] not supported astPosEnum: {astPosEnum}")
    return ""

  if astPosEnum == AST_POS.DF_VAR:
    return fmtCtrl_dfVar(completeWhatStr)
  elif astPosEnum == AST_POS.LIST_DF_VARS:
    return fmtCtrl_listOfDf(completeWhatStr)
  elif astPosEnum == AST_POS.LIST_COL_IDX:
    return fmtCtrl_selectColumnNames(completeWhatStr)
  elif astPosEnum == AST_POS.OPT_PARAM:
    return fmtCtrl_optionalParams(method_name, completeWhatStr)
  elif astPosEnum == AST_POS.PD_FUNC_NAME or astPosEnum == AST_POS.DF_METHOD_NAME or astPosEnum == AST_POS.COL_METHOD_NAME:
    return fmtCtrl_methodRecommendation(completeWhatStr)
  elif astPosEnum == AST_POS.COL_VAR:
    return fmtCtrl_colVar(completeWhatStr)
  elif astPosEnum == AST_POS.PARAM:
    return fmtCtrl_Param()
    # return fmtCtrl_params(completeWhatStr)
  elif astPosEnum == AST_POS.BINOP_RHS:
    return fmtCtrl_binopRHS(completeWhatStr)
  elif astPosEnum == AST_POS.COL_IDX:
    return fmtCtrl_colIdx(completeWhatStr)
  elif astPosEnum == AST_POS.AGG_METHOD_NAME:
    return fmtCtrl_aggMethod(completeWhatStr)
  elif astPosEnum == AST_POS.COMMENT:
    return fmtCtrl_comment(completeWhatStr)
  elif astPosEnum == AST_POS.CODE_LINE:
    return fmtCtrl_codeLine(completeWhatStr)
  elif astPosEnum == AST_POS.CONDITION:
    return fmtCtrl_condition(completeWhatStr)
  else:
    debugger.warning(f"[getFmtCtrlByAstPos] not supported astPosEnum: {astPosEnum}")
    return ""

@typechecked
def parseGPTOutputByAstPos(astPosEnum: int, lastLineCode: str, gpt_output: str) -> Tuple[List[str], Optional[List[str]]]:
  # if astPosEnum == AST_POS.DF_METHOD_NAME or astPosEnum == AST_POS.COL_METHOD_NAME:
  #   return parseReCodeObjWithExplanation(gpt_output, lastLineCode)
  # else:
  return parseReCodeObj(gpt_output, lastLineCode), None

# SC = special case
@typechecked
def gptCompleteForSC(pCode: str, method_name: str = "", need_obj: int = -1, tableLvInfo: Optional[TableLevelInfoT] = None, columnLvInfo = None, rowLvInfo = None) -> Optional[str]:
  # get codeInfo
  codeInfo = shareX.getCodeInfo(pCode)
  # get dfInfo
  dfInfoPrompt: str = f"{dfInfoX.dataInfoPreamble()}\n"
  if (tableLvInfo is None) and (columnLvInfo is None) and (rowLvInfo is None):
    debugger.warning(f"[gptCompleteForSC] data context not specified")
    return None
  if tableLvInfo is not None:
    dfInfoPrompt += dfInfoX.multiTableLvInfoPrompt(tableLvInfo)
  if columnLvInfo is not None:
    dfInfoPrompt += f"""\n{dfInfoX.multiColLvInfoPrompt(columnLvInfo, tableLvInfo)}"""
  if rowLvInfo is not None:
    dfInfoPrompt += f"""\n{dfInfoX.multiRowLvInfoPrompt(rowLvInfo)}"""
  
  # generate prompt
  prompt = codeInfo + PROMPT_SPLITTER
  prompt += dfInfoPrompt + PROMPT_SPLITTER
  prompt += getFmtCtrlByAstPos(need_obj, method_name)

  return prompt


@typechecked
def gptComplete_Exe(client: myAIClient, token: JupyterlabToken, prompt: str, pCode: str, need_obj: int) -> List[CompletionItem]:
  token_list: List[CompletionItem] = []
  resp = client.sendPrompt(prompt)
  lastLineCode = pCode.split("\n")[-1]
  pres = parseReCodeObj(resp, lastLineCode)
  for i, co in enumerate(pres):
    token_list.append({
      "value": co,
      "offset": token["offset"],
      "type": utilsX.getCompletionItemTypeFromAstPos(AST_POS.CODE_LINE),
      "explanation": None
    })
  return token_list

@typechecked
def filterDataContext(arg: PartialCodeInfo, tableLvInfo: Optional[dtX.TableLevelInfoT], colLvInfo: Optional[dtX.ColLevelInfoT] = None, rowLvInfo: Optional[dtX.RowLevelInfoT] = None) -> Tuple[Optional[dtX.TableLevelInfoT], Optional[dtX.ColLevelInfoT], Optional[dtX.RowLevelInfoT]]:
  method_name = arg["method_name"]
  need_obj = arg["need_obj"]
  df_name = arg["df_name"]
  col_name = arg["col_name"]
  filteredTLI: Optional[dtX.TableLevelInfoT] = None
  filteredCLI: Optional[dtX.ColLevelInfoT] = None
  filteredRLI: Optional[dtX.RowLevelInfoT] = None
  if (not method_name) or (need_obj < 0):
    debugger.warning(f"[filterDataContext] method_name {method_name} or need_obj {need_obj} not specified")
    return filteredTLI, filteredCLI, filteredRLI
  
  if method_name == SptMethodName.DF_COL or method_name == SptMethodName.COL_METHOD_NAME:
    filteredTLI = tableLvInfo
    if colLvInfo is not None and colLvInfo.get(df_name) is not None and colLvInfo[df_name].get(col_name) is not None:
      infoItem: dtX._ColLevelInfoT = colLvInfo[df_name][col_name]
      filteredCLI = {
        df_name: {
          col_name: {
            "dtype": infoItem["dtype"],
            "nullCount": infoItem["nullCount"],
            "sortedness": infoItem["sortedness"],
            "cardinality": infoItem["cardinality"],
            "uniqueValues": infoItem["uniqueValues"][:50] if infoItem["uniqueValues"] is not None else None,
            "uvCounts": None,
            "minValue": infoItem["minValue"],
            "maxValue": infoItem["maxValue"],
            "sample": infoItem["sample"][:50] if infoItem["sample"] is not None else None
          }
        }
      }
    filteredRLI = None
  elif method_name in [SptMethodName.COL_STR_REPLACE, SptMethodName.COL_FILLNA, SptMethodName.COL_REPLACE, SptMethodName.VALUE_FILTER]:
    filteredTLI = None
    if colLvInfo is not None and colLvInfo.get(df_name) is not None and colLvInfo[df_name].get(col_name) is not None:
      infoItem: dtX._ColLevelInfoT = colLvInfo[df_name][col_name]
      filteredCLI = {
        df_name: {
          col_name: {
            "dtype": infoItem["dtype"],
            "nullCount": infoItem["nullCount"],
            "sortedness": None,
            "cardinality": None,
            "uniqueValues": infoItem["uniqueValues"][:50] if infoItem["uniqueValues"] is not None else None,
            "uvCounts": None,
            "minValue": infoItem["minValue"],
            "maxValue": infoItem["maxValue"],
            "sample": infoItem["sample"][:50] if infoItem["sample"] is not None else None
          }
        }
      }
    filteredRLI = None
  elif method_name in [SptMethodName.DF_SORT_VALUES, SptMethodName.DF_DROP_DUPLICATES, SptMethodName.DF_DROP, SptMethodName.DF_RENAME, SptMethodName.DF_MELT, SptMethodName.DF_PIVOT, SptMethodName.DF_PIVOT_TABLE]:
    filteredTLI = None
    filteredCLI = None
    if rowLvInfo is not None and rowLvInfo.get(df_name) is not None:
      filteredRLI = {
        df_name: rowLvInfo[df_name]
      }
  elif method_name in [SptMethodName.DF_DROPNA]:
    if tableLvInfo is not None and tableLvInfo.get(df_name) is not None:
      filteredTLI = {
        df_name: {
          "numRows": None,
          "numCols": None,
          "columnNameList": tableLvInfo[df_name]["columnNameList"]
        }
      }
    if colLvInfo is not None and colLvInfo.get(df_name) is not None:
      filteredCLI = {
        df_name: {}
      }
      for col in colLvInfo[df_name]:
        filteredCLI[df_name][col] = {
          "dtype": colLvInfo[df_name][col]["dtype"],
          "nullCount": colLvInfo[df_name][col]["nullCount"],
          "sortedness": None,
          "cardinality": None,
          "uniqueValues": None,
          "uvCounts": None,
          "minValue": None,
          "maxValue": None,
          "sample": None
        }
  elif method_name == SptMethodName.DF_GROUPBY:
    if tableLvInfo is not None and tableLvInfo.get(df_name) is not None:
      filteredTLI = {
        df_name: tableLvInfo[df_name]
      }
    filteredCLI = {}
    if colLvInfo is not None and colLvInfo.get(df_name) is not None:
      filteredCLI[df_name] = {}
      dfObj = colLvInfo[df_name]
      for col in dfObj:
        # TODO: We also include unknown type
        if dfObj[col].get("dtype") is None or utilsX.isCateColumn(dfObj[col]["dtype"]):
          filteredCLI[df_name][col] = {
            "dtype": dfObj[col]["dtype"],
            "nullCount": None,
            "sortedness": None,
            "cardinality": dfObj[col]["cardinality"],
            "uniqueValues": None,
            "uvCounts": None,
            "minValue": None,
            "maxValue": None,
            "sample": None
          }
    if rowLvInfo is not None and rowLvInfo.get(df_name) is not None:
      filteredRLI = {
        df_name: {
          "columnNameList": rowLvInfo[df_name]["columnNameList"],
          "sampleRows": rowLvInfo[df_name]["sampleRows"][:5] if rowLvInfo[df_name]["sampleRows"] is not None else None
        }
      }
  elif method_name == SptMethodName.COLUMNS_SELECT:
    if tableLvInfo is not None and tableLvInfo.get(df_name) is not None:
      filteredTLI = {
        df_name: {
          "numRows": None,
          "numCols": None,
          "columnNameList": tableLvInfo[df_name]["columnNameList"]
        }
      }
    filteredCLI = None
    filteredRLI = None
  elif method_name == SptMethodName.ASSIGN_STMT:
    filteredTLI = tableLvInfo
    if col_name is not None and colLvInfo is not None and colLvInfo.get(df_name) is not None and colLvInfo[df_name].get(col_name) is not None:
      filteredCLI = {
        df_name: {
          col_name: {
            "dtype": colLvInfo[df_name][col_name]["dtype"],
            "nullCount": colLvInfo[df_name][col_name]["nullCount"],
            "sortedness": colLvInfo[df_name][col_name]["sortedness"],
            "cardinality": colLvInfo[df_name][col_name]["cardinality"],
            "uniqueValues": colLvInfo[df_name][col_name]["uniqueValues"][:50] if colLvInfo[df_name][col_name]["uniqueValues"] is not None else None,
            "uvCounts": None,
            "minValue": colLvInfo[df_name][col_name]["minValue"],
            "maxValue": colLvInfo[df_name][col_name]["maxValue"],
            "sample": colLvInfo[df_name][col_name]["sample"][:50] if colLvInfo[df_name][col_name]["sample"] is not None else None
          }
        }
      }
    if filteredCLI is None:
      filteredRLI = {}
      for dfName in rowLvInfo:
        filteredRLI[dfName] = {
          "columnNameList": rowLvInfo[dfName]["columnNameList"],
          "sampleRows": rowLvInfo[dfName]["sampleRows"][:5] if rowLvInfo[dfName]["sampleRows"] is not None else None
        }
  elif method_name == SptMethodName.COMMENT or method_name == SptMethodName.CODE_LINE or method_name == SptMethodName.DF_MERGE or method_name == SptMethodName.DF_JOIN or method_name == SptMethodName.PD_MERGE:
    filteredTLI = tableLvInfo
    filteredCLI = None
    filteredRLI = {}
    for dfName in rowLvInfo:
      filteredRLI[dfName] = {
        "columnNameList": rowLvInfo[dfName]["columnNameList"],
        "sampleRows": rowLvInfo[dfName]["sampleRows"][:5] if rowLvInfo[dfName]["sampleRows"] is not None else None
      }


  return filteredTLI, filteredCLI, filteredRLI

