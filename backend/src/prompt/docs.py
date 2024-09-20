import pandas as pd
import inspect
from typing import List, Optional, Callable
from typeguard import typechecked

from src.constant import SptMethodName, PROMPT_MARKER
from src.debugger import debugger

@typechecked
def getDocsByMethodName(method_name: str) -> Optional[str]:
  if method_name == SptMethodName.PD_FUNC_NAME:
    return getPDFuncNameDocs()
  elif method_name == SptMethodName.DF_METHOD_NAME:
    return getDfMethodNameDocs()
  elif method_name == SptMethodName.COL_METHOD_NAME:
    return getColMethodNameDocs()
  elif method_name == SptMethodName.COLUMNS_SELECT:
    return getColumnsSelectDocs()
  elif method_name == SptMethodName.DF_COL:
    return getDfColDocs()
  elif method_name == SptMethodName.GROUPBY_COLSELECT:
    return getGroupbyColselectDocs()
  elif method_name == SptMethodName.GROUPBY_AGGNAME:
    return getGroupbyAggnameDocs()
  elif method_name == SptMethodName.COMMENT:
    return getCommentDocs()
  elif method_name == SptMethodName.CODE_LINE:
    return getCodeLineDocs()
  elif method_name == SptMethodName.PREFIX_DF_NAME:
    return getPrefixDfNameDocs()
  elif method_name == SptMethodName.PREFIX_COL_NAME:
    return getPrefixColNameDocs()
  elif method_name == SptMethodName.ASSIGN_STMT:
    return getAssignStmtDocs()
  elif method_name == SptMethodName.DF_SELECT:
    return getDfSelectDocs()
  elif method_name == SptMethodName.VALUE_FILTER:
    return getValueFilterDocs()
  elif method_name.startswith("pandas.core.strings.accessor.StringMethods") or method_name.startswith("pandas.core.series.Series.") or method_name.startswith("pandas.DataFrame."):
    return getParamDocs()
  elif method_name.startswith("pandas."): # include "pandas.DataFrame.", "pandas.Series.", etc.
    return getFuncInnerDocs(method_name)
  else:
    return None

@typechecked
def getFuncInnerDocs(method_name: str) -> str:
  short_name = method_name.split(".")[-1]
  func: Optional[Callable] = None
  original_docs: Optional[str] = None
  # if method_name.startswith("pandas.DataFrame."):
  #   func = getattr(pd.DataFrame, short_name, None)
  # elif method_name.startswith("pandas.Series."):
  #   func = getattr(pd.Series, short_name, None)
  # elif method_name.startswith("pandas.core.strings.accessor.StringMethods"):
  #   func = getattr(pd.core.strings.accessor.StringMethods, short_name, None)
  if method_name.startswith("pandas."):
    func = getattr(pd, short_name, None)
  # check if the method exists
  if func is None:
    debugger.warning(f"[getFuncInnerDocs] Method {method_name} not found.")
    return ""
  # get the original docs
  original_docs = func.__doc__
  if original_docs is None:
    debugger.warning(f"[getFuncInnerDocs] Method {method_name} has no docs.")
    return ""
  # Only keep part of the original docs before "See Also"
  res_docs = original_docs.split("See Also")
  if len(res_docs) == 1:
    res_docs = original_docs.split("Notes")
  if len(res_docs) == 1:
    debugger.warning(f"[getFuncInnerDocs] Method {method_name} has no 'See Also' section.")

  return f"""`{method_name}{str(inspect.signature(func))}`\n{res_docs[0]}"""

@typechecked
def getColumnsSelectDocs() -> str:
  return """In pandas, you can select a subset of columns from a dataframe using the `[[]]` operator. For example, if you have a dataframe `df` and you want to select the columns `col1` and `col2`, you can write: `df[['col1', 'col2']]`."""

@typechecked
def getDfColDocs() -> str:
  # In pandas, you can perform binary operations on a column or two columns. Now the left-hand-side (LHS) operand is known, you need to consider the operator (OP) and the right-hand-side (RHS) operand. Some "OP + RHS" combination are used to derive a new column like `+ <RHS>`, `- <RHS>`, `* <RHS>`, `/ <RHS>`, while others like `> <RHS>`, `< <RHS>`, `== <RHS>`, `!= <RHS>` are used to compare something and get a boolean mask for following filters. Here, `<RHS>` can be a scalar or another column (in the same dataframe or a different one). To use the appropriate operator, you need to pay attention to knowledge hidden behind data values, meaning of the column names and the semantics of the operation. Sometimes you may also need to notice the the name of the variable before "=" in the last line of the incomplete code, because the meaning of variable name may be a useful clue to guess the appropriate operators.

  return f"""In pandas, you can infer the column users want to use by the combination of the dataframe name and the column name such as df["col"]. You need to identify the dataframe and the column being selected just before the {PROMPT_MARKER.CURSOR} and the data context mentioned below to complete the rest of the line of code."""

@typechecked
def getPDFuncCategories() -> List[str]:
  return [
    """Data manipulations. E.g. `pd.melt()`, `pd.pivot_table()`, `pd.crosstab()`, `pd.cut()`, `pd.merge()`, `pd.concat()`, `pd.wide_to_long()`. These functions are used to reshape data. You can select some of them to recommend to users according to the data context mentioned below and your data transformation experience."""
  ]

@typechecked
def getDfMethodCategories() -> List[str]:
  return [
    """Attributes and underlying data. E.g. `df.shape`, `df.columns`, `df.index`, `df.dtypes`. This category allows users to check some basic information so as to have an oveview of the data. You need to think about and guess whether or not users want to check such information.""",
    """"Conversion. E.g. `df.astype()`, `df.convert_dtypes()`, `df.infer_objects()`. This category allows users to convert the data type of the whole dataframe or some columns. If you find some columns have a vague data type such as "object", or you want find a mismatch between the data type and data values you see, you may use this category.""",
    """Indexing, iteration. E.g. `df.loc[]`, `df.iloc[]`, `df.where()`, `df.insert()`, `df.head()`. This category is used to access a certain part of the dataframe. But some methods like `df.head()` is more likely to be used to show the first few rows of the dataframe and you need to infer the user's need.""",
    """Binary operator functions. E.g. `df.add()`, `df.sub()`, `df.div()`, `df.combine()`. This category is used to perform some binary operations on two dataframes or a dataframe and a scalar. To use this category, you need to pay attention to knowledge hidden behind data values, meaning of column names and the semantics of the operation.""",
    """Function application, GroupBy & window. E.g. `df.apply()`, `df.agg()`, `df.groupby()`, `df.rolling()`. This category is used to apply a function to the whole dataframe or a part of the dataframe. Like binary operator functions, you need to pay attention to knowledge hidden behind data values, meaning of column names and the semantics of the operation.""",
    """Computations / descriptive stats. E.g. `df.mean()`, `df.median()`, `df.corr()`, `df.cov()`. This category is used to compute some statistics of the data. To use this category, you need to notice the data type of the columns and the semantics of the operation.""",
    """Reindexing / selection / label manipulation. E.g. `df.reset_index()`, `df.rename()`, `df.drop()`, `df.drop_duplicates()`, `df.filter()`. This category is used to manipulate the index or columns of the dataframe. For instance, `df.reset_index()` is usually used after some operations which disorders the index. You can also use this category to select a subset of the data based on some conditions. Some methods like `df.drop_duplicates()` is more likely related to data cleaning.""",
    """Missing data handling. E.g. `df.dropna()`, `df.fillna()`, `df.interpolate()`, `df.ffill()`, `df.isna()`. Most of the methods are about cleaning missing data, while there are also some methods like `df.isna()` will return a boolean mask indicating missing values to provide convenience for following transformation like selection or aggregation.""",
    """Reshaping, sorting, transposing. E.g. `df.pivot_table()`, `df.unstack()`, `df.sort_values()`, `df.melt()`, `df.transpose()`. This category is used to rearrange the structure of the dataframe, usually with the purpose of a more human-readable view or a format that is more suitable for following APIs. If you find there are several columns which can be generated a human-readable view or there are several similar columns that can be arranged in another format, you may consider this category.""",
    """Combining / comparing / joining / merging. E.g. `df.merge()`, `df.join()`, `df.compare()`. This category is suitable for more than one dataframe. Usually dataframes to be combined / compared / joined / merged have the same or similar structure.""",
    """Time Series-related. E.g. `df.shift()`, `df.resample()`, `df.to_timestamp()`, `df.tz_convert()`. This category is used to handle time series data. So if you find there are some time series in dataframes and you think it is necessary to handle them, you can use this category."""
  ]

@typechecked
def getColMethodCategories() -> List[str]:
  return [
    # """Attributes. E.g. `Series.dtype`, `Series.size`, `Series.hasnans`, `Series.array`, `Series.T`. This category allows users to check some basic information so as to have an overview of the column data. You need to think about and guess whether or not users want to check such information.""",
    """Conversion. E.g. `Series.astype()`, `Series.convert_dtypes()`, `Series.infer_objects()`, `Series.to_timestamp()`. This category allows users to convert the data type of the column or transform it to other data structures in Python. If you find the column have a vague data type such as "object", or you notice a mismatch between the data type and data values you see, or you find the user frequently transforms the column to a different data structure, you may use this category.""",
    """Indexing, iteration. E.g. `Series.loc[]`, `Series.iloc[]`. This category is used to access a certain part of the column.""",
    """Function application, GroupBy & window. E.g. `Series.apply()`, `Series.agg()`, `Series.groupby()`, `Series.rolling()`. This category is used to apply a function to the whole column. Like binary operator functions, you need to pay attention to knowledge hidden behind data values, meaning of the column name and the semantics of the operation.""",
    """Computations / descriptive stats. E.g. `Series.mean()`, `Series.quantile()`, `Series.unique()`, `Series.value_counts()`, `Series.describe()`. This category is used to compute some statistics of the column. To use this category, you need to notice the data type of the column and the semantics of the operation.""",
    """Reindexing / selection / label manipulation. E.g. `Series.drop_duplicates()`, `Series.filter()`, `Series.duplicated()`, `Series.isin()`. This category is used to manipulate the index or select a subset of the data in the column. Some methods like `Series.drop_duplicates()` is more likely related to data cleaning.""",
    """Missing data handling. E.g. `Series.dropna()`, `Series.fillna()`, `Series.notnull()`, `Series.isna()`. Most of the methods are about cleaning missing data, while there are also some methods like `Series.isna()` will return a boolean mask indicating missing values to provide convenience for following transformation like selection or aggregation.""",
    """Reshaping, sorting. E.g. `Series.sort_values()`. This category is used to rearrange the structure of the column, usually with the purpose of a more human-readable view or a format that is more suitable for following APIs.""",
    # """Combining / comparing / merging. E.g. `Series.compare()`. This category is suitable for more than one column. Usually columns to be combined / compared / merged have the same or similar structure or semantics.""",
    """Time Series-related. E.g. `Series.shift()`, `Series.resample()`, `Series.tz_convert()`. This category is used to handle time series data. So if you find this column is like a time series and you think it is necessary to handle it, you can use this category.""",
    """String selection. E.g. `Series.str.endswith()`, `Series.str.contains()`. This category is used to select a subset of the string data in the column and will return a boolean mask indicating the selected values. If you find currently users are filtering data using `[]` signs, you can use this category.""",
    """String transformation. E.g. `Series.str.lower()`, `Series.str.replace()`, `Series.str.split()`. This category is used to transform the string data to a specific format in the column. If you find the column contains string data and you want to perform some string transformation, you can use this category."""
  ]

@typechecked
def getPDFuncNameDocs() -> str:
  docs = f"""In pandas, you can use general functions to manipulate dataframes. According to API docs of Pandas, there are several "Categories of general functions" which are widely used:"""
  categories = getPDFuncCategories()
  for i, cat in enumerate(categories):
    docs += f"\n{i+1}. {cat}"
  return docs

@typechecked
def getDfMethodNameDocs() -> str:
  docs = f"""In pandas, you can know about or transform a dataframe through a lot of APIs. According to API docs of Pandas, there are several "categories of DataFrame attributes and methods" which are widely used:"""
  categories = getDfMethodCategories()
  for i, cat in enumerate(categories):
    docs += f"\n{i+1}. {cat}"
  return docs

@typechecked
def getColMethodNameDocs() -> str:
  docs = f"""In pandas, you can know about or transform a column of a dataframe through a lot of APIs. According to API docs of Pandas, there are several "categories of Series attributes and methods" which are widely used:"""
  categories = getColMethodCategories()
  for i, cat in enumerate(categories):
    docs += f"\n{i+1}. {cat}"
  return docs

@typechecked
def getGroupbyColselectDocs() -> str:
  return """In pandas, after you use .groupby() method, you can select a subset of columns from the resulting groups like df.groupby('col1')[['col2', 'col3']]. This will return a new dataframe with only the selected columns and the 'col1' index. The columns you select will be aggregated later so please select only the columns you think need to be aggregated (usually the numeric ones)."""

@typechecked
def getGroupbyAggnameDocs() -> str:
  return """In pandas, after you use .groupby() method on a dataframe (and probably select some columns), you can apply some aggregation functions to the groups. Currently we support the following aggregation functions: (1) for numeric columns: `sum()`, `.mean()`, `.min()`, `.max()`, `.median()`, `.std()`; (2) for categorical columns: `.count()`. You need to identify datatypes of the selected columns and the semantics of the operation to choose the appropriate aggregation function."""

@typechecked
def getCommentDocs() -> str:
  return f"""In Python, you can use the '#' character to add comments to your code to specify your data transformation intents using natural language or other kinds of programming langauges. You need to identify partial comments just before the {PROMPT_MARKER.CURSOR} and the data context mentioned below to infer the user's intent."""

@typechecked
def getCodeLineDocs() -> str:
  return f"""In Python, you can write a line of code according to the comments from the previous line. You need to identify the comments just before the {PROMPT_MARKER.CURSOR} and the data context mentioned below to infer the user's intent."""

@typechecked
def getPrefixDfNameDocs() -> str:
  f"""In Python, you can infer the dataframe users want to use by the prefix of the dataframe name. You need to identify the prefix just before the {PROMPT_MARKER.CURSOR} and the data context mentioned below to complete the rest of the line of code."""
  return ""

@typechecked
def getPrefixColNameDocs() -> str:
  f"""In Python, you can infer the column users want to use by the prefix of the column name. You need to identify the prefix just before the {PROMPT_MARKER.CURSOR} (if exists) and the data context mentioned below to complete the rest of the line of code."""
  # TODO: currently we do not add any prompt for this case
  return ""

@typechecked
def getAssignStmtDocs() -> str:
  return f"""In Python, you can assign an expression to a DataFrame variable or a Series variable using the '=' operator. You need to identify the table (and possibly columns) just before the "=" and the data context mentioned below to complete the rest of the line of code."""

@typechecked
def getDfSelectDocs() -> str:
  return f"""In pandas, you can select a subset of data from a dataframe using the '[]' operator. You can fill column name (e.g. 'col'), column names (e.g. ['col1', 'col2']), condition (e.g. df['col'].isnull()), conditions (e.g. df['col'] > v1 & df['col'] < v2) in the '[]' to select the data you want. You need to identify the dataframe being selected just before the {PROMPT_MARKER.CURSOR} and the data context mentioned below to complete the rest of the line of code."""

@typechecked
def getValueFilterDocs() -> str:
  return f"""In pandas, you can filter a dataframe using a condition. You need to identify the table name and the column name just before the {PROMPT_MARKER.CURSOR} and the data context mentioned below to complete the rest of the line of code."""

@typechecked
def getParamDocs() -> str:
  return f"""In Python, you can fill the parameters of a function call according to the function signature. You need to identify the function name just before the {PROMPT_MARKER.CURSOR} and the data context mentioned below to complete the rest of the line of code."""