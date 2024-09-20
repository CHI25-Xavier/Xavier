from typeguard import typechecked
from typing import List

from .. import datatypes as dtX
from src.constant import AST_POS, DF_INFO_TYPE, SPECIAL_CASE, SptMethodName
from src.debugger import debugger
from src.docCtrl import genCtrlDocumentation
from src.utils import getCompletionItemTypeFromAstPos, findAllVarLastOccur, sortDfByOccur, code2DTo0D
from src.lexAnalysis.pyParse import get_tokens_from_code
from ..prompt.createPrompt import gptCompleteForSC
from ..server.myAIClient import myAIClient
from ..prompt import parseGPTOutput as parseGPTX

@typechecked
def getLastNTokenValue(previousCode2D: List[List[str]], n: int) -> str:
  lastline = ""
  if len(previousCode2D) > 0 and len(previousCode2D[-1]) > 0:
    lastline = previousCode2D[-1][-1]
  lastlineTokens: List[dtX.TokenInfo] = get_tokens_from_code(lastline, True)
  lastTokenValue = ""
  if len(lastlineTokens) >= n:
    lastTokenValue = lastlineTokens[-n]["string"]
  return lastTokenValue

@typechecked
def getItemsByPrefix(prefix: str, strList: List[str]) -> List[str]:
  return list(filter(lambda x: x.startswith(prefix), strList))

@typechecked
def getAllColumnNames(tableLvInfo: dtX.TableLevelInfoT) -> List[str]:
  colNames = []
  for dfName in tableLvInfo:
    colNames += tableLvInfo[dfName]["columnNameList"]
  return colNames

@typechecked
def specialCaseComplete(client: myAIClient, token: dtX.JupyterlabToken, tableLvInfo: dtX.TableLevelInfoT, rowLvInfo, previousCode2D: List[List[str]], arg: dtX.PartialCodeInfo) -> List[dtX.CompletionItem]:
  token_list: List[dtX.CompletionItem] = []
  previousCode = code2DTo0D(previousCode2D)
  lastLineCode = previousCode.split("\n")[-1]
  special_case = arg["special_case"]
  if special_case == SPECIAL_CASE.NONE:
    debugger.warning(f"[specialCaseComplete] special_case {special_case} not specified")
    return token_list
  
  all_df_names = list(tableLvInfo.keys())
  dfOcc = findAllVarLastOccur(previousCode, all_df_names)
  ordered_dfName = sortDfByOccur(dfOcc, arg["df_name"])

  if special_case == SPECIAL_CASE.DF_NAME_PREFIX:
    if len(arg["df_name_list"]) == 1 and arg["df_name_list"][0] == token["value"]:
      dfName = arg["df_name_list"][0]
      filteredTLI = {dfName: tableLvInfo[dfName]} if dfName in tableLvInfo else None
      filteredRLI = {dfName: rowLvInfo[dfName]} if dfName in rowLvInfo else None
      prompt = gptCompleteForSC(previousCode, arg["method_name"], arg["need_obj"], filteredTLI, None, filteredRLI)
      resp = client.sendPrompt(prompt)
      pres = parseGPTX.parseReCodeObj(resp, lastLineCode)
      for i, co in enumerate(pres):
        token_list.append({
          "value": co,
          "offset": token["offset"],
          "type": getCompletionItemTypeFromAstPos(arg["need_obj"]),
          "explanation": None
        })
    else:
      for odf in arg["df_name_list"]:
        token_list.append({
          "value": parseGPTX.keepSuffix(lastLineCode, odf),
          "offset": token["offset"],
          "type": getCompletionItemTypeFromAstPos(arg["need_obj"]),
          "explanation": None
        })
  elif special_case == SPECIAL_CASE.DF_SELECT:
    dfName = arg["df_name"]
    filteredRLI = {dfName: rowLvInfo[dfName]}
    prompt = gptCompleteForSC(previousCode, arg["method_name"], arg["need_obj"], None, None, filteredRLI)
    resp = client.sendPrompt(prompt)
    pres = parseGPTX.parseReCodeObj(resp, lastLineCode)
    for i, co in enumerate(pres):
      token_list.append({
        "value": co,
        "offset": token["offset"],
        "type": getCompletionItemTypeFromAstPos(arg["need_obj"]),
        "explanation": None
      })
  elif special_case == SPECIAL_CASE.DF_SELECT_COL_1 or special_case == SPECIAL_CASE.DF_SELECT_COL_2 or special_case == SPECIAL_CASE.DF_SELECT_COL_3:
    for coln in arg["col_name_list"]:
      token_list.append({
        "value": parseGPTX.keepSuffix(lastLineCode, coln) + arg["col_name_quote"],
        "offset": token["offset"],
        "type": getCompletionItemTypeFromAstPos(arg["need_obj"]),
        "explanation": None
      })

  return token_list