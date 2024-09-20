from typeguard import typechecked
from typing import Union, List, Optional

from src.datatypes import NumericalStatsT, CategoricalStatsT, ColumnInfo, TopKItemT, BinInfo, _ColLevelInfoT
from .. import datatypes as dtX
from src.debugger import debugger
from ..constant import PROMPT_MARKER
from .. import utils as utilsX

@typechecked
def dataInfoPreamble() -> str:
  return f"""Here is {PROMPT_MARKER.DATA_CONTEXT} in this code script:"""

@typechecked
def otherDataInfoPreamble() -> str:
  return f"""Here is some **additional information about the dataframe(s)** in this code script, only for reference:"""

@typechecked
def multiTableInfo(dfInfo) -> str:
  dfNames = list(dfInfo.keys())
  prompt = ""
  for dfName in dfNames:
    dInfo = dfInfo[dfName]
    num_rows = dInfo["num_rows"]
    num_cols = dInfo["num_cols"]
    prompt += f"""{nameShape2Str(dfName, num_rows, num_cols)}\n"""
    prompt += f"""{colNameType2Str(dInfo["columns"])}\n"""
    prompt += "\n"
  return prompt

@typechecked
def nameShape2Str(dfName: str, num_rows: int, num_cols: int) -> str:
  prompt = f"""DataFrame: {dfName} ({num_rows} rows x {num_cols} columns)"""
  return prompt

@typechecked
def multiTableLvInfoPrompt(tableLvInfo: dtX.TableLevelInfoT) -> str:
  p: str = ""
  for tName, item in tableLvInfo.items():
    p += f"""{tableLevelInfoPrompt(tName, item["numRows"], item["numCols"], item["columnNameList"])}\n"""
  return p

@typechecked
def tableLevelInfoPrompt(dfName: str, num_rows: Optional[int] = None, num_cols: Optional[int] = None, colNames: Optional[List[str]] = None) -> str:
  prompt = f"""DataFrame: {dfName}"""
  if num_rows is not None and num_cols is not None:
    prompt += f""" ({num_rows} rows x {num_cols} columns)"""
  if colNames is not None:
    prompt += f"""\nColumns: {", ".join(colNames)}"""
  return prompt

@typechecked
def multiRowLvInfoPrompt(rowLvInfo: dtX.RowLevelInfoT) -> str:
  p: str = ""
  for tName, item in rowLvInfo.items():
    p += f"""{rowLevelInfoPrompt(tName, item["columnNameList"], item["sampleRows"])}\n"""
  return p

@typechecked
def rowLevelInfoPrompt(dfName: str, colNameList: List[str], sampleRows: Optional[List[dtX.DFRowT]] = None) -> str:
  prompt: str = ""
  if (sampleRows is not None) and (len(colNameList) > 0) and (len(sampleRows) > 0):
    prompt += f"""DataFrame: {dfName}\n"""
    prompt += f"""Sample rows:\n"""
    prompt += getTableHeaderMDFmt(colNameList) + "\n"
    for row in sampleRows:
      prompt += getTableBodyMDFmt(colNameList, [row])
  return prompt

@typechecked
def multiColLvInfoPrompt(colLvInfo: dtX.ColLevelInfoT, tableLvInfo: Optional[dtX.TableLevelInfoT]) -> str:
  p: str = ""
  for tName, titem in colLvInfo.items():
    p += f"""DataFrame: {tName}\n"""
    tLvInfo = tableLvInfo[tName] if tableLvInfo is not None else None
    for cName, citem in titem.items():
      p += colLevelInfoPrompt("\t", cName, citem, tLvInfo)
  return p

@typechecked
def colLevelInfoPrompt(indent: str, colName: str, citem: _ColLevelInfoT, tLvInfo: Union[None, dtX._TableLevelInfoT]) -> str:
  prompt = f"""{indent}Column: {colName}"""
  if citem["dtype"] is not None:
    prompt += f""" (Data type: {citem["dtype"]})\n"""
  else:
    prompt += "\n"
  if citem["nullCount"] is not None and citem["nullCount"] > 0:
    prompt += f"""{indent}{indent}null_count: {citem["nullCount"]}\n"""
  if citem["sortedness"] is not None:
    if citem["sortedness"] == "asc":
      prompt += f"""{indent}{indent}The values are sorted in ascending order.\n"""
    elif citem["sortedness"] == "desc":
      prompt += f"""{indent}{indent}The values are sorted in descending order.\n"""
    else:
      prompt += f"""{indent}{indent}The values are not sorted.\n"""

  if utilsX.isNumColumn(citem["dtype"]):
    if citem["minValue"] is not None and citem["maxValue"] is not None:
      prompt += f"""{indent}{indent}min: {citem["minValue"]}\n"""
      prompt += f"""{indent}{indent}max: {citem["maxValue"]}\n"""
    if citem["sample"] is not None and len(citem["sample"]) > 0:
      prompt += f"""{indent}{indent}Sample values (format: value1, value2, ...): {", ".join([str(v) for v in citem["sample"]])}\n"""
  else:
    if citem["cardinality"] is not None:
      prompt += f"""{indent}{indent}cardinality: {citem["cardinality"]}"""
      numRows = tLvInfo["numRows"] if tLvInfo is not None else None
      percent = citem["cardinality"] / numRows * 100 if numRows is not None and numRows > 0 else None
      if numRows is not None and numRows == citem["cardinality"]:
        prompt += " (all unique values)"
      elif percent is not None:
        prompt += f""" ({percent:.2f}% of the total rows)"""
      prompt += "\n"
    # if citem["uniqueValues"] is not None and citem["uvCounts"] is not None:
    #   if len(citem["uniqueValues"]) > 0:
    #     uniVals = citem["uniqueValues"][:100] # TODO: truncate the unique values
    #     uniCnts = citem["uvCounts"][:100] # TODO: truncate the unique values
    #     prompt += f"""{indent}{indent}Unique values (format: "value1"(count1), "value2"(count2), ...): """
    #     prompt += ", ".join([f"\"{uv}\"({cnt})" for uv, cnt in zip(uniVals, uniCnts)]) + "\n"
    # elif citem["uniqueValues"] is not None:
    if citem["uniqueValues"] is not None:
      if len(citem["uniqueValues"]) > 0:
        uniVals = citem["uniqueValues"]
        addPrompt = f"""{indent}{indent}Unique values (format: "value1", "value2", ...): {", ".join(['"' + str(uv) + '"' for uv in uniVals])}\n"""
        addPrompt = addPrompt[:1500] # TODO: truncate the prompt
        prompt += addPrompt
  return prompt

@typechecked
def getTableHeaderMDFmt(colNames: List[str]) -> str:
  firstLine = f"""| {" | ".join(colNames)} |"""
  secondLine = f"""| {" | ".join([":---:"] * len(colNames))} |"""
  return firstLine + "\n" + secondLine

@typechecked
def getTableBodyMDFmt(colNames: List[str], rows: List[dtX.DFRowT]) -> str:
  prompt: str = ""
  for row in rows:
    prompt += f"""| {" | ".join([str(row[col]) for col in colNames])} |\n"""
  return prompt

@typechecked
def colNameType2Str(colInfo: List[ColumnInfo]) -> str:
  prompt = f"""Column_Name\tDtype\tNull_count\n"""
  for col in colInfo:
    prompt += f"""{col["colName"]}\t{col["dtype"]}\t{col['nullCount']}\n"""
  return prompt

@typechecked
def colNameTypeNull2Str(colName: str, dtype: str, nullCount: int, indent: str, dfName: Optional[str] = None) -> str:
  prompt = f"- Column {colName}"
  if dfName is not None:
    prompt += f" in DataFrame {dfName}\n"
  else:
    prompt += "\n"
  prompt += f"{indent}dtype: {dtype}\n"
  prompt += f"{indent}null_count: {nullCount}\n"
  return prompt


@typechecked
def numericStats2Str(numerical_stats: NumericalStatsT, indent: str) -> str:
  prompt = f"{indent}25%: {numerical_stats['q25']}\n"
  prompt += f"{indent}50%: {numerical_stats['q50']}\n"
  prompt += f"{indent}75%: {numerical_stats['q75']}\n"
  prompt += f"{indent}count: {numerical_stats['count']}\n"
  prompt += f"{indent}max: {numerical_stats['max']}\n"
  prompt += f"{indent}mean: {numerical_stats['mean']}\n"
  prompt += f"{indent}min: {numerical_stats['min']}\n"
  prompt += f"{indent}std: {numerical_stats['std']}\n"
  prompt += f"{indent}There are {numerical_stats['n_negative']} negative values, {numerical_stats['n_positive']} positive values and {numerical_stats['n_zero']} zero values.\n"
  if numerical_stats["sortedness"] == "ascending":
    prompt += f"{indent}The values are sorted in ascending order.\n"
  elif numerical_stats["sortedness"] == "descending":
    prompt += f"{indent}The values are sorted in descending order.\n"
  else:
    prompt += f"{indent}The values are not sorted.\n"
  return prompt

@typechecked
def cateStats2Str(other_stats: CategoricalStatsT, indent: str) -> str:
  prompt = f"{indent}string max length: {other_stats['maxLength']}\n"
  prompt += f"{indent}string min length: {other_stats['minLength']}\n"
  prompt += f"{indent}string mean length: {other_stats['meanLength']}\n"
  prompt += f"{indent}There are {other_stats['cardinality']} unique values.\n"
  return prompt

@typechecked
def topK2Str(topK: List[TopKItemT], indent: str) -> str:
  prompt = f"{indent}Top-10 frequent data values in this column:\n"
  prompt += f"{indent}\tValue\tCount\n"
  for item in topK:
    prompt += f"""{indent}\t{item["value"]}\t{item["count"]}\n"""
  return prompt

@typechecked
def bin2Str(bin_stats: List[BinInfo], indent: str) -> str:
  prompt = f"{indent}Binned distribution:\n"
  for bin_info in bin_stats:
    leftSign = "[" if bin_info["closed_left"] else "("
    rightSign = "]" if bin_info["closed_right"] else ")"
    prompt += f"""{indent}\t{leftSign}{bin_info["left"]}, {bin_info["right"]}{rightSign}\t{bin_info["count"]}\n"""
  return prompt

@typechecked
def sinTableInfo(dfInfo) -> str:
  dfNames = list(dfInfo.keys())
  if len(dfNames) != 1:
    raise ValueError("[sinTableInfo] not support multiple dataframes")

  dfName = dfNames[0]
  dInfo = dfInfo[dfName]
  num_rows = dInfo["num_rows"]
  num_cols = dInfo["num_cols"]
  prompt = f"""{nameShape2Str(dfName, num_rows, num_cols)}
Statistical information of columns:\n"""
  for colobj in dInfo["columns"]:
    prompt += colNameTypeNull2Str(colobj["colName"], colobj["dtype"], colobj["nullCount"], "\t")
    if colobj["statsType"] == "numeric":
      numerical_stats: NumericalStatsT = colobj["numStats"]
      prompt += numericStats2Str(numerical_stats, "\t")
    elif colobj["statsType"] == "categorical":
      other_stats: CategoricalStatsT = colobj["cateStats"]
      prompt += cateStats2Str(other_stats, "\t")
    else:
      debugger.warning(f"[sinTableInfo] unknown statsType of {colobj['colName']}: {colobj['statsType']}")
  return prompt

@typechecked
def sinColInfo(allDfInfo, dfName: str, colName: str) -> str:
  dInfo = allDfInfo[dfName]
  idx: int = -1
  for i, colobj in enumerate(dInfo["columns"]):
    if colobj["colName"] == colName:
      idx = i
      break
  if idx < 0:
    raise ValueError(f"[sinColInfo] column {colName} not found in dataframe {dfName}")
  
  ci = dInfo["columns"][idx]
  prompt = f"{dataInfoPreamble()}\n"
  # debugger.info(f"[sinColInfo] column {colName}: {ci}")
  prompt += colNameTypeNull2Str(colName, ci['dtype'], ci['nullCount'], '\t', dfName) + "\n"
  if ci["statsType"] == "numeric":
    numerical_stats: NumericalStatsT = ci["numStats"]
    prompt += numericStats2Str(numerical_stats, "\t")
    prompt += bin2Str(ci["bins"], "\t")
  elif ci["statsType"] == "categorical":
    other_stats: CategoricalStatsT = ci["cateStats"]
    topK: List[TopKItemT] = ci["topK"]
    prompt += cateStats2Str(other_stats, "\t")
    prompt += topK2Str(topK, "\t")
  # elif ci["statsType"] == "boolean":

  
  # Add other information here
  prompt += f"""\n{otherDataInfoPreamble()}\n"""
  dfNames = list(allDfInfo.keys())
  for dn in dfNames:
    di = allDfInfo[dn]
    prompt += f"""{nameShape2Str(dn, di["num_rows"], di["num_cols"])}\n"""
    prompt += f"""{colNameType2Str(di["columns"])}\n"""
    prompt += "\n"
  return prompt
