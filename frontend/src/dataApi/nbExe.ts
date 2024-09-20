import type { ISessionContext } from '@jupyterlab/apputils';
import type { KernelMessage } from '@jupyterlab/services';
import _ from 'lodash';
import { TDFRow, IColInfoAll, IDFInfoAll, IValueCount, IHistogramBin, IColInfo, IDfCondAll, IDFInfo } from '../sidePanel/interface';

type ExecResult = { content: string[]; exec_count: number };

function replaceSpecial(input_str: string) {
    /*Format strings when writing code, need to escape double quotes (") 
    since the code uses same character, single quotes are fine (') */

    const res = input_str
        .replace(/\\/g, '\\\\') // escape backslashes
        .replace(/"/g, '\\"'); // escape double quotes
    return res;
}

export class NBExe {
	private _sessionContext: ISessionContext | null;

	constructor(session: ISessionContext | null) {
		this._sessionContext = session; // starts null
	}

	public setSession(new_session: ISessionContext) {
		this._sessionContext = new_session;
	}

	get session(): ISessionContext {
		if (!this._sessionContext) {
			throw new Error('[NBExe] Session context is null');
		}
		return this._sessionContext;
	}

    // ################################## Code execution helpers ###########################################

	private sendCodeToKernel(code: string, onReply?: (type: string, content: any) => void, onDone?: (arg_0?: string) => void) {
		if (!(this.session == undefined)) {
			const ss = this.session.session;
			if (!ss) {
				throw new Error('[NBExe] Session is undefined');
			}
			const knl = ss.kernel;
			if (!knl) {
				throw new Error('[NBExe] Kernel is undefined');
			}
			const future = knl.requestExecute({
					code,
					stop_on_error: true,
					store_history: false // prevents incrementing execution count for extension code
			});

			// this is the output of the execution, may return things multiple times as code runs
			future.onIOPub = (msg: KernelMessage.IIOPubMessage) => {
				const msg_type = msg.header.msg_type;
				if ((msg_type === 'execute_result' || msg_type === 'display_data' || msg_type === 'update_display_data' || msg_type === 'stream') && onReply) {
					onReply(msg_type + '', msg.content);
				}
			};

			// when execution is done
			future.done.then(
				reply => {
					if (onDone) {
						onDone(reply.content.status);
					}
					// reply.content.execution_count // time this code was run
				},
				error => {
					console.warn('Code run failed: ', error);
					if (onDone) {
						onDone();
					}
				}
			);
		}
	}

    private async executeCode(code: string): Promise<ExecResult> {
			return new Promise<ExecResult>(resolve => {
				const response: ExecResult = {
					content: [],
					exec_count: -1
				};
				const contentMatrix: string[][] = [];

				const onReply = (type: string, content: any) => {
					if (type === 'execute_result' || type === 'display_data' || type === 'update_display_data') {
						const cont: string[] = content.data['text/plain'].split('\n');
						response.exec_count = content.execution_count; // does not exist on message for streams
						contentMatrix.push(cont);
					} else if (type === 'stream') {
						const cont: string[] = content.text.split('\n');
						contentMatrix.push(cont);
					}
				};

				const onDone = (status?: string) => {
					let flat_array = Array.prototype.concat(...contentMatrix);

					/* prevent empty strings that happen from extra returns at end of print(), 
							this causes big issues if onReply() returns multiple times and the order 
							of code results gets thrown off. If future code intentionally prints blank
							lines this will cause other issues. */
					flat_array = flat_array.filter(item => item !== '');
					response['content'] = flat_array;
					// console.log(`[executeCode] ${code} finished with status [${status}]. Response: `, response)
					resolve(response);
				};

				this.sendCodeToKernel(code, onReply, onDone);
			});
    }

    /**
     * If using the python package xavier, then it needs to be imported every time 
     * so this appends the import and then executes the code
     * @param code the code string
     */
    private executePythonXavier(code: string): Promise<ExecResult> {
        const importCode = 'import xavier as idg_xavier\n'
        const deleteCode = '\ndel idg_xavier\n'
        return this.executeCode(importCode + code + deleteCode);
    }

    // ############################# Python kernel functions ################################################
    public async getAllDataFrames(currentOutputName: string): Promise<IDFInfoAll> {
        try {
            const pandasImported = await this.checkIfPandasInModules()
            if (!pandasImported) {
                console.warn("[getAllDataFrames] Pandas is not imported");
                return {};
            }
            const var_names = await this.getVariableNames(currentOutputName);
            const isDF = await this.getIsDFVars(var_names);
            const vars_DF = var_names.filter((d, idx) => isDF[idx] === 'True');
            const dfColMap: IDFInfoAll = {};
            const python_ids = await this.getObjectIds(vars_DF);
            for (let index = 0; index < vars_DF.length; index++) {
                const dfName = vars_DF[index];
                const [num_rows, num_cols] = await this.getShape(dfName);
                const { columns, columnNameList } = await this.getColumns(dfName);
                dfColMap[dfName] = {
                    tableName: dfName,
                    numRows: num_rows,
                    numCols: num_cols,
                    python_id: python_ids[index],
                    columns: columns,
                    columnNameList: columnNameList,
                };
            }
            return dfColMap;
        } catch (error) {
            console.warn('[getAllDataFrames]', error);
            return {};
        }
    }

    public async getCateValueCounts(dfName: string, colName: string): Promise<IValueCount[]> {
        const code = `idg_xavier.getCateValueCounts(${dfName}, "${replaceSpecial(colName)}")`
        try {
            const res = await this.executePythonXavier(code);
            const content = res['content']; // might be null
            const json_res: IValueCount[] = JSON.parse(content.join(""));
            return json_res;
        } catch (error) {
            console.warn(`[Error caught] in getCateValueCounts executing code: ${code}`, error);
            return [];
        }
    }

    public async getNumColumnSample(dfName: string, colName: string): Promise<(number | string)[]> {
        const code = `idg_xavier.getNumColumnSample(${dfName}, "${replaceSpecial(colName)}")`
        try {
            const res = await this.executePythonXavier(code);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content.join(""));
            const sample: (number | string)[] = json_res["sample"];
            return sample;
        } catch (error) {
            console.warn(`[Error caught] in getNumColumnSample executing code: ${code}`, error);
            return [];
        }
    }

    public async getRowSampleOfOneDf(dfName: string, condition: IDfCondAll): Promise<TDFRow[]> {
        const code = `idg_xavier.getRowSampleOfOneDf(${dfName}, """${JSON.stringify(condition)}""")`
        try {
            const res = await this.executePythonXavier(code);
            const content = res['content']; // might be null
            const json_res: TDFRow[] = JSON.parse(content.join(""));
            return json_res;
        } catch (error) {
            console.warn(`[Error caught] in getRowSampleOfOneDf executing code: ${code}`, error);
            return [];
        }
    }

    public async getVariableNames(currentOutputName: string): Promise<string[]> {
        try {
            // const code = `print([x for x in dir() if x == "${currentOutputName}" or x[0] != "_"])`
            const code = `print([x for x in dir() if x[0] != "_"])`
            const res = await this.executeCode(code);
            const content = res['content'];
            const data = content.join("").replace(/'/g, '"');
            if (data) {
                const names = JSON.parse(data);
                return names;
            }
            return []
        } catch (error) {
            return [];
        }
    }

    private async checkIfPandasInModules(): Promise<boolean> {
        try {
            const code_lines = [
                "import sys as __xavier_sys",
                "print('pandas' in __xavier_sys.modules)",
                "del __xavier_sys"
            ]
            const res = await this.executeCode(code_lines.join('\n'));
            const content = res['content'].join("").trim();
            if (content === 'True') {
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * NOTE: this function cannot be put in xavier python because evaluting the variable names 
     * does not work from a separate module 
     * @returns array of "True" or "False" if that variable is a pandas dataframe
     */
    private async getIsDFVars(varNames: string[]): Promise<string[]> {
        try {
            const code_lines = ['import pandas as __xavier_pandas'];
            varNames.forEach(name =>
                code_lines.push(`print(type(${name}) == __xavier_pandas.DataFrame)`)
            );
            code_lines.push('del __xavier_pandas')
            const res = await this.executeCode(code_lines.join('\n'));
            const content = res['content'];
            return content;
        } catch (error) {
            console.warn('[getIsDFVars]', error);
            return [];
        }
    }

    /**
     * Used to see if id has changed and update interface.
     * NOTE: this function cannot be put in xavier python because evaluting the variable names 
     * does not work from a separate module 
     * @returns array of python object ids for varNames
     */
    private async getObjectIds(varNames: string[]): Promise<string[]> {
        try {
            const code_lines: string[] = [];
            varNames.forEach(name => code_lines.push(`print(id(${name}))`));
            const res = await this.executeCode(code_lines.join('\n'));
            const content = res['content'];
            return content;
        } catch (error) {
            console.warn('[Error caught] in getObjectIds', error);
            return [];
        }
    }

  //   public async getVariableNamesInPythonStr(codeString: string): Promise<string[]> {

  //       let pandasWasImported = await this.checkIfPandasInModules()

  //       if (pandasWasImported) {
  //           const formattedCode = codeString.replace(/"/g, '\\"');
  //           const code = `digautoprofiler.getVariableNamesInPythonStr("""${formattedCode}""")`;
  //           try {
  //               const res = await this.executePythonAP(code)
  //               let content = res["content"].join("")
  //               content = content.replace(/'/g, '"') // replace single quotes
  //               content = content.replace('{', '[')
  //               content = content.replace('}', ']')

  //               const vars = JSON.parse(content)

  //               return vars

  //           } catch (error) {
  //               return []
  //           }
  //       }
  //       return []
  //   }

    private async getColumns(dfName: string): Promise<{ columns: IColInfoAll, columnNameList: string[] }> {
        const code = `idg_xavier.getColumns(${dfName})`
        try {
            const res = await this.executePythonXavier(code);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content.join(""));
            const columnNameList: string[] = []
            const columns: IColInfoAll = {}

            for (const item of json_res) {
                columnNameList.push(item["colName"]);
                if (item["colName"] in columns) {
                    console.warn(`[getColumns] Column name ${item["colName"]} is duplicated in dataframe ${dfName}`);
                }
                columns[item["colName"]] = {
                    colName: item["colName"],
                    dtype: item["dtype"],
                    nullCount: item["nullCount"],
                    cardinality: item["cardinality"],
                    sortedness: item["sortedness"],
                    minValue: item["minValue"],
                    maxValue: item["maxValue"],
                }
            }

            return { columns, columnNameList }
        } catch (error) {
            console.warn(`[Error caught] in getColumns executing code: ${code}`, error);
            return { columns: {}, columnNameList: [] };
        }
    }

    public async getShape(dfName: string): Promise<number[]> {
        /*
        returns tuple array [length, width]
        */
        const code = `idg_xavier.getShape(${dfName})`
        try {
            const res = await this.executePythonXavier(code);
            const content = res['content'];
            const shapeString = content.join("");
            const [length, width] = shapeString.substring(1, shapeString.length - 1).split(',').map(x => parseFloat(x));
            return [length, width];
        } catch (error) {
            console.warn(`[Error caught] in getShape executing: ${code}`, error);
            return [0, 0];
        }
    }

    public async getHeadTail(dfName: string): Promise<TDFRow[]> {
        const code = `idg_xavier.getHeadTail(${dfName})`
        try {
            const res = await this.executePythonXavier(code);
            const content = res['content'];
            const json_res = JSON.parse(content.join(""));
            return json_res;
        } catch (error) {
            console.warn(`[Error caught] in getHeadTail executing: ${code}`, error);
            return [];
        }
    }

    public async getNumHistogram(dfName: string, colName: string): Promise<IHistogramBin[]> {
        const code = `idg_xavier.getNumHistogram(${dfName}, "${replaceSpecial(colName)}")`;
        try {
            const res = await this.executePythonXavier(code);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content?.join(""));
            return json_res["histogram"];
        } catch (error) {
            console.warn(`[Error caught] in getNumHistogram executing: ${code}`, error);
            return [];
        }
    }

    public async exeFillna(table: string, column: string, fillValue: string): Promise<{newList: string[], meta: IColInfo}> {
        const saveDf = `__xavier_save_${table} = ${table}.copy()`;
        const code = `idg_xavier.exeFillna(${table}, "${replaceSpecial(column)}", ${fillValue})`;
        const restoreDf = `${table} = __xavier_save_${table}`;
        const deleteDf = `del __xavier_save_${table}`;
        const allCode = [saveDf, code, restoreDf, deleteDf].join('\n');

        try {
            const res = await this.executePythonXavier(allCode);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content.join(""));
            const meta = JSON.parse(json_res["meta"]);
            return {
                newList: json_res["newList"],
                meta: meta[0]
            };
        } catch (error) {
            console.warn(`[Error caught] in exeFillna executing: ${code}`, error);
            return {
                newList: [],
                meta: {
                    colName: column,
                    dtype: "object",
                    nullCount: 0,
                    cardinality: 0,
                    sortedness: "no",
                    minValue: null,
                    maxValue: null
                }
            }
        }
    }

    public async exeColumnRename(table: string, oldColName: string, newColName: string): Promise<{newList: string[], meta: IColInfo}> {
        const saveDf = `__xavier_save_${table} = ${table}.copy()`;
        const code = `idg_xavier.exeColumnRename(${table}, "${replaceSpecial(oldColName)}","${replaceSpecial(newColName)}")`;
        const restoreDf = `${table} = __xavier_save_${table}`;
        const deleteDf = `del __xavier_save_${table}`;
        const allCode = [saveDf, code, restoreDf, deleteDf].join('\n');

        try {
            const res = await this.executePythonXavier(allCode);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content.join(""));
            const meta = JSON.parse(json_res["meta"]);
            return {
                newList: json_res["newList"],
                meta: meta[0]
            };
        } catch (error) {
            console.warn(`[Error caught] in newColName executing: ${code}`, error);
            return {
                newList: [],
                meta: {
                    colName: newColName,
                    dtype: "object",
                    nullCount: 0,
                    cardinality: 0,
                    sortedness: "no",
                    minValue: null,
                    maxValue: null
                }
            }
        }
    }

    public async exeColumnAdd(table: string, column: string, operator: string, addedColumns: string[]): Promise<{newList: string[], meta: IColInfo}> {
        const saveDf = `__xavier_save_${table} = ${table}.copy()`;
        const code = `idg_xavier.exeColumnAdd(${table}, "${column}", "${operator}", """ ${JSON.stringify(addedColumns)} """)`;
        const restoreDf = `${table} = __xavier_save_${table}`;
        const deleteDf = `del __xavier_save_${table}`;
        const allCode = [saveDf, code, restoreDf, deleteDf].join('\n');

        try {
            const res = await this.executePythonXavier(allCode);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content.join(""));
            const meta = JSON.parse(json_res["meta"]);
            return {
                newList: json_res["newList"],
                meta: meta[0]
            };
        } catch (error) {
            console.warn(`[Error caught] in exeColumnAdd executing: ${code}`, error);
            return {
                newList: [],
                meta: {
                    colName: column,
                    dtype: "object",
                    nullCount: 0,
                    cardinality: 0,
                    sortedness: "no",
                    minValue: null,
                    maxValue: null
                }
            }
        }
    }

    public async exeStrReplace(series: (string | null)[], old: string, newStr: string): Promise<string[]> {
        const code = `idg_xavier.exeStrReplace(${JSON.stringify(series)}, ${old}, ${newStr})`;
        try {
            const res = await this.executePythonXavier(code);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content.join(""));
            return json_res;
        } catch (error) {
            console.warn(`[Error caught] in exeStrReplace executing: ${code}`, error);
            return [];
        }
    }

    public async exeStrReplaceMeta(table: string, column: string, old: string, newStr: string): Promise<IColInfo> {
        const code = `idg_xavier.exeStrReplaceMeta(${table}, "${replaceSpecial(column)}", ${old}, ${newStr})`;
        try {
            const res = await this.executePythonXavier(code);
            const content = res['content']; // might be null            
            const json_res = JSON.parse(content.join(""));
            const item = json_res[0];
            return {
                colName: item["colName"],
                dtype: item["dtype"],
                nullCount: item["nullCount"],
                cardinality: item["cardinality"],
                sortedness: item["sortedness"],
                minValue: item["minValue"],
                maxValue: item["maxValue"],
            };
        } catch (error) {
            console.warn(`[Error caught] in exeStrReplaceMeta executing: ${code}`, error);
            return {
                colName: column,
                dtype: "object",
                nullCount: 0,
                cardinality: 0,
                sortedness: "no",
                minValue: null,
                maxValue: null
            };
        }
    }

    public async exeTableFilter(table: string, cond: string, newTable: string): Promise<{success: boolean, resRows: TDFRow[], resMeta: IDFInfo, histograms: {[colName: string]: IHistogramBin[]}}> {
        const saveDf = `__xavier_save_${table} = ${table}.copy()`;
        const code = `idg_xavier.exeTableFilter(${table}, "${table}", """ ${cond} """)`;
        const restoreDf = `${table} = __xavier_save_${table}`;
        const deleteDf = `del __xavier_save_${table}`;
        const allCode = [saveDf, code, restoreDf, deleteDf].join('\n');
        try {
            const res = await this.executePythonXavier(allCode);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content.join(""));
            const resRows: TDFRow[] = JSON.parse(json_res["rows"]);
            const jcolumns = JSON.parse(json_res["columns"]);
            const columns: IColInfoAll = {};
            for (const item of jcolumns) {
                columns[item["colName"]] = {
                    colName: item["colName"],
                    dtype: item["dtype"],
                    nullCount: item["nullCount"],
                    cardinality: item["cardinality"],
                    sortedness: item["sortedness"],
                    minValue: item["minValue"],
                    maxValue: item["maxValue"],
                };
            }
            return {
                success: true,
                resRows,
                resMeta: {
                    tableName: newTable,
                    python_id: "",
                    numRows: json_res["numRows"],
                    numCols: json_res["numCols"],
                    columns: columns,
                    columnNameList: json_res["columnNameList"]
                },
                histograms: json_res["histograms"]
            };
        } catch (error) {
            console.warn(`[Error caught] in exeTableFilter executing: ${code}`, error);
            return {
                success: false,
                resRows: [],
                resMeta: {
                    tableName: table,
                    python_id: "",
                    numRows: 0,
                    numCols: 0,
                    columns: {},
                    columnNameList: []
                },
                histograms: {}
            };
        }
    }

    public async exeTableSort(table: string, sortCols: string[], ascending: boolean[], newTable: string): Promise<{success: boolean, resRows: TDFRow[], resMeta: IDFInfo, histograms: {[colName: string]: IHistogramBin[]}}> {
        const saveDf = `__xavier_save_${table} = ${table}.copy()`;
        const code = `idg_xavier.exeTableSort(${table}, """ ${JSON.stringify(sortCols)} """, """ ${JSON.stringify(ascending)} """)`;
        const restoreDf = `${table} = __xavier_save_${table}`;
        const deleteDf = `del __xavier_save_${table}`;
        const allCode = [saveDf, code, restoreDf, deleteDf].join('\n');
        try {
            const res = await this.executePythonXavier(allCode);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content.join(""));
            const resRows: TDFRow[] = JSON.parse(json_res["rows"]);
            const jcolumns = JSON.parse(json_res["columns"]);
            const columns: IColInfoAll = {};
            for (const item of jcolumns) {
                columns[item["colName"]] = {
                    colName: item["colName"],
                    dtype: item["dtype"],
                    nullCount: item["nullCount"],
                    cardinality: item["cardinality"],
                    sortedness: item["sortedness"],
                    minValue: item["minValue"],
                    maxValue: item["maxValue"],
                };
            }
            return {
                success: true,
                resRows,
                resMeta: {
                    tableName: newTable,
                    python_id: "",
                    numRows: json_res["numRows"],
                    numCols: json_res["numCols"],
                    columns: columns,
                    columnNameList: json_res["columnNameList"]
                },
                histograms: json_res["histograms"]
            };
        } catch (error) {
            console.warn(`[Error caught] in exeTableSort executing: ${code}`, error);
            return {
                success: false,
                resRows: [],
                resMeta: {
                    tableName: table,
                    python_id: "",
                    numRows: 0,
                    numCols: 0,
                    columns: {},
                    columnNameList: []
                },
                histograms: {}
            };
        }
    }

    public async exeGroupby(table: string, groupbyCols: string[], selectCols: string[] | null, aggFunc: string, newTable: string): Promise<{success: boolean, resRows: TDFRow[], resMeta: IDFInfo, histograms: {[colName: string]: IHistogramBin[]}}> {
        const saveDf = `__xavier_save_${table} = ${table}.copy()`;
        const code = `idg_xavier.exeGroupby(${table}, """ ${JSON.stringify(groupbyCols)} """, """ ${JSON.stringify(selectCols)} """, "${aggFunc}")`;
        const restoreDf = `${table} = __xavier_save_${table}`;
        const deleteDf = `del __xavier_save_${table}`;
        const allCode = [saveDf, code, restoreDf, deleteDf].join('\n');
        try {
            const res = await this.executePythonXavier(allCode);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content.join(""));
            const resRows: TDFRow[] = JSON.parse(json_res["rows"]);
            const jcolumns = JSON.parse(json_res["columns"]);
            const columns: IColInfoAll = {};
            for (const item of jcolumns) {
                columns[item["colName"]] = {
                    colName: item["colName"],
                    dtype: item["dtype"],
                    nullCount: item["nullCount"],
                    cardinality: item["cardinality"],
                    sortedness: item["sortedness"],
                    minValue: item["minValue"],
                    maxValue: item["maxValue"],
                };
            }
            return {
                success: true,
                resRows,
                resMeta: {
                    tableName: newTable,
                    python_id: "",
                    numRows: json_res["numRows"],
                    numCols: json_res["numCols"],
                    columns: columns,
                    columnNameList: json_res["columnNameList"]
                },
                histograms: json_res["histograms"]
            };
        } catch (error) {
            console.warn(`[Error caught] in exeGroupby executing: ${code}`, error);
            return {
                success: false,
                resRows: [],
                resMeta: {
                    tableName: table,
                    python_id: "",
                    numRows: 0,
                    numCols: 0,
                    columns: {},
                    columnNameList: []
                },
                histograms: {}
            };
        }
    }

    public async exeTableMerge(leftTable: string, rightTable: string, leftCol: string | null, rightCol: string | null, how: string | null, newTable: string): Promise<{success: boolean, resRows: TDFRow[], resMeta: IDFInfo, histograms: {[colName: string]: IHistogramBin[]}}> {
        const saveDf = `__xavier_save_${leftTable} = ${leftTable}.copy()`;
        const code1 = `idg_xavier.exeTableMerge(${leftTable}, ${rightTable}, "${leftCol}", "${rightCol}", "${how}")`;
        const code2 = `idg_xavier.exeTableMerge(${leftTable}, ${rightTable}, None, None, "${how}")`;
        const code3 = `idg_xavier.exeTableMerge(${leftTable}, ${rightTable}, "${leftCol}", "${rightCol}", None)`;
        const code4 = `idg_xavier.exeTableMerge(${leftTable}, ${rightTable}, None, None, None)`;
        const code = (how !== null) ? (leftCol !== null ? code1 : code2) : (leftCol !== null ? code3 : code4); // We have ensure that leftCol and rightCol will both be null or not null
        const restoreDf = `${leftTable} = __xavier_save_${leftTable}`;
        const deleteDf = `del __xavier_save_${leftTable}`;
        const allCode = [saveDf, code, restoreDf, deleteDf].join('\n');
        try {
            const res = await this.executePythonXavier(allCode);
            const content = res['content']; // might be null
            console.log("content", content);
            
            const json_res = JSON.parse(content.join(""));
            const resRows: TDFRow[] = JSON.parse(json_res["rows"]);
            const jcolumns = JSON.parse(json_res["columns"]);
            const columns: IColInfoAll = {};
            for (const item of jcolumns) {
                columns[item["colName"]] = {
                    colName: item["colName"],
                    dtype: item["dtype"],
                    nullCount: item["nullCount"],
                    cardinality: item["cardinality"],
                    sortedness: item["sortedness"],
                    minValue: item["minValue"],
                    maxValue: item["maxValue"],
                };
            }
            return {
                success: true,
                resRows,
                resMeta: {
                    tableName: newTable,
                    python_id: "",
                    numRows: json_res["numRows"],
                    numCols: json_res["numCols"],
                    columns: columns,
                    columnNameList: json_res["columnNameList"]
                },
                histograms: json_res["histograms"]
            };
        } catch (error) {
            console.warn(`[Error caught] in exeTableMerge executing: ${code}`, error);
            return {
                success: false,
                resRows: [],
                resMeta: {
                    tableName: newTable,
                    python_id: "",
                    numRows: 0,
                    numCols: 0,
                    columns: {},
                    columnNameList: []
                },
                histograms: {}
            };
        }
    }
}