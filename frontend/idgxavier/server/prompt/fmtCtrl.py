from typeguard import typechecked
from ..constant import PROMPT_MARKER

@typechecked
def fmtCtrl_basedOnWhat(provideExample: bool = True) -> str:
  example = "(E.g. schema of the table, shape of the DataFrame, data type of the columns, distribution of each column, data quality issues, special data values in the column, etc.)"
  return f"""So, based on the {PROMPT_MARKER.CODE_CONTEXT} and {PROMPT_MARKER.DATA_CONTEXT}{" " + example if provideExample else ""} provided above"""

@typechecked
def fmtCtrl_forExample() -> str:
  return f"""For example, if the user is selecting a subset of the dataframe or columns using symbols like `[`, you may need to recommend methods that returns a boolean mask in order to filter the data. Meanwhile, such a filtering may originate from some characteristics of the data, such as statistical distribution or quality issues."""

@typechecked
def fmtCtrl_noExplanation(noNeedWholeLine: bool = True) -> str:
  noNeedWholeLineStr = "(it is not necessary to complete the whole line of code)"
  return f"""without explanation{f" {noNeedWholeLineStr}" if noNeedWholeLine else ""}"""

@typechecked
def fmtCtrl_additionalNotes(wrapWhat: str, multipleItems: bool = True, forbiddenFuncStr: str = "") -> str:
  optionalStr = "You don't need to put too many items in an option and don't make an option too long. "
  resStr = f"""You can list more than one option (5 options at most) if you think there are many possibilities, and order them, putting the most possible one to the top.{" " + forbiddenFuncStr if forbiddenFuncStr != "" else ""} You don't need to use backtick to wrap the {wrapWhat}."""
  if multipleItems:
    resStr = optionalStr + resStr
  return resStr

@typechecked
def fmtCtrl_specialCase() -> str:
  return f"""{fmtCtrl_basedOnWhat()}, please provide the autocompletion prompt for the user, which consists of the expression and explanation of your choice (No need to make the explanation too long and it would be better if the explanation is related to the data context. For instance you can mention the name of the dataframe variable or the name of the column). {fmtCtrl_noExplanation()}. The output format is like:
1. expression1 | explanation1
2. expression2 | explanation2
...
{fmtCtrl_additionalNotes("expression")}"""

@typechecked
def fmtCtrl_dfVar(completeWhat: str) -> str:
  return f"""{fmtCtrl_basedOnWhat()}, please: (1) select a subset of the dataframes appearing in this code script. (2) order these dataframes based on some criteria like similar schema, similar semantics or other common features with the dataframe nearby the lastline of code, (3) provide the autocompletion prompt for the user, {fmtCtrl_noExplanation()}. The output format is like:
1. df1
2. df2
...
{fmtCtrl_additionalNotes(completeWhat, False)}"""

@typechecked
def fmtCtrl_listOfDf(completeWhat: str) -> str:
  return f"""{fmtCtrl_basedOnWhat()}, please: (1) select a subset of the dataframes appearing in this code script, (2) provide the autocompletion prompt for the user, {fmtCtrl_noExplanation()}. The output format is like:
1. [df1_1, df1_2, ...]
2. [df2_1, df2_2, ...]
...
{fmtCtrl_additionalNotes(completeWhat)}"""

@typechecked
def fmtCtrl_selectColumnNames(completeWhat: str) -> str:
  return f"""{fmtCtrl_basedOnWhat()}, please: (1) think about the intents of the data worker from the previous code (That is because data workers usually choose columns from a large table for a more concise view and better analysis between several columns). (2) choose some combinations of several column names appearing in this dataframe, (3) provide the autocompletion prompt for the user (don't select too much columns. Sometimes one column is also OK), {fmtCtrl_noExplanation()}. The output format is like:
1. "column1_1", "column1_2", ...
2. "column2_1", ...
...
{fmtCtrl_additionalNotes(completeWhat)}"""

@typechecked
def fmtCtrl_optionalParams(method_name: str, completeWhat: str) -> str:
  return f"""{fmtCtrl_basedOnWhat()}, please: (1) select a subset of the optional parameters available and not specified yet in the current signature `{method_name}`, (2) provide approriate value for each parameter you select, (3) output the corresponding autocompletion prompts, {fmtCtrl_noExplanation()}. The output format is like:
1. parameter1_1=value1_1, parameter1_2=value1_2, ...
2. parameter2_1=value2_1, ...
...
{fmtCtrl_additionalNotes(completeWhat)}"""

@typechecked
def fmtCtrl_methodRecommendation(completeWhat: str) -> str:
  """
  Previously, the prompt is:
{fmtCtrl_basedOnWhat()}, please: (1) select a subset of the methods available in these categories listed above (you need to carefully read the explanation of each category), (2) order theses methods based on the correlation among the description of the corresponding category, the current code and data context ({fmtCtrl_forExample()}), (3) provide the autocompletion prompt for the user, which consists of the method name and explanation of your choice (No need to make the explanation too long and it would be better if the explanation is related to the data context. For instance you can mention the name of the dataframe variable or the name of the column). The output format is like:
1. method_name_1 | explanation_1
2. method_name_2 | explanation_2
...
{fmtCtrl_additionalNotes(completeWhat, False)}
"""

  return f"""{fmtCtrl_basedOnWhat()}, please: (1) select a subset of the methods available in these categories listed above (you need to carefully read the explanation of each category), (2) order theses methods based on the correlation among the description of the corresponding category, the current code and data context ({fmtCtrl_forExample()}), (3) provide the autocompletion prompt for the user, {fmtCtrl_noExplanation()}. The output format is like:
1. method_name_1
2. method_name_2
...
{fmtCtrl_additionalNotes(completeWhat, False)}"""

@typechecked
def fmtCtrl_colVar(completeWhat: str) -> str:
  return f"""{fmtCtrl_basedOnWhat()}, please: (1) select a subset of the column names appearing in this dataframe or other dataframes. Note that you may first consider the columns with the more detailed information, and then move to the less detailed ones if such a column is not appropriate, (2) provide the autocompletion prompt for the user, {fmtCtrl_noExplanation()}. The output format is like:
1. df1["column1_1"]
2. df1["column1_2"]
3. df2["column2_1"]
...
{fmtCtrl_additionalNotes(completeWhat, False)}"""

@typechecked
def fmtCtrl_params(completeWhat: str) -> str:
  return f"""{fmtCtrl_basedOnWhat()}, please: (1) think of the possible combinations of these mandatory parameters, (2) provide the autocompletion prompt for the user, {fmtCtrl_noExplanation()}. The output format is like:
1. parameter1_1=value1_1, parameter1_2=value1_2, ...
2. parameter2_1=value2_1, ...
...
{fmtCtrl_additionalNotes(completeWhat)}"""

@typechecked
def fmtCtrl_binopRHS(completeWhat: str) -> str:
  return f"""{fmtCtrl_basedOnWhat()}, please: (1) Carefully read the documentation mentioned above, (2) provide the autocompletion prompt for the user, {fmtCtrl_noExplanation()}. The output format is like:
1. <OP1> <RHS1>
2. <OP2> <RHS2>
...
Where OP can be "+", "-", "*", "/", ">", "<", ">=", "<=", "==", "!=", and the RHS can be a scalar, a pandas Series. {fmtCtrl_additionalNotes(completeWhat, False)}"""

@typechecked
def fmtCtrl_colIdx(completeWhat: str) -> str:
  return f"""{fmtCtrl_basedOnWhat()}, please: (1) select a column name based on the context near the last line of code (i.e. you need to make sure that the column can be accessed in the current dataframe), (2) order these column names you select based on several criteria (for example, if the column has been mentioned above, it is likely to be accessed in the following code), (3) provide the autocompletion prompt for the user, {fmtCtrl_noExplanation()}. The output format is like:
1. "column_name_1"
2. "column_name_2"
...
{fmtCtrl_additionalNotes(completeWhat, False)}"""

@typechecked
def fmtCtrl_aggMethod(completeWhat: str) -> str:
  return f"""{fmtCtrl_basedOnWhat()}, please: (1) select a subset of the aggregation methods available in documentation, (2) order these methods based on several criteria (for example, Sometimes you may also need to notice the the name of the variable before "=" in the last line of the incomplete code, because the meaning of variable name may be a useful clue to guess the appropriate aggregation method name) (3) provide the autocompletion prompt for the user, {fmtCtrl_noExplanation()}. The output format is like:
1. method_name1()
2. method_name2()
...
{fmtCtrl_additionalNotes(completeWhat, False)}"""

@typechecked
def fmtCtrl_comment(completeWhat: str) -> str:
  return f"""{fmtCtrl_basedOnWhat()}, please: (1) think of the possible comments that can be added to the code, (2) order these comments based on the correlation between the comments and "{PROMPT_MARKER.CODE_CONTEXT} and {PROMPT_MARKER.DATA_CONTEXT}", (3) provide the autocompletion prompt for the user, {fmtCtrl_noExplanation()}. The output format is like:
1. <comment 1>
2. <comment 2>
...
{fmtCtrl_additionalNotes(completeWhat)}"""

@typechecked
def forbiddenFunc() -> str:
  return f"""Please note that you should not provide the following autocompletion prompts: .head(), .info(), .describe(), .shape, .plot(), .value_counts(), .unique(), nunique(), .nlargest()."""

@typechecked
def fmtCtrl_codeLine(completeWhat: str) -> str:
  return f"""{fmtCtrl_basedOnWhat(False)}, please: (1) think of the possible codes (e.g. data transformation operations applied to the datasets) the user wants to write; (2) rank these codes based on the correlation between the code and "{PROMPT_MARKER.CODE_CONTEXT} and {PROMPT_MARKER.DATA_CONTEXT}"; (3) provide the autocompletion prompt and add to {PROMPT_MARKER.CURSOR} of the code, {fmtCtrl_noExplanation(False)}. The output format is like:
1. <rest part of code line 1>
2. <rest part of code line 2>
...
{fmtCtrl_additionalNotes(completeWhat, False, forbiddenFunc())}"""

@typechecked
def fmtCtrl_condition(completeWhat: str) -> str:
  return f"""{fmtCtrl_basedOnWhat(False)}, please: (1) think of the possible operators and operands that can be applied to filter the data, (2) rank these operators and operands based on the correlation between the condition and "{PROMPT_MARKER.CODE_CONTEXT} and {PROMPT_MARKER.DATA_CONTEXT}", (3) provide the autocompletion prompt and add to {PROMPT_MARKER.CURSOR} of the code, {fmtCtrl_noExplanation(False)}. The output format is like:
1. <the rest part of condition 1>
2. <the rest part of condition 2>
...
{fmtCtrl_additionalNotes(completeWhat, False)}""" 

@typechecked
def fmtCtrl_Param() -> str:
  return f"""{fmtCtrl_basedOnWhat(False)}, please: (1) think of the usage of the function and the possible parameters that can be passed to the function, (2) think of the possible parameters values and rank these parameters based on the correlation between the parameter and "{PROMPT_MARKER.CODE_CONTEXT} and {PROMPT_MARKER.DATA_CONTEXT}", (3) provide the autocompletion prompt and add to {PROMPT_MARKER.CURSOR} of the code, {fmtCtrl_noExplanation(False)}. The output format is like:
1. <code line 1>
2. <code line 2>
...
{fmtCtrl_additionalNotes("code line", False)}"""