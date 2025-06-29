import pandas as pd
import json
from typing import List, Optional, Union

from . import utils as utilsXX

def getShape(dfName: pd.DataFrame): 
    print(dfName.shape)

def _getColumns(dfName: pd.DataFrame):
    # type
    typeDF = dfName.dtypes.reset_index().rename(columns={"index": "colName", 0: "dtype"})
    # null count
    nullCountDf = dfName.isnull().sum().reset_index().rename(columns={"index": "colName", 0: "nullCount"})
    # cardinality, min, max
    desDf = dfName.describe(include="all").T.reset_index()
    desDfColumns = desDf.columns.tolist()
    if "unique" not in desDfColumns:
        desDf["unique"] = pd.Series()
    if "min" not in desDfColumns:
        desDf["min"] = pd.Series()
    if "max" not in desDfColumns:
        desDf["max"] = pd.Series()
    desDf = desDf[["index", "unique", "min", "max"]].rename(columns={"index": "colName", "unique": "cardinality", "min": "minValue", "max": "maxValue"})
    # sortedness
    sortDf = dfName.apply(lambda x: "asc" if x.is_monotonic_increasing else "desc" if x.is_monotonic_decreasing else "no").to_frame().reset_index().rename(columns={"index": "colName", 0: "sortedness"})
    res = typeDF.merge(nullCountDf, on="colName").merge(desDf, on="colName").merge(sortDf, on="colName")
    return res

def getColumns(dfName: pd.DataFrame):
    res = _getColumns(dfName)
    print(res.to_json(orient="records", default_handler=str))

def getHeadTail(dfName: pd.DataFrame, n: int = utilsXX.DEFAULT_ROW_SAMPLE_SIZE):
    # res = pd.concat([dfName.head(n), dfName.tail(n)])
    res = dfName.head(n)
    print(res.to_json(orient="records", default_handler=str))

def getCateValueCounts(dfName: pd.DataFrame, colName: str, limit: int = 1000):
    vcnt_ser = dfName[colName].value_counts()
    vcnt_frame = vcnt_ser.to_frame().reset_index().head(limit)
    vcnt_frame = vcnt_frame.rename(columns={colName: "value"})
    print(vcnt_frame.to_json(orient="records", default_handler=str))

def getRowSampleOfOneDf(dfName: pd.DataFrame, condJsonStr: str, n: int = utilsXX.DEFAULT_ROW_SAMPLE_SIZE):
    condDict: dict = json.loads(condJsonStr)
    for col, cond in condDict.items():
        if cond["cateSelect"] is not None:
            dfName = dfName[dfName[col].isin(cond["cateSelect"])]
        elif cond["rangeSelect"] is not None:
            dfName = utilsXX.selectRowsWithinRange(dfName, col, cond["rangeSelect"])
    print(dfName.head(n).to_json(orient="records", default_handler=str))

def getNumColumnSample(dfName: pd.DataFrame, colName: str, n: int = 1000):
    cleanedCol = dfName[colName].dropna()
    res = {
        "sample": cleanedCol.sample(min(len(cleanedCol), n)).to_list()
    }
    print(json.dumps(res, default=str))

def getNumHistogram(dfName: pd.DataFrame, colName: str):
    data = _getNumHistogram(dfName, colName)
    print(json.dumps(data, default=str))

def _getNumHistogram(dfName: pd.DataFrame, colName: str):    
    # If all nulls
    if dfName[colName].isna().sum() == len(dfName[colName]):
        data = {
            "histogram": []
        }
        return data
    
    minV = None
    chartData = None
    # TODO: We treat time series as a special case for numerical data
    if str(dfName[colName].dtype) in ['datetime64', 'datetime64[ns]']:
        minV = (dfName[colName].astype("int64")//1e9).min()
        chartData = utilsXX.getTempBinnedData(dfName[colName])
    else:
        minV = dfName[colName].min()
        chartData = utilsXX.getQuantBinnedData(dfName[colName])
    chartData = utilsXX.convertBinned(chartData, minV)
    data = {
        "histogram": chartData
    }
    return data

def exeFillna(dfName: pd.DataFrame, colName: str, fillValue: Union[str, int, float], n: int = utilsXX.DEFAULT_ROW_SAMPLE_SIZE):
    s = dfName[colName].fillna(fillValue)
    sf = s.to_frame()
    meta = _getColumns(sf)
    data = {
        "newList": s.head(n).to_list(),
        "meta": meta.to_json(orient="records", default_handler=str)
    }
    print(json.dumps(data, default=str))
    
def exeColumnRename(dfName: pd.DataFrame, oldColName: str, newColName: str, n: int = utilsXX.DEFAULT_ROW_SAMPLE_SIZE):
    s = dfName.rename(columns={oldColName: newColName})
    meta = _getColumns(s)
    data = {
        "newList": s[newColName].head(n).to_list(),
        "meta": meta.to_json(orient="records", default_handler=str)
    }
    print(json.dumps(data, default=str))
   

def exeColumnAdd(dfName: pd.DataFrame, colName: str, operator: str, addedColumnsStr: str, n: int = utilsXX.DEFAULT_ROW_SAMPLE_SIZE):    
    
    addedColumns: List[str] = json.loads(addedColumnsStr)

    s = dfName[addedColumns[0]]

    for i in range(1, len(addedColumns)):
        if operator == "+":
            s = s + dfName[addedColumns[i]]
        elif operator == "/":
            s = s / dfName[addedColumns[i]]

    if operator == "+":
        if colName in dfName.columns:
            s + dfName[colName]

    sf = s.to_frame()
    meta = _getColumns(sf)
    data = {
        "newList": s.head(n).to_list(),
        "meta": meta.to_json(orient="records", default_handler=str)
    }
    print(json.dumps(data, default=str))
  
def exeStrReplace(series: List[Optional[str]], old: str, newStr: str):
    # convert to pd series
    seriesPd = pd.Series(series)
    # replace
    seriesPd = seriesPd.str.replace(old, newStr)
    # convert to list
    print(seriesPd.to_json(orient="records", default_handler=str))

def exeStrReplaceMeta(dfName: pd.DataFrame, colName: str, old: str, newStr: str):
    # deep copy dfName
    res = dfName.copy()[[colName]]
    res[colName] = res[colName].str.replace(old, newStr)
    meta = _getColumns(res)
    print(meta.to_json(orient="records", default_handler=str))

def exeTableFilter(df: pd.DataFrame, dfName: str, condStr: str, n: int = utilsXX.DEFAULT_ROW_SAMPLE_SIZE):
    condition = eval(condStr, {dfName: df})
    res = df[condition]
    columns = _getColumns(res)
    columnNameList = res.columns.tolist()
    histograms = {}
    for col in columnNameList:
        if utilsXX.isNumColumn(str(res[col].dtype)):
            histograms[col] = _getNumHistogram(res, col)["histogram"]

    allJson = {
        "rows": res.head(n).to_json(orient="records", default_handler=str),
        "columns": columns.to_json(orient="records", default_handler=str),
        "numRows": res.shape[0],
        "numCols": res.shape[1],
        "columnNameList": columnNameList,
        "histograms": histograms
    }
    print(json.dumps(allJson, default=str))

def exeTableSort(df: pd.DataFrame, sortColumnsStr: str, ascendingStr: str, n: int = utilsXX.DEFAULT_ROW_SAMPLE_SIZE):
    sortColumns: List[str] = json.loads(sortColumnsStr)
    ascending: List[bool] = json.loads(ascendingStr)
    res = df.sort_values(by=sortColumns, ascending=ascending)
    columns = _getColumns(res)
    columnNameList = res.columns.tolist()
    histograms = {}
    for col in columnNameList:
        if utilsXX.isNumColumn(str(res[col].dtype)):
            histograms[col] = _getNumHistogram(res, col)["histogram"]
    
    allJson = {
        "rows": res.head(n).to_json(orient="records", default_handler=str),
        "columns": columns.to_json(orient="records", default_handler=str),
        "numRows": res.shape[0],
        "numCols": res.shape[1],
        "columnNameList": columnNameList,
        "histograms": histograms
    }
    print(json.dumps(allJson, default=str))

def exeGroupby(df: pd.DataFrame, groupbyColumnsStr: str, selectColumnsStr: str, aggFunc: str, n: int = utilsXX.DEFAULT_ROW_SAMPLE_SIZE):
    
    groupbyColumns: List[str] = json.loads(groupbyColumnsStr)
    selectColumns: List[str] = json.loads(selectColumnsStr)
    if(selectColumns == None):
        res = df.groupby(groupbyColumns).agg(aggFunc) 
    else:
        res = df.groupby(groupbyColumns)[selectColumns].agg(aggFunc)

    res = res.reset_index()
    columns = _getColumns(res)
    columnNameList = res.columns.tolist()
    histograms = {}
    for col in columnNameList:
        if utilsXX.isNumColumn(str(res[col].dtype)):
            histograms[col] = _getNumHistogram(res, col)["histogram"]
    
    allJson = {
        "rows": res.head(n).to_json(orient="records", default_handler=str),
        "columns": columns.to_json(orient="records", default_handler=str),
        "numRows": res.shape[0],
        "numCols": res.shape[1],
        "columnNameList": columnNameList,
        "histograms": histograms
    }
    print(json.dumps(allJson, default=str))

def exeTableMerge(leftDf: pd.DataFrame, rightDf: pd.DataFrame, leftCol: Optional[str], rightCol: Optional[str], how: Optional[str], n: int = utilsXX.DEFAULT_ROW_SAMPLE_SIZE):
    res = leftDf
    if how is not None:
        res = pd.merge(leftDf, rightDf, left_on=leftCol, right_on=rightCol, how=how)
    else:
        res = pd.merge(leftDf, rightDf, left_on=leftCol, right_on=rightCol)
    columns = _getColumns(res)
    columnNameList = res.columns.tolist()
    histograms = {}
    for col in columnNameList:
        if utilsXX.isNumColumn(str(res[col].dtype)):
            histograms[col] = _getNumHistogram(res, col)["histogram"]
    allJson = {
        "rows": res.head(n).to_json(orient="records", default_handler=str),
        "columns": columns.to_json(orient="records", default_handler=str),
        "numRows": res.shape[0],
        "numCols": res.shape[1],
        "columnNameList": columnNameList,
        "histograms": histograms
    }
    print(json.dumps(allJson, default=str))
    

# def getAllCateColumnFmt(dfName: pd.DataFrame):
#     res = dfName.select_dtypes(include=["object", "category"])
#     cateColList = list(res.columns)
#     res = []
#     for col in cateColList:
#         res.append({
#             "colName": col,
#             "isalpha": dfName[col].str.isalpha().sum(),
#             "isnumeric": dfName[col].str.isnumeric().sum(),
#             "isalnum": dfName[col].str.isalnum().sum(),
#             "isdigit": dfName[col].str.isdigit().sum(),
#             "isdecimal": dfName[col].str.isdecimal().sum(),
#             "isspace": dfName[col].str.isspace().sum(),
#             "islower": dfName[col].str.islower().sum(),
#             "isupper": dfName[col].str.isupper().sum(),
#             "istitle": dfName[col].str.istitle().sum()
#         })
#     print(pd.DataFrame(res).to_json(orient="records", default_handler=str))