import re
import dotenv
from typeguard import typechecked

from src.datatypes import List, Dict, Any, Union, Optional, ColumnInfo
from src.constant import AST_POS, COMPLETION_ITEM_KIND, SPECIAL_CASE, SptMethodName
from src.debugger import debugger

@typechecked
def loadApiKey():
  hasset = dotenv.load_dotenv()
  if not hasset:
    raise RuntimeError(".env file not found")

@typechecked
def getCompletionItemTypeFromAstPos(astPos: int) -> str:
  kind = COMPLETION_ITEM_KIND.get(astPos)
  if kind is None:
    debugger.warning(f"[getCompletionItemTypeFromAstPos] Invalid astPos: {astPos}")
    return ""
  else:
    return kind

@typechecked
def code2DTo0D(code: List[List[str]]) -> str:
  def fn(x: List[str]) -> str:
    return "\n".join(x)
  
  code1D = list(map(fn, code))
  return "\n\n".join(code1D)

@typechecked
def removeQuotes(s: str) -> str:
  if s.startswith("'''") and s.endswith("'''"):
    return s[3:-3] 
  elif s.startswith('"""') and s.endswith('"""'):
    return s[3:-3] 
  elif s.startswith('"') and s.endswith('"'):
    return s[1:-1]
  elif s.startswith("'") and s.endswith("'"):
    return s[1:-1]
  else:
    return s
  
@typechecked
def findAllVarLastOccur(code: str, varNameList: List[str]) -> Dict[str, int]:
  lastOccurDict: Dict[str, int] = {}
  for varName in varNameList:
    lastOccur = code.rfind(varName)
    if lastOccur != -1:
      lastOccurDict[varName] = lastOccur
  return lastOccurDict

@typechecked
def sortDfByOccur(lastOccurDict: Dict[str, int], cxt_dfName: Optional[str] = None) -> List[str]:
  sortedVarList = sorted(lastOccurDict.items(), key=lambda x: x[1], reverse=True)
  sortedVarNameList = [x[0] for x in sortedVarList]
  if (cxt_dfName is not None) and (cxt_dfName in sortedVarNameList):
    sortedVarNameList.remove(cxt_dfName)
    sortedVarNameList.append(cxt_dfName)
  return sortedVarNameList

@typechecked
def getColInfoByName(colArr: List[ColumnInfo], colName: str) -> Optional[ColumnInfo]:
  col_info = None
  for col in colArr:
    if col["colName"] == colName:
      col_info = col
      break
  return col_info

@typechecked
def fullWordMatch(word: str, sentence: str) -> Optional[re.Match[str]]:
  pattern = r"\b" + re.escape(word) + r"\b"
  return re.search(pattern, sentence)


@typechecked
def needAddPrefix(special_case: int, is_trivial: bool, need_obj: int, method_name: Optional[str], cell_value: Optional[str]) -> bool:
  # cases that no need to add prefix
  case1 = (special_case == SPECIAL_CASE.NONE) and is_trivial and (need_obj == AST_POS.CELL_VALUE) and (method_name == SptMethodName.VALUE_FILTER) and (cell_value is not None)
  return (not case1)


def formatNumber(num: Union[int, float]) -> Union[int, float]:
  if isinstance(num, int):
    return num
  elif isinstance(num, float):
    return round(num, 2)
  else:
    debugger.warning(f"[format_number] Invalid input type: {type(num)}")
    return num

@typechecked
def isCateColumn(dtype: str) -> bool:
  return dtype in ["object", "string", "str", "category"]

@typechecked
def isTimeColumn(dtype: str) -> bool:
  return dtype in ["datetime64", "datetime64[ns]"]

@typechecked
def isNumColumn(dtype: str) -> bool:
  INT_TYPE = ['int', 'int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'Int8', 'Int16', 'Int32', 'Int64', 'UInt8', 'UInt16', 'UInt32', 'UInt64']
  FLOAT_TYPE = ['float', 'float_', 'float16', 'float32', 'float64']
  NUM_TYPE = [*INT_TYPE, *FLOAT_TYPE]
  return dtype in NUM_TYPE or isTimeColumn(dtype)

@typechecked
def logInFiles(msg: str):
  with open("log.txt", "a", encoding="utf-8") as f:
    f.write(msg + "\n\n")