import copy
from typeguard import typechecked

from src.lexAnalysis.pyParse import getPandasAlias, matchRulesPDFuncSig, matchRulesGlobal, matchRulesDfFuncSig, matchRulesSeFuncSig, matchRulesSeStrFuncSig, getSTFromMatchDetail, isComment
from ..lexAnalysis import pyParse as pyParseX
from .. import datatypes as dtX
from ..prompt import createPrompt as cpX
from .. import utils as utilsX
from ..lexAnalysis import fixJedi as fixJediX

from src.server.myAIClient import myAIClient
from src.lexAnalysis.pyParse import get_tokens_from_code
from src.constant import AST_POS, SpecialTokens, SPECIAL_CASE, SptMethodName, DF_INFO_TYPE, PROMPT_MARKER
from src.server.myCompletionServer import myCompletionServer
from src.datatypes import List, Tuple, Optional, PartialCodeInfo, CompletionItem, JupyterlabToken, TokenInfo
from src.trivial.trivialComplete import trivialComplete
from ..trivial import specialCaseComplete as sccX
from src.debugger import debugger
from ..prompt import share as shareX
from ..prompt import fmtCtrl as fmtCtrlX

@typechecked
def cacheCodeMatch(pTokens: List[TokenInfo], cacheTokens: List[TokenInfo]) -> bool:
  if len(pTokens) != len(cacheTokens):
    return False
  for i in range(len(pTokens)):
    case1 = (pTokens[i]["exact_type"] != cacheTokens[i]["exact_type"])
    case2 = (pTokens[i]["string"] != cacheTokens[i]["string"])
    case3 = (pTokens[i]["type"] != cacheTokens[i]["type"])
    if case1 or case2 or case3:
      return False
  return True

@typechecked
def try_complete(server: myCompletionServer, client: myAIClient, previousCode2D: List[List[str]], token: JupyterlabToken, tableLvInfo: dtX.TableLevelInfoT, colLvInfo: dtX.ColLevelInfoT, rowLvInfo: dtX.RowLevelInfoT) -> Tuple[List[CompletionItem], PartialCodeInfo]:
  analyze_resp = try_analyze_code(server, previousCode2D, tableLvInfo)

  # debugger.info(f"analyze_resp: {analyze_resp}")
  # return []

  previousCode = utilsX.code2DTo0D(previousCode2D)
  pTokens: List[TokenInfo] = get_tokens_from_code(previousCode, True)
  token_list: List[CompletionItem] = []
  cacheUsed: bool = False
  need_obj = analyze_resp["need_obj"]
  special_case = analyze_resp["special_case"]
  is_trivial = analyze_resp["is_trivial"]

  # cache = server.completionCache.get(need_obj)
  # if cache:
  #   # 1. use cache if possible
  #   m = cacheCodeMatch(pTokens, cache["previousTokens"])
  #   if m and len(cache["completionList"]):
  #     cacheUsed = True
  #     token_list = copy.deepcopy(cache["completionList"])

  if not cacheUsed:
#     prompt = "Suppose you are a code autocompletion tool, and a user has typed some Python code below. Please complete the code.\n\n"
#     prompt += shareX.wrapPythonCode(previousCode) + "\n\n"
#     prompt += f"""please: (1) think of the possible codes (e.g. data transformation operations applied to the datasets) the user wants to write; (2) rank these codes based on the correlation between the code and "{PROMPT_MARKER.CODE_CONTEXT}"; (3) provide the autocompletion prompt and add to {PROMPT_MARKER.CURSOR} of the code, {fmtCtrlX.fmtCtrl_noExplanation(False)}. The output format is like:
# 1. <rest part of code line 1>
# 2. <rest part of code line 2>
# ...
# {fmtCtrlX.fmtCtrl_additionalNotes("codeLine", False, fmtCtrlX.forbiddenFunc())}"""
#     token_list = cpX.gptComplete_Exe(client, token, prompt, previousCode, analyze_resp["need_obj"])


    if special_case != SPECIAL_CASE.NONE:
      # special case handling
      token_list = sccX.specialCaseComplete(client, token, tableLvInfo, rowLvInfo, previousCode2D, analyze_resp)
    elif is_trivial:
      # 2. some trivial cases can be handled directly
      token_list = trivialComplete(need_obj, token, previousCode, analyze_resp, tableLvInfo)
    else:
      # 3. GPT-4 completion for more complex cases
      prompt: Optional[str] = None
      filteredTLI, filteredCLI, filteredRLI = cpX.filterDataContext(analyze_resp, tableLvInfo, colLvInfo, rowLvInfo)
      if (filteredTLI is not None) or (filteredCLI is not None) or (filteredRLI is not None):
        prompt = cpX.gptCompleteForSC(previousCode, analyze_resp["method_name"], analyze_resp["need_obj"], filteredTLI, filteredCLI, filteredRLI)
      if prompt is not None:
        token_list = cpX.gptComplete_Exe(client, token, prompt, previousCode, analyze_resp["need_obj"])

      

    # update cache, remember to save the token_list without a token value as the prefix
    if analyze_resp["need_obj"] in server.completionCache:
      server.completionCache[analyze_resp["need_obj"]] = {
        "previousTokens": pTokens,
        "completionList": copy.deepcopy(token_list)
      }

  # Add the token value as the prefix to the completion items
  if utilsX.needAddPrefix(special_case, is_trivial, need_obj, analyze_resp["method_name"], analyze_resp["cell_value"]):
    for i in range(len(token_list)):
      token_list[i]["value"] = token["value"] + token_list[i]["value"]

  return token_list, analyze_resp

@typechecked
def try_analyze_code(server: myCompletionServer, code: List[List[str]], tableLvInfo: dtX.TableLevelInfoT) -> PartialCodeInfo:
  pandasAlias = getPandasAlias(code)
  lastline = code[-1][-1]
  lastline_tokens = get_tokens_from_code(lastline, True)
  secondLastline = code[-1][-2] if len(code[-1]) >= 2 else None
  secondLastline_tokens = get_tokens_from_code(secondLastline, True) if secondLastline is not None else None
  res: PartialCodeInfo = {
    "method_name": None,
    "need_obj": AST_POS.INVALID,
    "df_name": None,
    "df_name_list": None,
    "col_name": None,
    "col_name_list": None,
    "col_name_quote": None,
    "op_name": None,
    "cell_value": None,
    "col_idx_list": None,
    "df_info_type": "",
    "special_case": SPECIAL_CASE.NONE,
    "is_trivial": False,
  }
  
  sigs = fixJediX.get_signature_fixjedi(lastline, pandasAlias)
  scNo = pyParseX.specialCaseDetect(lastline_tokens, pandasAlias, tableLvInfo)
  final_rule, match_detail = matchRulesGlobal(lastline_tokens, pandasAlias, tableLvInfo)
  need_obj_maybe = final_rule.get("need_obj", AST_POS.INVALID)
  df_info_type_maybe = final_rule.get("df_info_type", "")
  method_name_maybe = final_rule.get("full_name", "")
  is_trivial_maybe = final_rule.get("is_trivial", False)


  if len(sigs) == 0:
    if isComment(lastline_tokens):
      # Comment to comment
      res["is_trivial"] = False
      res["need_obj"] = AST_POS.COMMENT
      res["df_info_type"] = DF_INFO_TYPE.USER_SPECIFIED
      res["method_name"] = SptMethodName.COMMENT
    elif lastline == "" and secondLastline_tokens and isComment(secondLastline_tokens):
      # Comment to code
      res["is_trivial"] = False
      res["need_obj"] = AST_POS.CODE_LINE
      res["df_info_type"] = DF_INFO_TYPE.USER_SPECIFIED
      res["method_name"] = SptMethodName.CODE_LINE
    elif scNo == SPECIAL_CASE.DF_NAME_PREFIX:
      res["method_name"] = SptMethodName.PREFIX_DF_NAME
      res["need_obj"] = AST_POS.CODE_LINE
      res["df_name_list"] = sccX.getItemsByPrefix(lastline_tokens[-1]["string"], list(tableLvInfo.keys()))
      res["special_case"] = scNo
    elif scNo == SPECIAL_CASE.DF_SELECT:
      res["method_name"] = SptMethodName.DF_SELECT
      res["need_obj"] = AST_POS.CODE_LINE
      res["df_name"] = lastline_tokens[-2]["string"]
      res["special_case"] = scNo
    elif scNo == SPECIAL_CASE.DF_SELECT_COL_1:
      res["method_name"] = SptMethodName.PREFIX_COL_NAME
      res["need_obj"] = AST_POS.CODE_LINE
      res["col_name_quote"] = lastline_tokens[-1]["string"]
      res["df_name"] = lastline_tokens[-3]["string"]
      res["col_name_list"] = tableLvInfo[res["df_name"]]["columnNameList"]
      res["special_case"] = scNo
    elif scNo == SPECIAL_CASE.DF_SELECT_COL_2:
      res["method_name"] = SptMethodName.PREFIX_COL_NAME
      res["need_obj"] = AST_POS.CODE_LINE
      res["col_name_quote"] = lastline_tokens[-2]["string"]
      res["df_name"] = lastline_tokens[-4]["string"]
      res["col_name_list"] = sccX.getItemsByPrefix(lastline_tokens[-1]["string"], tableLvInfo[res["df_name"]]["columnNameList"])
      res["special_case"] = scNo
    elif scNo == SPECIAL_CASE.DF_SELECT_COL_3:
      res["method_name"] = SptMethodName.PREFIX_COL_NAME
      res["need_obj"] = AST_POS.CODE_LINE
      res["col_name_quote"] = lastline_tokens[-2]["string"]
      res["df_name"] = None
      res["col_name_list"] = sccX.getItemsByPrefix(lastline_tokens[-1]["string"], sccX.getAllColumnNames(tableLvInfo))
      res["special_case"] = scNo
    elif method_name_maybe == SptMethodName.DF_COL:
      res["method_name"] = method_name_maybe
      res["need_obj"] = need_obj_maybe
      res["df_name"] = getSTFromMatchDetail(match_detail, SpecialTokens.DF)
      res["col_name"] = utilsX.removeQuotes(getSTFromMatchDetail(match_detail, SpecialTokens.COLIDX))
    elif method_name_maybe == SptMethodName.VALUE_FILTER:
      maybeDfNames = getSTFromMatchDetail(match_detail, SpecialTokens.DF, "all")
      if len(list(set(maybeDfNames))) == 1:
        res["method_name"] = method_name_maybe
        res["need_obj"] = need_obj_maybe
        res["df_name"] = maybeDfNames[0]
        res["col_name"] = utilsX.removeQuotes(getSTFromMatchDetail(match_detail, SpecialTokens.COLIDX))
    elif method_name_maybe == SptMethodName.COLUMNS_SELECT and is_trivial_maybe:
      res["method_name"] = method_name_maybe
      res["need_obj"] = need_obj_maybe
      res["df_name"] = getSTFromMatchDetail(match_detail, SpecialTokens.DF)
      res["col_name_list"] = tableLvInfo[res["df_name"]]["columnNameList"]
      res["is_trivial"] = is_trivial_maybe
    elif method_name_maybe == SptMethodName.GROUPBY_COLSELECT and is_trivial_maybe:
      res["method_name"] = method_name_maybe
      res["need_obj"] = need_obj_maybe
      res["df_name"] = getSTFromMatchDetail(match_detail, SpecialTokens.DF)
      res["col_name_list"] = tableLvInfo[res["df_name"]]["columnNameList"]
      res["is_trivial"] = is_trivial_maybe
    else:
      res["special_case"] = scNo
      res["need_obj"] = need_obj_maybe
      res["df_info_type"] = df_info_type_maybe
      res["method_name"] = method_name_maybe
      res["is_trivial"] = is_trivial_maybe
      res["df_name"] = getSTFromMatchDetail(match_detail, SpecialTokens.DF)
      res["col_name"] = getSTFromMatchDetail(match_detail, SpecialTokens.COLIDX)
      res["op_name"] = getSTFromMatchDetail(match_detail, SpecialTokens.OP)
      res["cell_value"] = getSTFromMatchDetail(match_detail, SpecialTokens.CELL_VALUE)
      res["col_idx_list"] = getSTFromMatchDetail(match_detail, SpecialTokens.COLIDX_LIST)
      if res["col_name"] is not None:
        res["col_name"] = utilsX.removeQuotes(res["col_name"])
  else:
    sig = sigs[0] # @TODO: Only consider the first signature
    if scNo == SPECIAL_CASE.DF_SELECT_COL_3:
      res["method_name"] = SptMethodName.PREFIX_COL_NAME
      res["need_obj"] = AST_POS.CODE_LINE
      res["col_name_quote"] = lastline_tokens[-2]["string"]
      res["df_name"] = None
      res["col_name_list"] = sccX.getItemsByPrefix(lastline_tokens[-1]["string"], sccX.getAllColumnNames(tableLvInfo))
      res["special_case"] = scNo
    elif sig["type"] == "function" and sig["module_name"].startswith("pandas.core.reshape"):
      final_rule = matchRulesPDFuncSig(lastline_tokens, pandasAlias, sig["name"])
      res["need_obj"] = final_rule.get("need_obj", AST_POS.INVALID)
      res["df_info_type"] = final_rule.get("df_info_type", "")
      res["method_name"] = final_rule.get("full_name", "")
      res["is_trivial"] = final_rule.get("is_trivial", False)
    elif sig["type"] == "function" and sig["module_name"].startswith("pandas.core.frame"):
      final_rule, dfName = matchRulesDfFuncSig(lastline_tokens, tableLvInfo, sig["name"])
      res["need_obj"] = final_rule.get("need_obj", AST_POS.INVALID)
      res["df_info_type"] = final_rule.get("df_info_type", "")
      res["method_name"] = final_rule.get("full_name", "")
      res["is_trivial"] = final_rule.get("is_trivial", False)
      res["df_name"] = dfName
      if res["method_name"] == "" and dfName != "" and lastline_tokens[-1]["string"] in ["'", '"']:
        res["need_obj"] == AST_POS.CODE_LINE
        res["method_name"] = SptMethodName.PREFIX_COL_NAME
        res["col_name_list"] = tableLvInfo[dfName]["columnNameList"]
        res["col_name_quote"] = lastline_tokens[-1]["string"]
        res["special_case"] = SPECIAL_CASE.DF_SELECT_COL_3
    elif sig["type"] == "function" and sig["module_name"].startswith("pandas.core.series"):
      final_rule, dfName, colName = matchRulesSeFuncSig(lastline_tokens, pandasAlias, tableLvInfo, sig["name"])
      res["need_obj"] = final_rule.get("need_obj", AST_POS.INVALID)
      res["df_info_type"] = final_rule.get("df_info_type", "")
      res["method_name"] = final_rule.get("full_name", "")
      res["is_trivial"] = final_rule.get("is_trivial", False)
      res["df_name"] = dfName
      res["col_name"] = colName
    elif sig["type"] == "function" and sig["module_name"].startswith("pandas.core.strings.accessor"):
      final_rule, dfName, colName = matchRulesSeStrFuncSig(lastline_tokens, pandasAlias, tableLvInfo, sig["name"])
      res["need_obj"] = final_rule.get("need_obj", AST_POS.INVALID)
      res["df_info_type"] = final_rule.get("df_info_type", "")
      res["method_name"] = final_rule.get("full_name", "")
      res["is_trivial"] = final_rule.get("is_trivial", False)
      res["df_name"] = dfName
      res["col_name"] = colName

  debugger.info(f"[try_analyze_code] res: {res} \nsig: {sigs}")
  return res

