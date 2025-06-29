from typeguard import typechecked
from typing import Union, List, Optional

from .. import datatypes as dtX
from ..constant import PROMPT_MARKER
from .. import utils as utilsX

@typechecked
def dataInfoPreamble() -> str:
  return f"""Here is {PROMPT_MARKER.DATA_CONTEXT} in this code script:"""

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
def colLevelInfoPrompt(indent: str, colName: str, citem: dtX._ColLevelInfoT, tLvInfo: Union[None, dtX._TableLevelInfoT]) -> str:
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
