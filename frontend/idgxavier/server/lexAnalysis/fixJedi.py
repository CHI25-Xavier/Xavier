import re
import tokenize
from typing import List, Tuple, Optional
from typeguard import typechecked

from .. import datatypes as dtX


@typechecked
def get_signature_fixjedi(lastline: str, pandasAlias: str) -> List[dtX.SigInfo]:
  sigs: List[dtX.SigInfo] = []
  matchres = closestSignature(lastline)
  if matchres is None:
    return sigs
  if matchres[0] in ["groupby", "join", "sort_values", "drop_duplicates", "drop", "rename", "dropna", "pivot", "pivot_table", "melt"]: # "pop", 
    sigs.append(dtX.SigInfo(name=matchres[0], type="function", module_name="pandas.core.frame", full_name=f"pandas.core.frame.DataFrame.{matchres[0]}"))
  elif matchres[0] in ["contains", "endswith", "startswith", "removeprefix", "removesuffix", "strip", "lstrip", "rstrip", "extract", "extractall", "fullmatch", "find", "rfind", "findall", "slice"]:
    # if there are ".str." before the match
    if lastline[:matchres[1]].endswith("].str."):
      sigs.append(dtX.SigInfo(name=matchres[0], type="function", module_name="pandas.core.strings.accessor", full_name=f"pandas.core.strings.accessor.StringMethods.{matchres[0]}"))
  elif matchres[0] in ["astype", "fillna", "isin"]:
    if lastline[:matchres[1]].endswith("]."):
      sigs.append(dtX.SigInfo(name=matchres[0], type="function", module_name="pandas.core.series", full_name=f"pandas.core.series.Series.{matchres[0]}"))
  elif matchres[0] in ["concat"]:
    if lastline[:matchres[1]].endswith(f"{pandasAlias}."):
      sigs.append(dtX.SigInfo(name=matchres[0], type="function", module_name="pandas.core.reshape", full_name=f"pandas.core.reshape.{matchres[0]}"))
  elif matchres[0] in ["replace"]:
    if lastline[:matchres[1]].endswith("]."):
      sigs.append(dtX.SigInfo(name=matchres[0], type="function", module_name="pandas.core.series", full_name=f"pandas.core.series.Series.{matchres[0]}"))
    elif lastline[:matchres[1]].endswith("].str."):
      sigs.append(dtX.SigInfo(name=matchres[0], type="function", module_name="pandas.core.strings.accessor", full_name=f"pandas.core.strings.accessor.StringMethods.{matchres[0]}"))
  elif matchres[0] in ["merge"]:
    if lastline[:matchres[1]].endswith(f"{pandasAlias}."):
      sigs.append(dtX.SigInfo(name=matchres[0], type="function", module_name="pandas.core.reshape", full_name=f"pandas.core.reshape.{matchres[0]}"))
    elif lastline[:matchres[1]].endswith("."):
      sigs.append(dtX.SigInfo(name=matchres[0], type="function", module_name="pandas.core.frame", full_name=f"pandas.core.frame.DataFrame.{matchres[0]}"))
  return sigs

     

@typechecked
def closestSignature(text_before_cursor: str) -> Optional[Tuple[str, int]]:
  # Regex pattern to match function calls with an open parenthesis but no closing parenthesis
  pattern_open = r'\b(\w+)\s*\([^)]*$'
  
  # Check if the cursor is within an open function call
  if re.search(pattern_open, text_before_cursor):
      # Regex pattern to find all function calls
      pattern_all = r'\b(\w+)\s*\('
      # Find all matches in the text
      matches = [(m.group(1), m.start(1)) for m in re.finditer(pattern_all, text_before_cursor)]
      # Return the last match if any, otherwise return None
      if matches:
          return matches[-1]
  # If no open function call is found, return None
  return None