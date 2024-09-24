from typing import List, Tuple, Dict, Set, Union, Optional, Literal, TypedDict, Any

class TokenInfo(TypedDict):
    type: int
    exact_type: int
    string: str

# Note:
# 1. `df_name` is only available when the cursor is next to a dataframe name. e.g. `df.`
# 2. `method_name` also includes things like "column selection"    

class PartialCodeInfo(TypedDict):
    method_name: Optional[str]
    need_obj: int
    df_info_type: str
    df_name: Optional[str]
    df_name_list: Optional[List[str]]
    col_name: Optional[str]
    col_name_list: Optional[List[str]]
    col_name_quote: Optional[str]
    op_name: Optional[str]
    cell_value: Optional[str]
    col_idx_list: Optional[str]
    special_case: int
    is_trivial: bool

class CompletionItem(TypedDict):
    value: str
    offset: int
    type: str
    explanation: Optional[str]

# Middle layer
class _dfInfo_listDf(TypedDict):
    shape: str
    columns: str

# Suitable for list of dataframes
dfInfo_listDf = Dict[str, _dfInfo_listDf]

# Middle layer
# Cannot written as TypedDict because of "25%", "50%", "75%" is not a valid variable name


SortType = Literal['ascending', 'descending', 'noSort']

class NumericalStatsT(TypedDict):
    min: Union[float, int]
    q25: Union[float, int]
    q50: Union[float, int]
    q75: Union[float, int]
    max: Union[float, int]
    mean: Union[float, int]
    count: int
    std: Union[float, int]
    sd_outlier: int
    iqr_outlier: int
    sortedness: SortType
    n_zero: int
    n_positive: int
    n_negative: int

class BinInfo(TypedDict):
    left: Union[int, float]
    right: Union[int, float]
    closed_left: bool
    closed_right: bool
    count: int

class CategoricalStatsT(TypedDict):
    minLength: int
    maxLength: int
    meanLength: Union[float, int]
    cardinality: int

class TemporalStatsT(TypedDict):
    num_outliers: int
    sortedness: SortType

class TopKItemT(TypedDict):
    value: str
    count: int

class TempIntervalT(TypedDict):
    months: int
    days: int
    micros: int

class TempHistItemT(TypedDict):
    bucket: int
    low: Union[int, float]
    high: Union[int, float]
    count: int

# Middle layer
class ColumnInfo(TypedDict):
    colName: str
    dtype: str
    nullCount: int
    statsType: Literal["numeric", "categorical", "temporal", "boolean", "other"]
    # Pitfall: Union[None, T] != Optional[T], especially when T is a TypedDict
    numStats: Union[None, NumericalStatsT]
    cateStats: Union[None, CategoricalStatsT]
    timeStats: Union[None, TemporalStatsT]
    bins: Optional[List[BinInfo]]
    topK: Optional[List[TopKItemT]]
    tempHist: Optional[List[TempHistItemT]]
    tempInterval: Union[None, TempIntervalT]

class JupyterlabToken(TypedDict):
    value: str
    offset: int
    type: Optional[str]

class MultiLevelPrefix(TypedDict):
    start_symbol: str
    delimiter: str
    index_range: List[int]

class SpecialTokenMapping(TypedDict):
    key: str
    value: Union[str, List[str]]

class SigInfo(TypedDict):
    module_name: str
    name: str
    full_name: str
    type: str

class ColumnStyle(TypedDict):
    colName: str
    isFold: bool
    isHidden: bool

class _DataFrameStyle(TypedDict):
    isFold: bool
    isHidden: bool
    columns: List[ColumnStyle]

AllDataFrameStyleT = Dict[str, _DataFrameStyle]

class ValueShowT(TypedDict):
    dfName: str
    colName: str
    cellValue: str

class DocumentationT(TypedDict):
    type: Literal["explanation", "highlight"]
    explanation: Optional[str]
    highlight: Union[None, AllDataFrameStyleT]
    value_show: Union[None, ValueShowT]

class _TableLevelInfoT(TypedDict):
    columnNameList: List[str]
    numRows: Optional[int]
    numCols: Optional[int]

TSortedness = Literal["asc", "desc", "no"]

class _ColLevelInfoT(TypedDict):
    # Common
    dtype: Optional[str]
    nullCount: Optional[int]
    sortedness: Optional[TSortedness]
    # For categorical columns
    cardinality: Optional[int] # Number of unique values
    uniqueValues: Optional[List[Union[str, int, float]]]; # At most 1000 unique values
    uvCounts: Optional[List[int]]; # If not null, must have the same length as uniqueValues
    # For numerical columns
    minValue: Union[None, int, float, str]
    maxValue: Union[None, int, float, str]
    sample: Optional[List[Union[int, float, str]]]

DFRowT = Dict[str, Union[int, float, bool, str, None]]

class _RowLevelInfoT(TypedDict):
    columnNameList: List[str]
    sampleRows: Optional[List[DFRowT]]

TableLevelInfoT = Dict[str, _TableLevelInfoT]
RowLevelInfoT = Dict[str, _RowLevelInfoT]
ColLevelInfoT = Dict[str, Dict[str, _ColLevelInfoT]]