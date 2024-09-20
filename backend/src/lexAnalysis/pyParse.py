import io
import copy
import tokenize
from typeguard import typechecked

from src.constant import AST_POS, SpecialTokens, SPECIAL_CASE
from .. import datatypes as dtX
from src.datatypes import Set, List, Dict, Union, Literal, Optional, Tuple, Any, TokenInfo, MultiLevelPrefix, SpecialTokenMapping
from src.debugger import debugger
from src.lexAnalysis.analyzeConfig import ANALYZE_RULES, AnalyzeEntry, AnalyzeClasses
from src.utils import removeQuotes

@typechecked
def get_tokens_from_code(code: str, isStripped: bool = False) -> List[TokenInfo]:  
  result: List[TokenInfo] = []  
  gen = tokenize.tokenize(io.BytesIO(code.encode('utf-8')).readline)
  next(gen)  # skip the first token, which is always ENCODING

  try:
    for token in gen:
      # debugger.info(token.string, token.type, token.exact_type, token.line)
      result.append({
        "string": token.string,
        "type": token.type,
        "exact_type": token.exact_type,
      })
  except tokenize.TokenError as e:
    pass

  if isStripped:
    result = stripBehindLastLine(result)
  return result

@typechecked
def stripBehindLastLine(lastline: List[TokenInfo]) -> List[TokenInfo]:
  i = len(lastline) - 1
  while i >= 0 and (lastline[i]["exact_type"] == tokenize.NEWLINE or lastline[i]["exact_type"] == tokenize.ENDMARKER):
    i -= 1

  return copy.deepcopy(lastline[:i+1])

@typechecked
def isLeftBracket(t: TokenInfo) -> bool:
  case1 = (t["string"] == "(")
  case2 = (t["string"] == "[")
  case3 = (t["string"] == "{")
  return case1 or case2 or case3

@typechecked
def isRightBracket(t: TokenInfo) -> bool:
  case1 = (t["string"] == ")")
  case2 = (t["string"] == "]")
  case3 = (t["string"] == "}")
  return case1 or case2 or case3

@typechecked
def isBracketMatch(left: TokenInfo, right: TokenInfo) -> bool:
  case1 = (left["string"] == "(" and right["string"] == ")")
  case2 = (left["string"] == "[" and right["string"] == "]")
  case3 = (left["string"] == "{" and right["string"] == "}")
  return case1 or case2 or case3

@typechecked
def checkParenSyntax(tokenList: List[TokenInfo]) -> bool:
  res = True
  signStack: List[TokenInfo] = []
  for tok in tokenList:
    if isLeftBracket(tok):
      signStack.append(tok)
    elif isRightBracket(tok):
      if len(signStack) == 0: # syntax error
        res = False
        break
      elif isBracketMatch(signStack[-1], tok):
        signStack.pop()
      else: # syntax error
        res = False
        break
  return res

@typechecked
def checkParenSymmetry(tokenList: List[TokenInfo]) -> bool:
  res = True
  signStack: List[TokenInfo] = []
  for tok in tokenList:
    if isLeftBracket(tok):
      signStack.append(tok)
    elif isRightBracket(tok):
      if len(signStack) == 0: # syntax error
        res = False
        break
      elif isBracketMatch(signStack[-1], tok):
        signStack.pop()
      else: # syntax error
        res = False
        break
  return res and (len(signStack) == 0)

@typechecked
def groupTokensByDelimiter(tokenList: List[TokenInfo], start_symbol: str, delimiter: str) -> List[List[TokenInfo]]:
  signStack: List[TokenInfo] = []
  contentStack: List[List[TokenInfo]] = []
  cutIdx = 0
  for i, tok in enumerate(tokenList):
    if tok["string"] == delimiter and len(signStack) == 0:
      contentStack.append(copy.deepcopy(tokenList[cutIdx:i]))
      cutIdx = i + 1
    elif isLeftBracket(tok):
      signStack.append(tok)
    elif isRightBracket(tok):
      # We don't need to check the right bracket match, since it is already checked in checkParenSyntax()
      signStack.pop()
  contentStack.append(copy.deepcopy(tokenList[cutIdx:]))
  return contentStack

@typechecked
def inIndexRange(contentStackLen: int, indexRange: List[Optional[int]]):
  idx = contentStackLen - 1
  lowerBound = indexRange[0] if (indexRange[0] is not None) else 0
  if idx < lowerBound:
    # debugger.info("Index out of range !")
    return False
  if indexRange[1] is not None:
    # debugger.info("Index out of range !!", idx)
    return idx < indexRange[1]
  else:
    # debugger.info("Index out of range !!!")
    return True

@typechecked
def lastLevelPrefixMatch(tokenList: List[TokenInfo], lastLevelPrefix: Optional[List[str]] = None) -> bool:
  if lastLevelPrefix is None:
    return True
  tlLen = len(tokenList)
  llpLen = len(lastLevelPrefix)
  if tlLen != llpLen:
    return False
  for i in range(llpLen):
    if tokenList[i]["string"] != lastLevelPrefix[i]:
      return False
  return True


@typechecked
def multiLevelPrefixMatch(tokenList: List[TokenInfo], multiLevelPrefixes: List[MultiLevelPrefix], lastLevelPrefix: Optional[List[str]] = None) -> bool:
  """
  Input: 
    - A list of tokens like `["(", "ignore_index", "=", "true", ",", "[", "df1", ","]`
    - A list of multi-level prefixes like
    ```[{
      "start_symbol": "(",
      "delimiter": ",",
      "index_range": [1, 2],
      }, {
      "start_symbol": "[",
      "delimiter": ",",
      "index_range": [None, None]
    }]```
    - The prefix of last level like: `[]`

  Output: A boolean value indicating whether the tokens match the multi-level prefix.
  """
  # check the parenthesis syntax
  if not checkParenSyntax(tokenList):
    return False

  res = True
  contentStack: List[List[TokenInfo]] = []
  resToken: List[TokenInfo] = copy.deepcopy(tokenList)
  for mp in multiLevelPrefixes:
    # debugger.info(mp)
    mp_ss = mp["start_symbol"]
    mp_d = mp["delimiter"]
    mp_ir = mp["index_range"]
    # Check if the start symbol matches
    if len(resToken) == 0 or resToken[0]["string"] != mp_ss:
      res = False
      # debugger.info("Start symbol not match")
      break
    # Check symmetry of parenthesis
    if checkParenSymmetry(resToken):
      # Which means we are not in that level
      res = False
      break
    resToken = resToken[1:]
    # Split and group the tokens by delimiter
    contentStack = groupTokensByDelimiter(resToken, mp_ss, mp_d)
    # debugger.info(contentStack, mp_ir, resToken)
    if not inIndexRange(len(contentStack), mp_ir):
      res = False
      # debugger.info("Index range not match")
      break
    resToken = contentStack[-1]
  
  # Check the last level prefix
  if not lastLevelPrefixMatch(resToken, lastLevelPrefix):
    res = False

  return res


@typechecked
def keepSigBody(lastline_tokens: List[TokenInfo], sig_name: str, pandas_alias: Optional[str] = None, allDfInfo = None) -> Tuple[List[TokenInfo], List[TokenInfo]]:
  if len(lastline_tokens) < 4:
    raise ValueError("[keepSigBody] lastline_tokens should have at least 4 tokens")
  case1 = pandas_alias is None
  case2 = allDfInfo is None
  if (case1 and case2) or (not case1 and not case2):
    raise ValueError("[keepSigBody] pandas_alias and allDfInfo are both None or not None")
  
  all_df_names = list(allDfInfo.keys()) if allDfInfo is not None else []
  prefix: List[TokenInfo] = []
  findBody = False
  res: List[TokenInfo] = copy.deepcopy(lastline_tokens)
  for i in range(len(res)-4, -1, -1):
    if res[i]["string"] == pandas_alias and res[i+1]["string"] == "." and res[i+2]["string"] == sig_name:
      findBody = True
      prefix = res[:i+3]
      res = res[i+3:]
      break
    elif res[i]["string"] in all_df_names and res[i+1]["string"] == "." and res[i+2]["string"] == sig_name:
      findBody = True
      prefix = res[:i+3]
      res = res[i+3:]
      break
    elif res[i]["string"] == "]" and res[i+1]["string"] == "." and res[i+2]["string"] == sig_name:
      # e.g. df["A"].isin(
      if i < 3:
        continue
      if res[i-3]["string"] not in all_df_names:
        continue
      col_in_df = allDfInfo.get(res[i-3]["string"], {"columnNameList": []}).get("columnNameList", [])
      if res[i-2]["string"] == "[" and removeQuotes(res[i-1]["string"]) in col_in_df:
        findBody = True
        prefix = res[:i+3]
        res = res[i+3:]
        break
    elif res[i]["string"] == "str" and res[i+1]["string"] == "." and res[i+2]["string"] == sig_name:
      # e.g. df["A"].str.replace(
      if i < 5:
        continue
      if res[i-5]["string"] not in all_df_names:
        continue
      col_in_df = allDfInfo.get(res[i-5]["string"], {"columnNameList": []}).get("columnNameList", [])
      if res[i-4]["string"] == "[" and removeQuotes(res[i-3]["string"]) in col_in_df and res[i-2]["string"] == "]" and res[i-1]["string"] == ".":
        findBody = True
        prefix = res[:i+3]
        res = res[i+3:]
        break
  if not findBody:
    raise ValueError("[keepSigBody] Cannot find the body of signature")
  return res, prefix

@typechecked
def isPandasAlias(key: str, value: str, pandasAlias: str) -> bool:
  return (key == SpecialTokens.PANDAS) and (value == pandasAlias)

@typechecked
def isDfName(key: str, value: str, all_df_names: List[str]) -> bool:
  return (key == SpecialTokens.DF) and (value in all_df_names)

@typechecked
def isLikeColIdx(key: str, value_type: int) -> bool:
  return (key == SpecialTokens.COLIDX) and (value_type == tokenize.STRING)

@typechecked
def isLikeCellValue(key: str, value_type: int) -> bool:
  return (key == SpecialTokens.CELL_VALUE) and (any(value_type == t for t in [tokenize.STRING, tokenize.NUMBER]))

@typechecked
def isOp(key: str, value_type: int, value: str) -> bool:
  return (key == SpecialTokens.OP) and (value_type == tokenize.OP) and value != "="

@typechecked
def specialTokenMatch(prefix_i: int, lastline_i: int, prefixList: List[str], lastline_tokens: List[TokenInfo], pandasAlias: str, all_df_names: List[str]) -> Tuple[bool, int, int]:
  case1 = isPandasAlias(prefixList[prefix_i], lastline_tokens[lastline_i]["string"], pandasAlias)
  case2 = isDfName(prefixList[prefix_i], lastline_tokens[lastline_i]["string"], all_df_names)
  case3 = isLikeColIdx(prefixList[prefix_i], lastline_tokens[lastline_i]["type"])
  # Whether or not the string is a valid column index leaved to following check
  case4 = prefixList[prefix_i] == SpecialTokens.COLIDX_LIST
  # Whether or not the value is valid cell value leaved to following check
  case5 = isLikeCellValue(prefixList[prefix_i], lastline_tokens[lastline_i]["type"])
  case6 = isOp(prefixList[prefix_i], lastline_tokens[lastline_i]["type"], lastline_tokens[lastline_i]["string"])
  
  if case1 or case2 or case3 or case5 or case6:
    return True, prefix_i + 1, lastline_i + 1
  elif case4:
    current_is: Literal["colidx", "comma"] = "colidx"
    while prefix_i < len(prefixList) and lastline_i < len(lastline_tokens):
      if current_is == "colidx" and isLikeColIdx(SpecialTokens.COLIDX, lastline_tokens[lastline_i]["type"]):
        lastline_i += 1
        current_is = "comma"
      elif current_is == "comma" and lastline_tokens[lastline_i]["string"] == ",":
        lastline_i += 1
        current_is = "colidx"
      elif current_is == "comma" and lastline_tokens[lastline_i]["string"] == "[":
        break
      else:
        lastline_i += 1
        case4 = False
        break
    
    return case4, prefix_i + 1, lastline_i
  else:
    return False, prefix_i + 1, lastline_i + 1

@typechecked
def prefixMatch(lastline_tokens: List[TokenInfo], prefixList: List[str], pandasAlias: str, all_df_names: List[str]) -> Tuple[bool, List[SpecialTokenMapping]]:
  specialTokenValues: List[SpecialTokenMapping] = []
  if len(lastline_tokens) < len(prefixList):
    return False, specialTokenValues
  
  lastline_tokens_copy = copy.deepcopy(lastline_tokens)
  prefixList_copy = copy.deepcopy(prefixList)
  lastline_tokens_copy.reverse()
  prefixList_copy.reverse()
  res: bool = True
  
  prefix_i = 0
  lastline_i = 0
  while prefix_i < len(prefixList_copy) and lastline_i < len(lastline_tokens_copy):
    if prefixList_copy[prefix_i] == lastline_tokens_copy[lastline_i]["string"]:
      prefix_i += 1
      lastline_i += 1
      continue
    res, new_prefix_i, new_lastline_i = specialTokenMatch(prefix_i, lastline_i, prefixList_copy, lastline_tokens_copy, pandasAlias, all_df_names)
    if not res:
      break
    else:
      v = lastline_tokens_copy[new_lastline_i-1:lastline_i-1:-1] if lastline_i >= 1 else lastline_tokens_copy[new_lastline_i-1::-1]
      specialTokenValues.append(SpecialTokenMapping(
        key=prefixList_copy[prefix_i],
        value="".join(list(map(lambda x: x["string"], v))),
      ))
      prefix_i = new_prefix_i
      lastline_i = new_lastline_i
  
  specialTokenValues.reverse()
  return res, specialTokenValues

@typechecked
def matchRulesPDFuncSig(lastline_tokens: List[TokenInfo], pandasAlias: str, sigName: str) -> dict:
  final_rule = {
    "need_obj": AST_POS.INVALID,
    "df_info_type": "",
    "full_name": "",
    "is_trivial": False,
  }
  # At least, like: `pd.concat(`
  if len(lastline_tokens) < 4:
    return final_rule
  lastline_tokens_body, _ = keepSigBody(lastline_tokens, sigName, pandas_alias=pandasAlias)

  funcConfig: Optional[dict] = ANALYZE_RULES.get(AnalyzeClasses.IN_PD_FUNC_SIG)
  if funcConfig is None:
    raise ValueError("[matchRulesPDFuncSig] No analyze rules for IN_PD_FUNC_SIG")
  funcConfig = funcConfig.get(sigName)
  if funcConfig is None:
    return final_rule
  funcRules = funcConfig.get(AnalyzeEntry.RULES)
  if funcRules is None:
    return final_rule
  
  rule: Optional[dict] = None
  for _rule in funcRules:
    rule = _rule
    mlPrefix: List[MultiLevelPrefix] = rule.get(AnalyzeEntry.ML_PREFIX)
    llPrefix: Optional[List[str]] = rule.get(AnalyzeEntry.LL_PREFIX)
    if multiLevelPrefixMatch(lastline_tokens_body, mlPrefix, llPrefix):
      final_rule["need_obj"] = rule.get(AnalyzeEntry.NEED_OBJ)
      final_rule["df_info_type"] = rule.get(AnalyzeEntry.DF_INFO_TYPE)
      final_rule["is_trivial"] = rule.get(AnalyzeEntry.IS_TRIVIAL)
      final_rule["full_name"] = funcConfig.get(AnalyzeEntry.FULL_NAME)
      break
  return final_rule

@typechecked
def matchRulesGlobal(lastline_tokens: List[TokenInfo], pandasAlias: str, allDfInfo) -> Tuple[dict, List[SpecialTokenMapping]]:
  final_rule = {
    "need_obj": AST_POS.INVALID,
    "df_info_type": "",
    "full_name": "",
    "is_trivial": False,
  }
  matchDetail: List[SpecialTokenMapping] = []
  # 1. find all configuratons for global rules
  gblCfg: Dict[str, Dict[str, Any]] = ANALYZE_RULES.get(AnalyzeClasses.GLOBAL)
  if gblCfg is None:
    raise ValueError("[matchRulesGlobal] No analyze rules for GLOBAL")
  # 2. traverse all configurations and all rules and find the first match
  cfgIds = list(gblCfg.keys())
  for id in cfgIds:
    found = False
    oneCfg = gblCfg.get(id)
    if (oneCfg is None) or (oneCfg.get(AnalyzeEntry.RULES) is None):
      debugger.warning(f"[matchRulesGlobal] No analyze rules for {id}")
      continue
    rules: List[Dict[str, Any]] = oneCfg.get(AnalyzeEntry.RULES)
    for r in rules:
      mlPrefix: Optional[List[MultiLevelPrefix]] = r.get(AnalyzeEntry.ML_PREFIX)
      if mlPrefix is not None:
        debugger.warning(f"[matchRulesGlobal] Multi-level prefix is currently not supported for global rules")
      llPrefix: List[str] = r.get(AnalyzeEntry.LL_PREFIX)
      isMatch, matchDetail = prefixMatch(lastline_tokens, llPrefix, pandasAlias, list(allDfInfo.keys()))
      if isMatch:
        final_rule["need_obj"] = r.get(AnalyzeEntry.NEED_OBJ)
        final_rule["df_info_type"] = r.get(AnalyzeEntry.DF_INFO_TYPE)
        final_rule["full_name"] = oneCfg.get(AnalyzeEntry.FULL_NAME)
        final_rule["is_trivial"] = r.get(AnalyzeEntry.IS_TRIVIAL)
        found = True
        break
    if found:
      break
  return final_rule, matchDetail

@typechecked
def matchRulesDfFuncSig(lastline_tokens: List[TokenInfo], allDfInfo, sigName: str) -> Tuple[dict, str]:
  final_rule = {
    "need_obj": AST_POS.INVALID,
    "df_info_type": "",
    "full_name": "",
    "is_trivial": False,
  }
  dfName: str = ""
  # At least, like: `df.merge(`
  if len(lastline_tokens) < 4:
    return final_rule, dfName
  lastline_tokens_body, prefix = keepSigBody(lastline_tokens, sigName, allDfInfo=allDfInfo)
  dfName = prefix[-3]["string"]

  funcConfig: Optional[dict] = ANALYZE_RULES.get(AnalyzeClasses.IN_DF_METHOD_SIG)
  if funcConfig is None:
    raise ValueError("[matchRulesDfFuncSig] No analyze rules for IN_DF_METHOD_SIG")
  funcConfig = funcConfig.get(sigName)
  if funcConfig is None:
    return final_rule, dfName
  funcRules = funcConfig.get(AnalyzeEntry.RULES)
  if funcRules is None:
    return final_rule, dfName
  
  rule: Optional[dict] = None
  for _rule in funcRules:
    rule = _rule
    mlPrefix: List[MultiLevelPrefix] = rule.get(AnalyzeEntry.ML_PREFIX)
    llPrefix: Optional[List[str]] = rule.get(AnalyzeEntry.LL_PREFIX)
    if multiLevelPrefixMatch(lastline_tokens_body, mlPrefix, llPrefix):
      final_rule["need_obj"] = rule.get(AnalyzeEntry.NEED_OBJ)
      final_rule["df_info_type"] = rule.get(AnalyzeEntry.DF_INFO_TYPE)
      final_rule["full_name"] = funcConfig.get(AnalyzeEntry.FULL_NAME)
      final_rule["is_trivial"] = rule.get(AnalyzeEntry.IS_TRIVIAL)
      break
  return final_rule, dfName


@typechecked
def matchRulesSeFuncSig(lastline_tokens: List[TokenInfo], pandasAlias: str, allDfInfo, sigName: str) -> Tuple[dict, str, str]:
  final_rule = {
    "need_obj": AST_POS.INVALID,
    "df_info_type": "",
    "full_name": "",
    "is_trivial": False,
  }
  dfName: str = ""
  colName: str = ""
  # Assume `df["A"].isin(`
  if len(lastline_tokens) < 7:
    return final_rule, dfName, colName
  lastline_tokens_body, prefix = keepSigBody(lastline_tokens, sigName, allDfInfo=allDfInfo)
  dfName = prefix[-6]["string"]
  colName = removeQuotes(prefix[-4]["string"])

  funcConfig: Optional[dict] = ANALYZE_RULES.get(AnalyzeClasses.IN_COL_METHOD_SIG)
  if funcConfig is None:
    raise ValueError("[matchRulesSeFuncSig] No analyze rules for IN_COL_METHOD_SIG")
  funcConfig = funcConfig.get(sigName)
  if funcConfig is None:
    return final_rule, dfName, colName
  funcRules = funcConfig.get(AnalyzeEntry.RULES)
  if funcRules is None:
    return final_rule, dfName, colName
  
  rule: Optional[dict] = None
  for _rule in funcRules:
    rule = _rule
    mlPrefix: List[MultiLevelPrefix] = rule.get(AnalyzeEntry.ML_PREFIX)
    llPrefix: Optional[List[str]] = rule.get(AnalyzeEntry.LL_PREFIX)
    if multiLevelPrefixMatch(lastline_tokens_body, mlPrefix, llPrefix):
      final_rule["need_obj"] = rule.get(AnalyzeEntry.NEED_OBJ)
      final_rule["df_info_type"] = rule.get(AnalyzeEntry.DF_INFO_TYPE)
      final_rule["full_name"] = funcConfig.get(AnalyzeEntry.FULL_NAME)
      final_rule["is_trivial"] = rule.get(AnalyzeEntry.IS_TRIVIAL)
      break
  return final_rule, dfName, colName

def matchRulesSeStrFuncSig(lastline_tokens: List[TokenInfo], pandasAlias: str, allDfInfo, sigName: str) -> Tuple[dict, str, str]:
  final_rule = {
    "need_obj": AST_POS.INVALID,
    "df_info_type": "",
    "full_name": "",
    "is_trivial": False,
  }
  dfName: str = ""
  colName: str = ""
  # At least, like: `df["A"].str.replace(`
  if len(lastline_tokens) < 9:
    return final_rule, dfName, colName
  lastline_tokens_body, prefix = keepSigBody(lastline_tokens, sigName, allDfInfo=allDfInfo)
  dfName = prefix[-8]["string"]
  colName = removeQuotes(prefix[-6]["string"])

  funcConfig: dict = ANALYZE_RULES.get(AnalyzeClasses.IN_COL_STR_METHOD_SIG)
  funcConfig = funcConfig.get(sigName, {})
  funcRules: list = funcConfig.get(AnalyzeEntry.RULES, [])
  
  rule: dict = {}
  for _rule in funcRules:
    rule = _rule
    mlPrefix: List[MultiLevelPrefix] = rule.get(AnalyzeEntry.ML_PREFIX)
    llPrefix: Optional[List[str]] = rule.get(AnalyzeEntry.LL_PREFIX)
    if multiLevelPrefixMatch(lastline_tokens_body, mlPrefix, llPrefix):
      final_rule["need_obj"] = rule.get(AnalyzeEntry.NEED_OBJ)
      final_rule["df_info_type"] = rule.get(AnalyzeEntry.DF_INFO_TYPE)
      final_rule["full_name"] = funcConfig.get(AnalyzeEntry.FULL_NAME)
      final_rule["is_trivial"] = rule.get(AnalyzeEntry.IS_TRIVIAL)
      break
  return final_rule, dfName, colName


@typechecked
def getPandasAlias(code: List[List[str]]) -> str:
  default_alias = "pandas"
  target = "import pandas as "
  res = ""
  for block in code:
    for line in block:
      idx = line.find(target)
      if idx >= 0:
        res = line[len(target):].strip()
  if len(res) > 0:
    return res
  else:
    return default_alias

@typechecked
def isComment(lastline_tokens: List[TokenInfo]):
  yes = False
  for t in lastline_tokens:
    if t["exact_type"] == tokenize.COMMENT:
      yes = True
      break
  return yes

@typechecked
def getSTFromMatchDetail(matchDetail: List[SpecialTokenMapping], stKey: str, how: Literal["any", "all"] = "any") -> Union[None, str, List[str]]:
  # get special token value from matchDetail
  res: List[str] = []
  for m in matchDetail:
    if m["key"] == stKey:
      res.append(m["value"])
    if how == "any" and len(res) > 0:
      break
  return None if len(res) == 0 else res if how == "all" else res[0]

@typechecked
def isDfNamePrefix(tok: str, allDfInfo) -> bool:
  # example: tok = df, actual name = "df_name"
  dfNames = list(allDfInfo.keys())
  for dn in dfNames:
    if dn.startswith(tok):
      return True
  return False

@typechecked
def isColNamePrefix(tok: str, tableLvInfo: dtX.TableLevelInfoT, dfName: str) -> bool:
  # example: tok = col, actual name = "col_name"
  colNames = tableLvInfo.get(dfName, {"columnNameList": []}).get("columnNameList", [])
  for cn in colNames:
    if cn.startswith(tok):
      return True
  return False

@typechecked
def specialCaseDetect(lastline_tokens: List[TokenInfo], pandasAlias: str, tableLvInfo: dtX.TableLevelInfoT) -> int:
  case3 = len(lastline_tokens) >= 1 and isDfNamePrefix(lastline_tokens[-1]["string"], tableLvInfo)

  case4 = len(lastline_tokens) >= 2 and lastline_tokens[-1]["string"] == "[" and lastline_tokens[-2]["exact_type"] == tokenize.NAME and lastline_tokens[-2]["string"] in tableLvInfo

  case5 = len(lastline_tokens) >= 3 and lastline_tokens[-1]["string"] in ["'", '"'] and lastline_tokens[-2]["string"] == "[" and lastline_tokens[-3]["exact_type"] == tokenize.NAME and lastline_tokens[-3]["string"] in tableLvInfo

  case6 = len(lastline_tokens) >= 4 and lastline_tokens[-4]["exact_type"] == tokenize.NAME and lastline_tokens[-4]["string"] in tableLvInfo and lastline_tokens[-3]["string"] == "[" and lastline_tokens[-2]["string"] in ["'", '"'] and lastline_tokens[-1]["exact_type"] == tokenize.NAME and isColNamePrefix(lastline_tokens[-1]["string"], tableLvInfo, lastline_tokens[-4]["string"])

  case7 = len(lastline_tokens) >= 2 and lastline_tokens[-2]["string"] in ["'", '"'] and lastline_tokens[-1]["exact_type"] == tokenize.NAME

  debugger.info(f"[specialCaseDetect] {[(t['string'], t['exact_type']) for t in lastline_tokens]}, {case3}, {case4}, {case5}, {case6}, {case7}")
  if case6:
    return SPECIAL_CASE.DF_SELECT_COL_2
  elif case5:
    return SPECIAL_CASE.DF_SELECT_COL_1
  elif case4:
    return SPECIAL_CASE.DF_SELECT
  elif case3:
    return SPECIAL_CASE.DF_NAME_PREFIX
  elif case7:
    return SPECIAL_CASE.DF_SELECT_COL_3
  
  return SPECIAL_CASE.NONE