import pandas as pd

DEFAULT_ROW_SAMPLE_SIZE = 15

def selectRowsWithinRange(df: pd.DataFrame, column: str, rangeSelect: list):
  lower_op = None
  upper_op = None
  evalStr = ""
  for i, rs in enumerate(rangeSelect):
    if rs["startOpen"]:
      lower_op = '>'
    else:
      lower_op = '>='
    if rs["endOpen"]:
      upper_op = '<'
    else:
      upper_op = '<='
    if i > 0:
      evalStr += " | "
    evalStr += f'(`{column}` {lower_op} {rs["start"]} & `{column}` {upper_op} {rs["end"]})'
  mask = df.eval(evalStr)
  return df[mask]

def convertBinned(numVC: pd.Series, true_min):
  """
  numVC has interval index from binned value counts. Replace far left low 
  with true min because pandas cuts below min
  """
  d = pd.DataFrame({
    "low": numVC.index.left,
    "high": numVC.index.right,
    "count": numVC.values
  })
  d = d.reset_index().rename(columns={"index": "bucket"})
  d_dict = d.to_dict('records')

  if len(d_dict) > 0:
    d_dict[0]['low'] = true_min
  
  return d_dict

def getQuantBinnedData(colData: pd.Series, n: int = 20):
  vc = colData.value_counts(bins=min(n, colData.nunique()), sort=False)
  return vc

def getTempBinnedData(colData: pd.Series, n: int = 20):
    vc = (colData.astype("int64")//1e9).value_counts(bins=min(n, colData.nunique()), sort=False)
    return vc

"""
export function isTimeColumn(dtype: string) {
  return ["datetime64", "datetime64[ns]"].includes(dtype);
}

export function isNumColumn(dtype: string) {
  const INT_TYPE = ['int', 'int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'Int8', 'Int16', 'Int32', 'Int64', 'UInt8', 'UInt16', 'UInt32', 'UInt64'];
  const FLOAT_TYPE = ['float', 'float_', 'float16', 'float32', 'float64'];
  const NUM_TYPE = [...INT_TYPE, ...FLOAT_TYPE];
  return NUM_TYPE.includes(dtype) || isTimeColumn(dtype);
}
"""

def isTimeColumn(dtype: str):
  return dtype in ['datetime64', 'datetime64[ns]']

def isNumColumn(dtype: str):
  INT_TYPE = ['int', 'int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'Int8', 'Int16', 'Int32', 'Int64', 'UInt8', 'UInt16', 'UInt32', 'UInt64']
  FLOAT_TYPE = ['float', 'float_', 'float16', 'float32', 'float64']
  NUM_TYPE = INT_TYPE + FLOAT_TYPE
  return dtype in NUM_TYPE or isTimeColumn(dtype)