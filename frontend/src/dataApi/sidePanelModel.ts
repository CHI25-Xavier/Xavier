
import type { ISessionContext } from '@jupyterlab/apputils';
import type { NBApi } from './nbApi';
import { NBExe } from './nbExe';
import _ from 'lodash';
import { IDFInfoAll, IRowSampleCache, IValueCount, IValueCountCache, TDFRow, ITableLvInfo, IRowLvInfo, IColLvInfo, IDFStyleAll, IHistogramBinCache, IHistogramBin, INumColumnSampleCache, IStrReplaceParam, IPreviewItems, IDfCondAll, ITableFilterParam, IColumnSelectParam, IDFInfo, ITableConcatParam, ITableSortParam, ITableMergeParam, IFillnaParam, IGroupbyParam, IColumnComputeParam, IColumnRenameParam } from '../sidePanel/interface';
import * as utils from "../utils";

export class SidePanelModel {

    private _observers: Set<() => void> = new Set();
    private _notebook: NBApi | undefined;
    private _ready: boolean = false;
    // Style
    private _allDfSeq: string[] = [];
    private _allDfStyle: IDFStyleAll = {};
    // private _selectedDFName: null | string = null;
    private _previewItems: IPreviewItems = {
        newColumns: {},
        newTables: {},
        op: null
    };
    // Data context
    private _allDfInfo: IDFInfoAll = {}
    private _valueCountsCache: IValueCountCache = {};
    private _histogramBinCache: IHistogramBinCache = {};
    private _numColumnSampleCache: INumColumnSampleCache = {};
    private _rowSampleCache: IRowSampleCache = {};
    // private _loadingNewData: Writable<boolean> = writable(false);
    private _executor: NBExe;
    // private _name: Writable<string> = writable(undefined)
    private _varsInCurrentCell: string[] = [] //Writable<string[]> = writable([])
    // private _language: Writable<string> = writable(undefined)
    // private _widgetIsVisible = () => false

    constructor(session: ISessionContext | null) {
        this._executor = new NBExe(session);
        this.getCateValueCounts = this.getCateValueCounts.bind(this);
        this.getRowSampleOfOneDf = this.getRowSampleOfOneDf.bind(this);
        this.setAllDfStyle = this.setAllDfStyle.bind(this);
        this.setAllDfSeq = this.setAllDfSeq.bind(this);
        this.setAllDfInfo = this.setAllDfInfo.bind(this);
        // this.setSelectedDFName = this.setSelectedDFName.bind(this);
        this.setPreviewItems = this.setPreviewItems.bind(this);
        this.resetPreviewItems = this.resetPreviewItems.bind(this);
    }

    get ready(): boolean {
        return this._ready;
    }

    // get loading(): Writable<boolean> {
    //     return this._loadingNewData;
    // }

    get executor(): NBExe {
        return this._executor
    }

    // Style
    get allDfStyle(): IDFStyleAll {
        return this._allDfStyle;
    }

    get allDfSeq(): string[] {
        return this._allDfSeq;
    }

    // get selectedDFName(): null | string {
    //     return this._selectedDFName;
    // }

    get previewItems(): IPreviewItems {
        return this._previewItems;
    }

    // Output table, column, row level information
    // Must include all active dataframes
    get tableLvInfo(): ITableLvInfo {
        const ks = Object.keys(this._allDfInfo);
        const res: ITableLvInfo = {};
        ks.forEach(k => {
            res[k] = {
                numRows: this._allDfInfo[k].numRows,
                numCols: this._allDfInfo[k].numCols,
                columnNameList: this._allDfInfo[k].columnNameList
            }
        });
        return res;
    }

    // Must include all active dataframes, all columns
    get colLvInfo(): IColLvInfo {
        const res: IColLvInfo = {};
        for (const [dfName, dfInfo] of Object.entries(this._allDfInfo)) {
            res[dfName] = {};
            for (const col of dfInfo.columnNameList) {
                const dtype = dfInfo.columns[col].dtype;
                let uniqueValues: (string | number)[] | null = null;
                let uvCounts: number[] | null = null;
                let minValue: string | number | null = null;
                let maxValue: string | number | null = null;
                let sample: (string | number)[] | null = null;
                if (utils.isCateColumn(dtype) && this._valueCountsCache[dfName] !== undefined && this._valueCountsCache[dfName][col] !== undefined) {
                    uniqueValues = this._valueCountsCache[dfName][col].map(item => item.value);
                    uvCounts = this._valueCountsCache[dfName][col].map(item => item.count);
                }
                if (utils.isNumColumn(dtype)) {
                    minValue = dfInfo.columns[col].minValue;
                    maxValue = dfInfo.columns[col].maxValue;
                    if (this._numColumnSampleCache[dfName] !== undefined && this._numColumnSampleCache[dfName][col] !== undefined) {
                        sample = this._numColumnSampleCache[dfName][col];
                    }
                }
                res[dfName][col] = {
                    dtype: dtype,
                    nullCount: dfInfo.columns[col].nullCount,
                    sortedness: dfInfo.columns[col].sortedness,
                    uniqueValues: uniqueValues,
                    uvCounts: uvCounts,
                    cardinality: dfInfo.columns[col].cardinality,
                    minValue: minValue,
                    maxValue: maxValue,
                    sample: sample
                }
            }
        }
        return res
    }

    // May not include all active dataframes
    get rowLvInfo(): IRowLvInfo {
        const ks = Object.keys(this._allDfInfo);
        const res: IRowLvInfo = {};
        ks.forEach(k => {
            res[k] = {
                columnNameList: this._allDfInfo[k].columnNameList,
                sampleRows: this.rowSampleCache[k] !== undefined ? this._rowSampleCache[k].rows.slice(0, 5) : null
            }
        });
        return res;
    }

    // Programming language
    // get language(): Writable<string> {
    //     return this._language
    // }

    // Session name (i.e. File name)
    // get name(): Writable<string> {
    //     return this._name
    // }

    get allDfInfo(): IDFInfoAll {
        return this._allDfInfo;
    }

    get variablesInCurrentCell(): string[] /*Writable<string[]>*/ {
        return this._varsInCurrentCell
    }

    get notebook(): NBApi {
        if (this._notebook === undefined) {
            throw new Error("[ProfileModel] Notebook not connected")
        }
        return this._notebook;
    }

    get currentOutputName(): string {
        return `_${this.notebook.mostRecentExecutionCount}`
    }

    get valueCountsCache() {
        return this._valueCountsCache;
    }

    get histogramBinCache() {
        return this._histogramBinCache;
    }

    get numColumnSampleCache() {
        return this._numColumnSampleCache;
    }

    get rowSampleCache() {
        return this._rowSampleCache;
    }

    // private notebookIsPython(): boolean {
    //     let currentLang = get(this.language)
    //     return (currentLang === 'python' || currentLang === 'python3')
    // }

    private notifyObservers(): void {
        this._observers.forEach(callback => callback());
    }

    public addObserver(callback: () => void): void {
        this._observers.add(callback);
    }

    public removeObserver(callback: () => void): void {
        this._observers.delete(callback);
    }

    public setAllDfInfo(newInfo: IDFInfoAll) {
        // Note that the style is also set.
        // 1. set style
        this._allDfStyle = utils.initAllDfStyle(newInfo, this._allDfStyle, this._previewItems.newTables, this._allDfInfo);
        // 2. set seq
        this._allDfSeq = utils.initAllDfSeq(newInfo, this._allDfSeq);
        // 3. set info
        this._allDfInfo = newInfo;
        this.notifyObservers();
    }

    public setAllDfStyle(newStyle: IDFStyleAll) {
        this._allDfStyle = newStyle;
        this.notifyObservers();
    }

    public setAllDfSeq(newSeq: string[]) {
        this._allDfSeq = newSeq;
        this.notifyObservers();
    }

    // public setSelectedDFName(dfName: string) {
    //     this._selectedDFName = dfName;
    //     this.notifyObservers();
    // }

    private setPreviewItems(newItems: IPreviewItems) {
        this._previewItems = newItems;
        this.notifyObservers();
    }

    public resetPreviewItems() {
        this.setPreviewItems({
            newColumns: {},
            newTables: {},
            op: null
        });
    }

    /**
     * connectNotebook: connect to a notebook, assumes the notebook connection is ready but might not have valid connection
     * @param notebook notebook connection 
     * @param widgetIsVisible function that says if AP is visible to user
     */
    public async connectNotebook(notebook: NBApi, widgetIsVisible: () => boolean) {
        this._notebook = notebook;
        // this._widgetIsVisible = widgetIsVisible
        // this.resetData();
        this.executor.setSession(notebook.panel?.sessionContext);

        if (this.notebook.hasConnection) {
            await this.executor.session.ready;

            // this._name.set(this.executor.session.name)
            // this._language.set(this.notebook.language)
            // have to do this as arrow function or else this doesnt work
            this._notebook.changed.connect((sender, value) => {
                // when cell is run, update data
                if (value === 'cellRun') {
                    // if (this._widgetIsVisible()) {
                        this.updateRootData();
                    // }
                } 
                // else if (value === "name") {
                //     this.name.set(this._notebook.name)
                // } 
                else if (value === "activeCell") {
                    // if (this._widgetIsVisible()) {
                        this.handleCellSelect()
                    // }
                } 
                // else if (value === "language changed") {
                //     // e.g. kernel changes from Julia to Python
                //     this.language.set(this._notebook.language)
                //     this.resetData();
                //     if (this._widgetIsVisible()) {
                //         this.updateRootData();
                //     }
                // }
            });
            this.listenForRestart();
            this._ready = true; // this.ready.set(true);
            // if (this._widgetIsVisible()) {
                this.updateRootData();
            // }

        } else {
            this._ready = false; // this.ready.set(false);
            // this.name.set(undefined)
        }

    }

    public async listenForRestart() {
      const scon = this.executor.session.session;
      if (!scon) {
        throw new Error("[ProfileModel] Session not connected");
      }
      const knl = scon.kernel;
      if (!knl) {
        throw new Error("[ProfileModel] Kernel not connected");
      }

      knl.statusChanged.connect((_, status) => {
          if (status.endsWith('restarting')) {
            // console.log("[ProfileModel] Kernel restarting");
              // this.resetData();
          }
      });
    }

    // public resetData() {
    //     this._columnProfiles.set(undefined);
    // }

    // public addCell(kind: 'code' | 'markdown', text: string) {
    //     if (this.notebook) {
    //         this.notebook.addCell(kind, text);
    //     }
    // }

    /** 
     * Called when widget is shown.
     * Does not check if notebook is visible because visible flag set after update happens
    **/
    public updateAll() {
        this.updateRootData()
        this.handleCellSelect()
    }

    /**
     * Fetch all data for UI, requires notebook to be python
    **/
    public async updateRootData() {
        if (this.notebook /*&& this.notebookIsPython()*/) {
            // this._loadingNewData.set(true)
            let alldf = await this.executor.getAllDataFrames(this.currentOutputName);
            this.setAllDfInfo(alldf); // Must call before reset preview items
            // Reset the cache
            this._valueCountsCache = {};
            this._histogramBinCache = {};
            this._rowSampleCache = {};
            this.resetPreviewItems();
            const promises: Promise<void>[] = [];
            for (const dfName of Object.keys(alldf)) {
                this._valueCountsCache[dfName] = {};
                this._histogramBinCache[dfName] = {};
                this._numColumnSampleCache[dfName] = {};
                const cInfo = alldf[dfName].columns;
                promises.push(
                    this.executor.getHeadTail(dfName).then((v: TDFRow[]) => {
                        this._rowSampleCache[dfName] = {
                            condition: null,
                            rows: v
                        };
                        // this.notifyObservers();
                    })
                );
                
                for (const colName of Object.keys(cInfo)) {
                    if (utils.isCateColumn(cInfo[colName].dtype)) {
                        promises.push(
                            this.executor.getCateValueCounts(dfName, colName).then((v: IValueCount[]) => {
                                this._valueCountsCache[dfName][colName] = v;
                                // this.notifyObservers();
                            })
                        );
                    } else if (utils.isNumColumn(cInfo[colName].dtype)) {
                        promises.push(
                            this.executor.getNumHistogram(dfName, colName).then((v: IHistogramBin[]) => {
                                this._histogramBinCache[dfName][colName] = v;
                                // this.notifyObservers();
                            })
                        );
                        promises.push(
                            this.executor.getNumColumnSample(dfName, colName).then((v: (number | string)[]) => {
                                this._numColumnSampleCache[dfName][colName] = v;
                                // this.notifyObservers();
                            })
                        );
                    } else {
                        console.warn(`[updateRootData] Unsupported column type ${cInfo[colName].dtype} for column ${colName}`);
                    }
                }
            }
            Promise.all(promises).then(() => {
                this.notifyObservers();
            });
        } else {
            // this._loadingNewData.set(false);
        }
    }

    private async handleCellSelect() {
    //   console.log("[ProfileModel] handleCellSelect");
      
        // if (this.notebookIsPython()) {
        //     const cellCode = this._notebook?.activeCell?.text
        //     let variablesInCell: string[] = []
        //     if (!(cellCode == undefined)) {
        //         variablesInCell = await this._executor.getVariableNamesInPythonStr(cellCode)
        //     }

        //     // determine which ones are actual dataframes
        //     const profiles = get(this.columnProfiles)
        //     if (profiles) {
        //         const dfNames = Object.keys(profiles)
        //         const dfNamesInSelection = variablesInCell.filter(value => dfNames.includes(value));
        //         this.variablesInCurrentCell.set(dfNamesInSelection)
        //     }
        // }
    }

    public async getCateValueCounts(dfName: string, colName: string) {
        let res: null | IValueCount[] = null;
        if ((this._valueCountsCache[dfName] !== undefined) && (this._valueCountsCache[dfName][colName] !== undefined)) {
            res = this._valueCountsCache[dfName][colName];            
        } else {
            res = await this.executor.getCateValueCounts(dfName, colName);
            if (this._valueCountsCache[dfName] === undefined) {
                this._valueCountsCache[dfName] = {};
            }
            this._valueCountsCache[dfName][colName] = res;            
        }
        this.notifyObservers();
        return res;
    }

    public async getRowSampleOfOneDf(dfName: string, condition: IDfCondAll | null) {
        if (condition === null) {
            const rows = await this.executor.getHeadTail(dfName);
            this.rowSampleCache[dfName] = {condition, rows};
        } else {
            const rows = await this.executor.getRowSampleOfOneDf(dfName, condition);
            this.rowSampleCache[dfName] = {condition, rows};
        }
        this.notifyObservers();
    }

    public async previewColumnFillna(fillnaTemp: IFillnaParam) {
        const { table, column, fillValue, newColumn } = fillnaTemp;
        const { newList, meta } = await this.executor.exeFillna(table, column, fillValue);
        const newPreviewItems: IPreviewItems = {
            newColumns: {},
            newTables: {},
            op: "column_fillna"
        };
        newPreviewItems.newColumns[table] = {};
        newPreviewItems.newColumns[table][column] = {
            newColumn: newColumn,
            colMeta: meta,
            sample: newList
        };
        this.setPreviewItems(newPreviewItems);
    }

    public async previewColumnRename(columnRenameTemp: IColumnRenameParam) {
        const { table, oldColName, newColName } = columnRenameTemp;
        const { newList, meta } = await this.executor.exeColumnRename(table, oldColName, newColName);
        const newPreviewItems: IPreviewItems = {
            newColumns: {},
            newTables: {},
            op: "column_rename"
        };
        newPreviewItems.newColumns[table] = {};
        newPreviewItems.newColumns[table][oldColName] = {
            newColumn: newColName,
            colMeta: meta,
            sample: newList
        };
        this.setPreviewItems(newPreviewItems);
    }

    public async previewStrReplace(strReplaceTemp: IStrReplaceParam) {
        const { table, column, oldPattern, newValue, newColumn } = strReplaceTemp;
        const rows = this._rowSampleCache[table].rows;
        const columnCells: (string | null)[] = rows.map(row => row[column]) as (string | null)[];
        const newList = await this.executor.exeStrReplace(columnCells, oldPattern, newValue);
        const meta = await this.executor.exeStrReplaceMeta(table, column, oldPattern, newValue);        
        const newPreviewItems: IPreviewItems = {
            newColumns: {},
            newTables: {},
            op: "str_replace"
        }; // @TODO: init or clone old?
        if (newPreviewItems.newColumns[table] === undefined) {
            newPreviewItems.newColumns[table] = {};
        }
        newPreviewItems.newColumns[table][column] = {
            newColumn: newColumn,
            colMeta: meta,
            sample: newList
        }
        this.setPreviewItems(newPreviewItems);
    }

    public async previewTableConcat(tableConcatParam: ITableConcatParam) {
        const { tables, newTable } = tableConcatParam;
        const newPreviewItems: IPreviewItems = {
            newColumns: {},
            newTables: {},
            op: "table_concat"
        }
        tables.forEach(table => {
            newPreviewItems.newTables[table] = {
                newTable: newTable,
                dfMeta: _.cloneDeep(this._allDfInfo[table]),
                rows: [],
                isInSituIfSameTable: true,
                histograms: _.cloneDeep(this._histogramBinCache[table]),
                condValues: null
            }
        });
        this.setPreviewItems(newPreviewItems);
    }

    public async previewColumnSelect(columnSelectTemp: IColumnSelectParam) {
        const { table, columns, newTable } = columnSelectTemp;
        if (table === newTable) {
            this.resetPreviewItems();
            return;
        }
        const newPreviewItems: IPreviewItems = {
            newColumns: {},
            newTables: {},
            op: "column_select"
        };
        // filter dfMeta
        const oriDfMeta = this._allDfInfo[table];
        const newDfMeta: IDFInfo = {
            tableName: newTable,
            python_id: "",
            numRows: oriDfMeta.numRows,
            numCols: columns.length,
            columnNameList: columns,
            columns: {}
        };
        columns.forEach(col => {
            newDfMeta.columns[col] = _.cloneDeep(oriDfMeta.columns[col]);
        });
        // filter rows
        const oriRows = this._rowSampleCache[table].rows;
        const newRows = oriRows.map(row => {
            const newRow: TDFRow = {};
            columns.forEach(col => {
                newRow[col] = row[col];
            });
            return newRow;
        });
        // filter histograms
        const oriHistograms = this._histogramBinCache[table];
        const newHistograms: {[colName: string]: IHistogramBin[]} = {};
        columns.forEach(col => {
            const colType = newDfMeta.columns[col].dtype;
            if (utils.isNumColumn(colType)) {
                newHistograms[col] = _.cloneDeep(oriHistograms[col]);
            }
        });

        newPreviewItems.newTables[table] = {
            newTable: newTable,
            dfMeta: newDfMeta,
            rows: newRows,
            isInSituIfSameTable: true,
            histograms: newHistograms,
            condValues: null
        };        
        this.setPreviewItems(newPreviewItems);
    }

    public async previewTableFilter(tableFilterParam: ITableFilterParam) {
        const { table, newTable, cond, condValues } = tableFilterParam;
        const { success, resRows, resMeta, histograms } = await this.executor.exeTableFilter(table, cond, newTable);
        if (!success) {
            return;
        }
        const newPreviewItems: IPreviewItems = {
            newColumns: {},
            newTables: {},
            op: "table_filter"
        };
        newPreviewItems.newTables[table] = {
            newTable: newTable,
            dfMeta: resMeta,
            rows: resRows,
            isInSituIfSameTable: true,
            histograms: histograms,
            condValues: condValues
        };
        this.setPreviewItems(newPreviewItems);
    }

    public async previewTableSort(tableSortParam: ITableSortParam) {
        const { table, newTable, sortCols, asc } = tableSortParam;
        // broadcast asc
        const realAsc: boolean[] = _.cloneDeep(asc);
        if (sortCols.length !== asc.length) {
            if (realAsc.length === 0) {
                for (let i = 0; i < sortCols.length; i++) {
                    realAsc.push(true);
                }
            } else if (realAsc.length === 1) {
                for (let i = 1; i < sortCols.length; i++) {
                    realAsc.push(realAsc[0]);
                }
            } else {
                console.warn("[previewTableSort] Length of asc does not match length of sortCols");
                return;
            }
        }

        const { success, resRows, resMeta, histograms } = await this.executor.exeTableSort(table, sortCols, asc, newTable);
        if (!success) {
            return;
        }
        const newPreviewItems: IPreviewItems = {
            newColumns: {},
            newTables: {},
            op: "table_sort"
        };
        newPreviewItems.newTables[table] = {
            newTable: newTable,
            dfMeta: resMeta,
            rows: resRows,
            isInSituIfSameTable: false,
            histograms: histograms,
            condValues: null
        };
        this.setPreviewItems(newPreviewItems);
    }

    public async previewTableMerge(tableMergeParam: ITableMergeParam, allTableColumns: {[k: string]: string[];}) {
        const { leftTable, rightTable, newTable, leftCol, rightCol, how } = tableMergeParam;
        // Check if the column are null
        if ((leftCol === null && rightCol !== null) || (leftCol !== null && rightCol === null)) {
            console.warn("[previewTableMerge] One of the columns is null");
            return;
        }
        // Check if the column exists
        if (leftCol !== null && !allTableColumns[leftTable].includes(leftCol)) {
            console.warn(`[previewTableMerge] Column ${leftCol} does not exist in table ${leftTable}`);
            return;
        }
        if (rightCol !== null && !allTableColumns[rightTable].includes(rightCol)) {
            console.warn(`[previewTableMerge] Column ${rightCol} does not exist in table ${rightTable}`);
            return;
        }
        const { success, resRows, resMeta, histograms } = await this.executor.exeTableMerge(leftTable, rightTable, leftCol, rightCol, how, newTable);
        if (!success) {
            return;
        }
        const newPreviewItems: IPreviewItems = {
            newColumns: {},
            newTables: {},
            op: "table_merge"
        };
        const realTable = rightTable === newTable ? rightTable : leftTable;

        newPreviewItems.newTables[realTable] = {
            newTable: newTable,
            dfMeta: resMeta,
            rows: resRows,
            isInSituIfSameTable: false,
            histograms: histograms,
            condValues: null
        };
        this.setPreviewItems(newPreviewItems);
    
    }

    public async previewGroupby(groupbyParam: IGroupbyParam) {
        const { tableName, newTableName, groupbyCols, selectCols, aggFunc } = groupbyParam;

        const { success, resRows, resMeta, histograms } = await this.executor.exeGroupby(tableName, groupbyCols, selectCols, aggFunc, newTableName);
        if (!success) {
            return;
        }
        const newPreviewItems: IPreviewItems = {
            newColumns: {},
            newTables: {},
            op: "groupby"
        };
        newPreviewItems.newTables[tableName] = {
            newTable: newTableName,
            dfMeta: resMeta,
            rows: resRows,
            isInSituIfSameTable: false,
            histograms: histograms,
            condValues: null
        };
        this.setPreviewItems(newPreviewItems);    
    }

    public async previewColumnAdd(columnAddParam: IColumnComputeParam) {
        const { table, column, operator, addedColumns} = columnAddParam;
        if (addedColumns.length === 0) {
            return;
        }
        const lastAddedColumn = addedColumns[addedColumns.length - 1];

        const { newList, meta } = await this.executor.exeColumnAdd(table, column, operator, addedColumns);
        const newPreviewItems: IPreviewItems = {
            newColumns: {},
            newTables: {},
            op: "column_add"
        };
        newPreviewItems.newColumns[table] = {};
        newPreviewItems.newColumns[table][lastAddedColumn] = {
            newColumn: column,
            colMeta: meta,
            sample: newList
        };
        this.setPreviewItems(newPreviewItems);  
    }
}
