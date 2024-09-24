import json
from typeguard import typechecked

from src.constant import DF_INFO_TYPE
from src.datatypes import List, Tuple, Dict, Optional, Union, AllDataFrameStyleT, DocumentationT, ValueShowT, ColumnStyle
from src.debugger import debugger
from src.utils import fullWordMatch

@typechecked
def initAllDfStyle(allDfInfo, allDfStyle: AllDataFrameStyleT) -> None:
  for dfName in allDfInfo:
    allDfStyle[dfName] = {
      "isFold": True,
      "columns": [],
      "isHidden": False,
    }
    for colobj in allDfInfo[dfName]["columns"]:
      allDfStyle[dfName]["columns"].append({
        "colName": colobj["colName"],
        "isFold": True,
        "isHidden": False,
      })

@typechecked
def multiTableStyleCtrl(co: str, allDfStyle: AllDataFrameStyleT, known_dfName: Optional[str]) -> None:
  need_dfName: List[str] = []
  # 1. match code obj
  for dfName in allDfStyle:
    if fullWordMatch(dfName, co):
      need_dfName.append(dfName)
  # 2. match nearby context
  if known_dfName:
    if known_dfName not in allDfStyle:
      debugger.warning("[multiTableStyleCtrl] known_dfName not in allDfStyle")
      return
    need_dfName.append(known_dfName)
  # 3. further decide
  if len(need_dfName) == 0:
    debugger.warning(f"[multiTableStyleCtrl] no dfName found for co: {co}, known_dfName: {known_dfName}.")
  else:
    for dfName in allDfStyle:
      if dfName in need_dfName:
        continue
      allDfStyle[dfName]["isHidden"] = True

@typechecked
def singleTableStyleCtrl(co: str, allDfStyle: AllDataFrameStyleT, known_dfName: Optional[str]) -> None:
  need_dfName: str = ""
  if known_dfName:
    # 1. match nearby context
    if known_dfName not in allDfStyle:
      debugger.warning("[singleTableStyleCtrl] known_dfName not in allDfStyle")
      return
    need_dfName = known_dfName
  else:
    # 2. match code obj
    for dfName in allDfStyle:
      if fullWordMatch(dfName, co):
        need_dfName = dfName
        break
  # 3. further decide
  if need_dfName == "":
    debugger.warning("[singleTableStyleCtrl] no dfName found for co: {co}, known_dfName: {known_dfName}.")
    return
  allDfStyle[need_dfName]["isHidden"] = False
  allDfStyle[need_dfName]["isFold"] = False
  for dfName in allDfStyle:
    if dfName != need_dfName:
      allDfStyle[dfName]["isHidden"] = True
    

@typechecked
def singleColumnStyleCtrl(co: str, allDfStyle: AllDataFrameStyleT, known_dfName: Optional[str], known_colName: Optional[str], known_colIdxList: Optional[str]) -> None:
  need_cols: Dict[str, List[ColumnStyle]] = {}
  # 1. match nearby context
  if known_dfName:
    need_cols[known_dfName] = []
    if known_colName:
      for colobj in allDfStyle[known_dfName]["columns"]:
        if colobj["colName"] == known_colName:
          need_cols[known_dfName].append(colobj)
          break
    if known_colIdxList:
      for colobj in allDfStyle[known_dfName]["columns"]:
        if fullWordMatch(colobj["colName"], known_colIdxList):
          need_cols[known_dfName].append(colobj)
  # 2. match code obj
  for dfName in allDfStyle:
    if fullWordMatch(dfName, co):
      need_cols[dfName] = []
      for colobj in allDfStyle[dfName]["columns"]:
        if fullWordMatch(colobj["colName"], co):
          need_cols[dfName].append(colobj)
  # 3. further decide: no df, or multiple df
  names = list(need_cols.keys())
  if len(names) == 0:
    debugger.warning(f"[singleColumnStyleCtrl] no dataframe found for co: {co}, known_dfName: {known_dfName}, known_colName: {known_colName}, known_colIdxList: {known_colIdxList}.")
    return
  elif len(names) > 1:
    for dfName in allDfStyle:
      if dfName not in names:
        allDfStyle[dfName]["isHidden"] = True
    return
  # 4. further decide: single df
  for dfName in allDfStyle:
      if dfName not in names:
        allDfStyle[dfName]["isHidden"] = True
      else:
        allDfStyle[dfName]["isHidden"] = False
        allDfStyle[dfName]["isFold"] = False

  colNames = list(map(lambda x: x["colName"], need_cols[names[0]]))
  if len(need_cols[names[0]]) == 0:
    debugger.warning(f"[singleColumnStyleCtrl] no column found for co: {co}, known_dfName: {known_dfName}, known_colName: {known_colName}, known_colIdxList: {known_colIdxList}.")
    return
  elif len(need_cols[names[0]]) > 1:
    for colobj in allDfStyle[names[0]]["columns"]:
      if colobj["colName"] not in colNames:
        colobj["isHidden"] = True
    return
  else:
    for colobj in allDfStyle[names[0]]["columns"]:
      if colobj["colName"] not in colNames:
        colobj["isHidden"] = True
      else:
        colobj["isHidden"] = False
        colobj["isFold"] = False


@typechecked
def genCtrlDocumentation(df_info_type: str, co: str, allDfInfo, known_dfName: Optional[str], known_colName: Optional[str], known_cellValue: Optional[str], known_colIdxList: Optional[str]) -> str:
  # TODO: add need_obj constraint
  allDfStyle: AllDataFrameStyleT = {}
  initAllDfStyle(allDfInfo, allDfStyle)

  if df_info_type == DF_INFO_TYPE.MULTI_TABLE:
    multiTableStyleCtrl(co, allDfStyle, known_dfName)
  elif df_info_type == DF_INFO_TYPE.SIN_TABLE:
    singleTableStyleCtrl(co, allDfStyle, known_dfName)
  elif df_info_type == DF_INFO_TYPE.MULTI_COL:
    debugger.warning("[genCtrlDocumentation] DF_INFO_TYPE.MULTI_COL not supported yet")
  elif df_info_type == DF_INFO_TYPE.SIN_COL:
    singleColumnStyleCtrl(co, allDfStyle, known_dfName, known_colName, known_colIdxList)
  else:
    debugger.warning(f"[genCtrlDocumentation] not supported df_info_type: {df_info_type}")
  
  value_show: Union[None, ValueShowT] = None
  if known_dfName and known_colName and known_cellValue:
    value_show = {
      "dfName": known_dfName,
      "colName": known_colName,
      "cellValue": known_cellValue
    }

  doc: DocumentationT = {
    "type": "highlight",
    "explanation": None,
    "highlight": allDfStyle,
    "value_show": value_show,
  }
  doc_str = json.dumps(doc)
  return doc_str

@typechecked
def genExpDocumentation(exp: str) -> str:
  doc: DocumentationT = {
    "type": "explanation",
    "explanation": exp,
    "highlight": None,
    "value_show": None,
  }
  doc_str = json.dumps(doc)
  return doc_str