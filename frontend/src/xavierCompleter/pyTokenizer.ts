import { PyToken } from "../interfaces";
import { IColumnComputeParam, IColumnRenameParam, IColumnSelectParam, IFillnaParam, IGroupbyParam, IStrReplaceParam, ITableConcatParam, ITableFilterParam, ITableMergeParam, ITableSortParam } from "../sidePanel/interface";
import * as utils from "../utils";

export function tokenizePythonScript(script: string): PyToken[] {
  const tokens: PyToken[] = [];
  const keywords = new Set([
    'def', 'return', 'if', 'else', 'elif', 'while', 'for', 'in', 'break', 'continue',
    'pass', 'import', 'from', 'as', 'class', 'try', 'except', 'finally', 'with', 'assert',
    'yield', 'lambda', 'print', 'True', 'False', 'None'
  ]);

  const tokenPatterns: [RegExp, string][] = [
    [/\s+/, 'WHITESPACE'],
    [/[a-zA-Z_]\w*/, 'IDENTIFIER'],
    [/\d+(\.\d+)?/, 'NUMBER'],
    [/#[^\n]*/, 'COMMENT'],
    [/[+\-*/%=<>!]=?/, 'OPERATOR'],
    [/[{}()\[\],.:;]/, 'PUNCTUATION'],
    [/["'][^"']*["']/, 'STRING']
  ];

  let i = 0;

  while (i < script.length) {
    let matched = false;

    for (const [pattern, type] of tokenPatterns) {
      const regex = new RegExp(`^${pattern.source}`);
      const match = script.slice(i).match(regex);

      if (match) {
        matched = true;
        const value = match[0];

        if (type !== 'WHITESPACE' && type !== 'COMMENT') {
          tokens.push({
            type: keywords.has(value) ? 'KEYWORD' : type,
            value
          });
        }

        i += value.length;
        break;
      }
    }

    if (!matched) {
      console.error(`Unexpected token at index ${i}: ${script[i]}`);
      i++;
    }
  }

  return tokens;
}

export function concatTokens(tokens: PyToken[]): string {
  return tokens.map(token => token.value).join('');
}

export function findAllTableColumn(code: string, tablesColumns: {[key: string]: string[]}) {
  const tokens = tokenizePythonScript(code);
  const res: {[key: string]: string[]} = {};
  // Find all tables first
  tokens.forEach((t) => {
    if (t.type === "IDENTIFIER" && t.value in tablesColumns) {
      res[t.value] = [];
    }
  });
  // Find all columns
  const resKeys = Object.keys(res);
  const colPos: {[colName: string]: {tokPos: number[], belongTable: string[]}} = {};
  tokens.forEach((t: PyToken, i: number) => {
    if (t.type === "STRING") {
      const colName = utils.removeQuotes(t.value); //Remove quotes
      for (const table of resKeys) {
        if (tablesColumns[table].includes(colName)) {
          if (colName in colPos) {
            colPos[colName].tokPos.push(i);
            colPos[colName].belongTable.push(table);
          } else {
            colPos[colName] = {tokPos: [i], belongTable: [table]};
          }
        }
      }
    }
  });
  // @TODO: may add rules to remove same column name in different tables

  // Construct result
  for (const colName in colPos) {
    const tableNames = colPos[colName].belongTable;
    for (const tableName of tableNames) {
      res[tableName].push(colName);
    }
  }
  // remove duplicated columns
  for (const tableName in res) {
    res[tableName] = Array.from(new Set(res[tableName]));
  }
  return res;
}

export function findColumnFillnaTemp(code: string, tablesColumns: {[key: string]: string[]}): IFillnaParam | null {
  // Example: df['A'] = df['A'].fillna("Unknown")
  // Example: df['A'] = df['A'].fillna(0)
  const regex = /(\w+)\[['"]([^'"]+)['"]\]\s*=\s*(\w+)\[['"]([^'"]+)['"]\]\.fillna\(\s*(["'][^'"]*["']|\d+)/;
  const match = code.match(regex);

  if (!(match && match.length === 6)) {
    return null;
  }
  const [_, newTableName, newColumnName, tableName, columnName, fillValue] = match;
  if (newTableName !== tableName || !(tableName in tablesColumns && tablesColumns[tableName].includes(columnName))) {
    return null;
  }
  return {
    table: tableName,
    column: columnName, // no quote
    fillValue: fillValue, // has quote if string, no quote if number
    newColumn: newColumnName // no quote
  };
}

export function findColumnStrReplaceTemp(code: string, tablesColumns: {[key: string]: string[]}): IStrReplaceParam | null {
  // Example: df1['B'] = df1['A'].str.replace('a', 'b'

  const regex = /(\w+)\[['"]([^'"]+)['"]\]\s*=\s*(\w+)\[['"]([^'"]+)['"]\]\.str\.replace\(\s*r?(['"])([^'"]+)\5,\s*r?(['"])([^'"]*)\7/;
  const match = code.match(regex);

  if (!(match && match.length === 9)) {
    return null;
  }
  const [_, newTableName, newColumnName, tableName, columnName, searchQuote, searchValue, replaceQuote, replaceValue] = match;
  if (newTableName !== tableName || !(tableName in tablesColumns && tablesColumns[tableName].includes(columnName))) {
    return null;
  }
  return {
    table: tableName,
    column: columnName, // no quote
    newColumn: newColumnName, // no quote
    oldPattern: searchQuote + searchValue + searchQuote, // has quote
    newValue: replaceQuote + replaceValue + replaceQuote // has quote
  };
};

export function findColumnSelectTemp(code: string, tablesColumns: {[key: string]: string[]}): IColumnSelectParam | null {
  // Example: df = df[['A', 'B', 'C'
  const regex = /(\w+)\s*=\s*(\w+)\[\[(.*)/;
  const match = code.match(regex);

  if (!(match && match.length === 4)) {
    return null;
  }

  const [_, newTable, table, columnsStr] = match;
  if (!(table in tablesColumns)) {
    return null;
  }
  let filterCond = utils.getValidFilterCond(columnsStr);
  if (filterCond === null) {
    return null;
  }

  const columnsAndOccur: {name: string, occur: number}[] = [];
  tablesColumns[table].forEach((col: string) => {
    const idx1 = filterCond?.indexOf(`"${col}"`);
    const idx2 = filterCond?.indexOf(`'${col}'`);
    if (idx1 !== undefined && idx1 !== -1) {
      columnsAndOccur.push({name: col, occur: idx1});
    } else if (idx2 !== undefined && idx2 !== -1) {
      columnsAndOccur.push({name: col, occur: idx2});
    } else {
      return;
    }
  });
  columnsAndOccur.sort((a, b) => a.occur - b.occur);
  const columns = columnsAndOccur.map((c) => c.name);
  return { table, newTable, columns };
}

export function findTableFilterTemp(code: string, tablesColumns: {[key: string]: string[]}): ITableFilterParam | null {
  // Example: df2 = df1[df1["A"] > 0 && df1["B"] < 0 
  const regex = /(\w+)\s*=\s*(\w+)\[(.*)/;
  const match = code.match(regex);

  if (!(match && match.length === 4)) {
    return null;
  }

  const [_, newTableName, tableName, filterStr] = match;
  if (!(tableName in tablesColumns)) {
    return null;
  }
  if (filterStr.startsWith("[")) { // means column selection, not filter
    return null;
  }

  const leftPNum = utils.countLetterInStr(filterStr, "[")
  const rightPNum = utils.countLetterInStr(filterStr, "]")

  // Exclude such case: df = df["A"] + df["B"]. Should not let cond = `"A"] + df["B``
  let filterCond = utils.getValidFilterCond(filterStr);
  if (filterCond === null) {
    return null;
  }


  if (filterCond.endsWith("]")) { // remove the last ']'
    if (leftPNum + 1 === rightPNum) {
      filterCond = filterCond.slice(0, -1);
    } else if (leftPNum + 1 < rightPNum) { // invalid
      return null;
    }
  }

  // Find filter values
  filterCond = filterCond.trim();
  let filterCondCopy = filterCond;
  const condValues: (string | number)[] = [];
  const regexCond = /(>=|<=|>|<|==|!=)\s*(['"][^'"]*['"]|\d+)/;
  let condMatch = filterCondCopy.match(regexCond);
  while (condMatch) {
    const [matchedStr, _op, value] = condMatch;
    const v = utils.removeQuotes(value);
    condValues.push(v);
    filterCondCopy = filterCondCopy.replace(matchedStr, '');
    condMatch = filterCondCopy.match(regexCond);
  }


  return {
    newTable: newTableName,
    table: tableName,
    cond: filterCond,
    condValues: condValues
  };
}

export function findTableConcatTemp(code: string, tablesColumns: {[key: string]: string[]}): ITableConcatParam | null {
  // Example: df = pd.concat([df1, df2, df3, 

  const concatRegex = /(\w+)\s*=\s*\w+\.concat\(\[([^\]]+)/;
  const match = code.match(concatRegex);

  if (match) {
    // Extract the new table name and the table names from the match
    const newTable = match[1].trim();
    const tables = match[2].split(',').map(table => table.trim());

    // Verify that each table name exists in the tablesColumns object
    const validTables = tables.filter(table => tablesColumns.hasOwnProperty(table));

    if (validTables.length === tables.length) {
      // Construct and return the ITableConcatParam object
      return { tables: validTables, newTable };
    }
  }

  // Return null if no valid concatenation is found
  return null;
}

export function findTableSortTemp(code: string, tablesColumns: {[key: string]: string[]}): ITableSortParam | null {
  // Example: df = df.sort_values(by=['A', 'B'], ascending=[True, False])
  // Example: df = df.sort_values(['A', 'B'], ascending=[True, False])
  // Example: df = df.sort_values(by='A', ascending=False)
  // Example: df2 = df.sort_values('A', ascending=False)
  // Example: df = df.sort_values('A')
  const regex = /(\w+)\s*=\s*(\w+)\.sort_values\s*\(\s*(?:by\s*=\s*)?(\[.*?\]|'.*?'|".*?")(?:\s*,\s*ascending\s*=\s*(\[.*?\]|True|False))?/;
  const match = code.match(regex);

  // console.log("match", match);
  

  // TODO: covid_19_data.sort_values(["Country / Region",
  // TODO: covid_19_data.sort_values(["Country / Region", "Province / State"], ascending=[True, 

  if (match) {
    const newTable = match[1].trim();
    const table = match[2].trim();

    let match3 = match[3].replace(/'/g, '"').replace(/"/g, '');
    match3 = utils.removeBrackets(match3);
    const sortCols = match3.split(',').map(col => col.trim());

    let ascStr = match[4] ? match[4].replace(/'/g, '"').replace(/"/g, '') : 'True';
    ascStr = utils.removeBrackets(ascStr);
    const asc = ascStr === 'True' ? [true] : ascStr === 'False' ? [false] : ascStr.split(',').map(a => a.trim() === 'True');

    if (tablesColumns.hasOwnProperty(table) && sortCols.every(col => tablesColumns[table].includes(col))) {
      return { table, newTable, sortCols, asc };
    }
  }
  return null;
}

export function findPdMergeTemp(code: string, tablesColumns: {[key: string]: string[]}): ITableMergeParam | null {
  // Example: df = pd.merge(df1, df2, on='A', how='inner')
  // @TODO: aquire alias of pandas
  const regexPd = /(\w+)\s*=\s*pd\.merge\s*\(\s*(\w+)\s*,\s*(\w+)/;
  const matchPd = code.match(regexPd);

  if (matchPd?.index !== undefined) {
    // Find tables
    const newTable = matchPd[1].trim();
    const leftTable = matchPd[2].trim();
    const rightTable = matchPd[3].trim();
    // Find columns
    let leftCol: string | null = null;
    let rightCol: string | null = null;
    const optionStr = code.slice(matchPd.index + matchPd[0].length);
    // Find the pattern `on='A'`
    const onRegex = /on\s*=\s*['"]([^'"]+)['"]/;
    const onMatch = optionStr.match(onRegex);
    // Find the pattern `left_on='A'`
    const leftOnRegex = /left_on\s*=\s*['"]([^'"]+)['"]/;
    const leftOnMatch = optionStr.match(leftOnRegex);
    // Find the pattern `right_on='A'`
    const rightOnRegex = /right_on\s*=\s*['"]([^'"]+)['"]/;
    const rightOnMatch = optionStr.match(rightOnRegex);
    if (leftOnMatch || rightOnMatch) {
      if (leftOnMatch) {
        leftCol = leftOnMatch[1];
      }
      if (rightOnMatch) {
        rightCol = rightOnMatch[1];
      }
    } else if (onMatch) {
      leftCol = onMatch[1];
      rightCol = onMatch[1];
    }
    // Find how
    let how: string | null = null;
    // Find the pattern `how='inner'`
    const howRegex = /how\s*=\s*['"]([^'"]+)['"]/;
    const howMatch = optionStr.match(howRegex);
    if (howMatch) {
      how = howMatch[1];
    }

    // Roughly check
    if (tablesColumns.hasOwnProperty(leftTable) && tablesColumns.hasOwnProperty(rightTable)) {
      return { newTable, leftTable, rightTable, leftCol, rightCol, how };
    }
  }
  return null;
}

export function findTableMergeTemp(code: string, tablesColumns: {[key: string]: string[]}): ITableMergeParam | null {  
  // Example: df = df1.merge(df2, on='A', how='inner')
  const regex = /(\w+)\s*=\s*(\w+)\.merge\s*\(\s*(\w+)\s*/;
  const match = code.match(regex);

  if (match?.index !== undefined) {
    // Find tables
    const newTable = match[1].trim();
    const leftTable = match[2].trim();
    const rightTable = match[3].trim();
    // Find columns
    let leftCol: string | null = null;
    let rightCol: string | null = null;
    const optionStr = code.slice(match.index + match[0].length);
    // Find the pattern `on='A'`
    const onRegex = /on\s*=\s*['"]([^'"]+)['"]/;
    const onMatch = optionStr.match(onRegex);
    // Find the pattern `left_on='A'`
    const leftOnRegex = /left_on\s*=\s*['"]([^'"]+)['"]/;
    const leftOnMatch = optionStr.match(leftOnRegex);
    // Find the pattern `right_on='A'`
    const rightOnRegex = /right_on\s*=\s*['"]([^'"]+)['"]/;
    const rightOnMatch = optionStr.match(rightOnRegex);
    if (leftOnMatch || rightOnMatch) {
      if (leftOnMatch) {
        leftCol = leftOnMatch[1];
      }
      if (rightOnMatch) {
        rightCol = rightOnMatch[1];
      }
    } else if (onMatch) {
      leftCol = onMatch[1];
      rightCol = onMatch[1];
    }
    // Find how
    let how: string | null = null;
    // Find the pattern `how='inner'`
    const howRegex = /how\s*=\s*['"]([^'"]+)['"]/;
    const howMatch = optionStr.match(howRegex);
    if (howMatch) {
      how = howMatch[1];
    }

    // Roughly check
    if (tablesColumns.hasOwnProperty(leftTable) && tablesColumns.hasOwnProperty(rightTable)) {
      return { newTable, leftTable, rightTable, leftCol, rightCol, how };
    }
  }

  return null;
}

export function findGroupby(code: string, tablesColumns: {[key: string]: string[]}): IGroupbyParam | null {
  //example: df2 = df.groupby("col1")[["col2", "col3", ...]].sum()
  //example: df = df.groupby(["col1", "col2"])[["col3"]].avg()
  //example: df2 = df1.groupby("col1").sum()
  // const regex = /(\w+)\s*=\s*(\w+)\.groupby\((.*?)\)\s*\[?\[?(.*?)?\]?\]?\.(\w+)\(\)/;
  const regex = /(\w+)\s*=\s*(\w+)\.groupby\((.*?)\)\s*\[?\[?(.*?)?\]?\]?\.(\w+)/;
  const match = code.match(regex);
  // console.log('[groupby match]', match);

  if (match) {
    const newTableName = match[1].trim();
    const tableName = match[2].trim();

    let match3 = match[3].replace(/'/g, '"').replace(/"/g, '');
    match3 = utils.removeBrackets(match3);
    const groupbyCols = match3.split(',').map(col => col.trim()); // groupby里的所有列

    let selectCols = null;
    if(match[4] !== undefined) {
      let match4 = match[4].replace(/'/g, '"').replace(/"/g, '');
      match4 = utils.removeBrackets(match4);
      selectCols = match4.split(',').map(col => col.trim()); // groupby之后选择了哪些列
    }


    const aggFunc = match[5]; // 聚合函数名
    // console.log('[groupby match] code:',code, match, 'newTableName:', newTableName, 'tableName:', tableName, 'groupbyCols:', groupbyCols,'selectCols:', selectCols, 'aggFunc:', aggFunc);
    if (!(tableName in tablesColumns)) {
      return null;
    }

    if(groupbyCols){
      groupbyCols.forEach(col => {
        if (!tablesColumns[tableName].includes(col)) {
          return null;
        }
      });
    }

    if (selectCols) {
      selectCols.forEach(col => {
        if (!tablesColumns[tableName].includes(col)) {
          return null;
        }
      });
    }

    return {
      newTableName,
      tableName,
      groupbyCols,
      selectCols,
      aggFunc
    };
  }

  return null; 
}

export function findColumnAddTemp(code: string, tablesColumns: {[key: string]: string[]}): IColumnComputeParam | null {
  
  const addregex = /(\w+)\[['"]([^'"]+)['"]\]\s*=\s*((?:\w+\[['"]\w+['"]\]?\s*(?:\+\s*)?)*)/;
  const divRegex = /(\w+)\[['"]([^'"]+)['"]\]\s*=\s*((?:\w+\[['"]\w+['"]\]?\s*(?:\/\s*)?)*)/;
 
  let operator = '';
  const addMatch = code.match(addregex);
  const divMatch = code.match(divRegex);
  let match = null;

  if(addMatch && divMatch) {
    if(addMatch[3].length > divMatch[3].length) {
      operator = '+';
      match = addMatch;
    } else if(divMatch) {
      operator = '/';
      match = divMatch;
    }
  }

  if (match) {
    // console.log('[add && div match]', match)
    // 提取DataFrame名称、被赋值的列名
    const tableName = match[1].trim(); // DataFrame的名称
    const assignedColumn = match[2].trim(); // 被赋值的列名
    const expressions = match[3]; // 剩余的表达式部分（相加的列）

    if (!(tableName in tablesColumns)) {
      return null;
    }

    // 使用正则表达式提取相加的所有列
    const columnRegex = /(\w+)\[['"]([^'"]+)['"]\]?/g;
    let columnMatch;
    let addedColumns = [];
    let addedTable = [];

    while ((columnMatch = columnRegex.exec(expressions)) !== null) {
      addedTable.push(columnMatch[1]); // 相加的表名
      addedColumns.push(columnMatch[2]); // 相加的列名
    }

    // 检查所有表是否一致
    for (let table of addedTable) {
      if (table !== tableName) {
        return null;
      }
    }

    if(divMatch) { //必须大于两列才能做除法
      if(addedColumns.length < 2) {
        return null;
      }
    }

    // 检查所有列名是否在指定的表中
    for (let col of addedColumns) {
      if (!tablesColumns[tableName].includes(col)) {
        return null;
      }
    }

    console.log('[column add match]', "code:", code, "tableName:", "match:", match, tableName, "assignedColumn:", assignedColumn, "addedColumns:", addedColumns);
    return {
      table: tableName,
      column: assignedColumn,
      addedColumns: addedColumns,
      operator: operator
    };
  }

  return null;
}

export function findColumnRenameTemp(code: string, tablesColumns: {[key: string]: string[]}): IColumnRenameParam | null {
  // Example: df_renamed = df.rename(columns={'A': 'Column1', 'B': 'Column2'})
  const regex = /(\w+)\s*=\s*(\w+)\.rename\((.*)\)?/;
  const match = code.match(regex);
  console.log('[column rename match]', code, match);
  if(match) {
    const tableName = match[2].trim();

    //解析columns中的值
    let columnRegex = /columns\s*=\s*\{\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/

    let columns= match[3];

    let columnsMatch = columns.match(columnRegex);

    if(columnsMatch === null) return null;

    const [_, oldColName, newColName] = columnsMatch;

    // console.log('[column rename match columns]', match[3], columnsMatch, oldColName, newColName);

    if (!(tableName in tablesColumns && tablesColumns[tableName].includes(oldColName))) {
      return null;
    }
    
    return {
      table: tableName,
      oldColName: oldColName, 
      newColName: newColName, 
    };
  }

  return null;

}

