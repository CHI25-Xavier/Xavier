import re
from typing import Optional, List, Dict, Tuple, Any
from typeguard import typechecked


@typechecked
def keepSuffix(srcStr: str, newStr: str) -> str:
  # Example: keepSuffix("abcdefg", "efghijk") => "hijk"
  matchSubLen = -1
  for i in range(min(len(srcStr), len(newStr))):
    sublen = i + 1
    srcStrSub = srcStr[(len(srcStr)-sublen):len(srcStr)]
    newStrSub = newStr[0:sublen]
    if srcStrSub == newStrSub:
      matchSubLen = sublen
  
  if matchSubLen == -1:
    return newStr
  else:
    return newStr[matchSubLen:]

@typechecked
def removeBackTick(text: str) -> str:
  # Example: removeBackTick("`hello`") => "hello"
  if text.startswith("```") and text.endswith("```"):
    return text[3:-3]
  elif text.startswith("`") and text.endswith("`"):
    return text[1:-1]
  else:
    return text
  
@typechecked
def parseReCodeObj(codeObj: str, lastLineCode: str) -> List[str]:
  pres: List[str] = []
  lines = codeObj.split("\n")
  for line in lines:
    # Use regular expression to extract things like "1. " or "2. "
    searchres = re.search(r"\d+\.[ ]*", line)
    if searchres:
      cutidx = searchres.end()
      realCodeObj = removeBackTick(line[cutidx:])
      pres.append(keepSuffix(lastLineCode, realCodeObj))
  return pres

@typechecked
def parseReCodeObjWithExplanation(codeObj: str, lastLineCode: str) -> Tuple[List[str], List[str]]:
  pres: List[str] = []
  pexp: List[str] = []
  lines = codeObj.split("\n")
  for line in lines:
    # Use regular expression to extract things like "1. " or "2. "
    searchres = re.search(r"\d+\.[ ]*", line)
    if searchres:
      cutidx = searchres.end()
      codeAndExp = line[cutidx:].split("|")
      code = codeAndExp[0].rstrip()
      exp = codeAndExp[1].lstrip() if len(codeAndExp) > 1 else ""
      realCodeObj = removeBackTick(code)
      pres.append(keepSuffix(lastLineCode, realCodeObj))
      pexp.append(exp)
  return pres, pexp