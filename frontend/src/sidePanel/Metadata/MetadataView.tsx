import React from "react";
import { IColMode, IDfColSelect, IDFInfoAll, IDFStyleAll, IHistogramBinCache, IPreviewItems, IRowSampleCache, IValueCount, IValueCountCache } from "../interface";
import { ReactStore } from "../Wrapper/SidePanelReactStore";
import _ from "lodash";
import * as constant from "../../constant";
import * as utils from "../../utils";
import { DFTitle } from "./DFTitle";
import { FgetRowSampleOfOneDf, FSetAllDfStyle } from "../interfaceFunc";
import { SSRenderer } from "../SpreadSheet/SSRenderer";
import SpreadSheet from "../SpreadSheet/SpreadSheet";

interface IProps {
  rowSampleCache: IRowSampleCache;
  isLive: boolean;
  allDfStyle: IDFStyleAll | null;
  allDfSeq: string[];
  previewItems: IPreviewItems;
  allDfInfo: IDFInfoAll;
  valueCounts: IValueCountCache;
  histogramBin: IHistogramBinCache;
  getCateValueCounts: (dfName: string, colName: string) => Promise<IValueCount[]>;
  getRowSampleOfOneDf: FgetRowSampleOfOneDf;
  setAllDfStyle: FSetAllDfStyle;
  // setSelectedDFName: FSetSelectedDFName;
}

interface IState {
  _allDfStyle: IDFStyleAll;
  // _allDfMode: IDfMode;
  _allColMode: IColMode;
  _canShowFloatSS: boolean;
}

export class MetadataView extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      _allDfStyle: initAllDfStyleForMV(props), // Control fold / unfold of DataFrame and columns
      // _allDfMode: initAllDfMode(props.allDfInfo),
      _allColMode: initAllColMode(props.allDfInfo),
      _canShowFloatSS: false,
    }
    this.onTitleClick = this.onTitleClick.bind(this);
    this.onUpdateDCIconClick = this.onUpdateDCIconClick.bind(this);
    // this.onFilterValueIconClick = this.onFilterValueIconClick.bind(this);
    this.dfFoldToggle = this.dfFoldToggle.bind(this);
    // this.columnFoldToggle = this.columnFoldToggle.bind(this);
    this.renderDfList = this.renderDfList.bind(this);
    this.onSampleBtnClick = this.onSampleBtnClick.bind(this);
  }

  static contextType = ReactStore;
  context!: React.ContextType<typeof ReactStore>;

  get realAllDfStyle(): IDFStyleAll {
    const s1 = this.props.allDfStyle;
    const s2 = this.state._allDfStyle;

    if (this.props.isLive && s1 === null) {
      console.warn("[realAllDfStyle] allDfStyle is null.");
      return s2;
    } else if (this.props.isLive && s1 !== null) {
      return s1;
    } else {
      return s2;
    }
  }

  get realAllDfSeq() {
    return this.props.isLive ? this.props.allDfSeq : Object.keys(this.props.allDfInfo);
  }

  onTitleClick(e: React.MouseEvent, dfName: string) {
    e.stopPropagation();
    // this.props.setSelectedDFName(dfName);
  }

  // columnFoldToggle(dfName: string, colName: string) {
  //   const newAllDfStyle = {...this.state._allDfStyle};
  //   const colObj = newAllDfStyle[dfName].columns[colName];
  //   colObj.isFold = !colObj.isFold;
  //   if (this.props.isLive) {
  //     this.props.setAllDfStyle(newAllDfStyle);
  //   } else {
  //     this.setState({
  //       _allDfStyle: newAllDfStyle
  //     });
  //   }
  // }

  dfFoldToggle(dfName: string) {
    const allDfStyle = { ...this.state._allDfStyle }; // Create a shallow copy
    allDfStyle[dfName].isFold = !allDfStyle[dfName].isFold;
    if (this.props.isLive) {
      this.props.setAllDfStyle(allDfStyle);
    } else {
      this.setState({
        _allDfStyle: allDfStyle
      });
    }
  }

  async onUpdateDCIconClick(e: React.MouseEvent, channel: "table" | "column", op: "add" | "remove" | "toggle", ctx: {dfName?: string, colName?: string}) {
    e.stopPropagation();
    if (op !== "toggle") {
      console.error("[onUpdateDCIconClick] Unsupported operation.");
      return;
    }

    if (channel === "table") {
      if (ctx.dfName === undefined) {
        console.error("[onUpdateDCIconClick] DataFrame name is not provided.");
        return;
      }
      this.dfFoldToggle(ctx.dfName);
    } else {
      // channel is column
      console.warn("[onUpdateDCIconClick] Column operation is not supported yet.");
      // if (ctx.dfName === undefined || ctx.colName === undefined) {
      //   console.error("[onUpdateDCIconClick] DataFrame name / Column name is not provided.");
      //   return;
      // }
      // const allDfInfo = this.props.allDfInfo;
      // const dtype = allDfInfo[ctx.dfName].columns[ctx.colName].dtype;
      // if (utils.isCateColumn(dtype)) {
      //   await this.props.getCateValueCounts(ctx.dfName, ctx.colName);
      // }
      // this.columnFoldToggle(ctx.dfName, ctx.colName);
    }
  }

  // onFilterValueIconClick(e: React.MouseEvent, dfName: string, colName: string) {
  //   e.stopPropagation();
  //   const colObj = this.state._allColMode[dfName][colName];
  //   const newAllColMode = {...this.state._allColMode};
  //   newAllColMode[dfName][colName] = (colObj === constant.ViewMode.INIT ? constant.ViewMode.FILTER_VALUE : constant.ViewMode.INIT);
  //   this.setState({
  //     _allColMode: newAllColMode
  //   });
  // }

  onSampleBtnClick(dfName: string) {
    const newAllDfStyle = _.cloneDeep<IDFStyleAll>(this.realAllDfStyle);
    newAllDfStyle[dfName].isShowRows = !newAllDfStyle[dfName].isShowRows;
    this.props.setAllDfStyle(newAllDfStyle);
  }

  canRenderExtraTablePreview(): {yes: boolean, newDfName: string | null} {
    // Must support multi schema
    const cond1 = utils.isSupportMultiSchemaOp(this.props.previewItems.op);
    if (!cond1) {
      return { yes: false, newDfName: null };
    }
    // Must exist new tables
    const nt = this.props.previewItems.newTables;
    const tbs = Object.keys(nt);
    if (tbs.length === 0) {
      return { yes: false, newDfName: null };
    }
    // Must have new table
    const newTableName = nt[tbs[0]].newTable; // @TODO: we assume that there is only one new table
    const allDfInfo = this.props.allDfInfo;
    if (!(newTableName in allDfInfo)) {
      return { yes: true, newDfName: newTableName };
    }
    return { yes: false, newDfName: null };
  }

  renderExtraTablePreview() {
    const { yes, newDfName } = this.canRenderExtraTablePreview();
    if (!yes || !newDfName) {
      return null;
    }
    const {num_rows, num_cols} = utils.calcPreviewRowsCols(this.props.previewItems.newTables);

    return (
      <div className="xavier-mv-df">
        <DFTitle  dfName={newDfName}
                  numRows={num_rows}
                  numCols={num_cols}
                  isFold={false} />
        <SpreadSheet name={"table-view-ss-preview-" + newDfName}
                            header={[]}
                            table={[]}
                            maxHeight={constant.SSMaxHeight}
                            alternateColor={constant.SSAlternateColor}
                            cellMaxWidth={constant.SSCellMaxWidth}
                            cellMinWidth={constant.SSCellMaxWidth}
                            tableRowHeight={constant.SSTableRowHeight}
                            headerFontSize={12}
                            tableFontSize={12}
                            overflowOption={"hidden"}

                            onlyPreviewSchema={true}
                            dfName = {newDfName}
                            selectCond={null}
                            valueCounts = {this.props.valueCounts}
                            rowSampleCache={this.props.rowSampleCache}
                            setAllDfStyle={this.props.setAllDfStyle}
                            getRowSampleOfOneDf={this.props.getRowSampleOfOneDf}
                            
                            previewItems={this.props.previewItems}/>
      </div>
    );
  }

  renderDfList() {
    const allDfInfo = this.props.allDfInfo;
    const allDfStyle = this.realAllDfStyle;
    const dfNameList = this.realAllDfSeq;
    const op = this.props.previewItems.op;
    const nt = this.props.previewItems.newTables;

    const extraPreview = this.renderExtraTablePreview();
    return (
      <div className="xavier-mv-df-list">
        {dfNameList.map((v: string) => {
          let num_rows = allDfInfo[v].numRows;
          let num_cols = allDfInfo[v].numCols;
          const yes_fold = this.realAllDfStyle[v].isFold;


          let oldNumRows: number | undefined = undefined;
          let oldNumCols: number | undefined = undefined;
          const tables = Object.keys(nt);
          if (utils.isSupportMultiSchemaOp(op) && tables.length > 0 && tables.every(t => nt[t].isInSituIfSameTable) && nt[tables[0]].newTable === v) {
            // Four conditions:
            // 1. Support multi schema operation
            // 2. There are new tables
            // 3. All new tables are in situ
            // 4. The new table is the current table (We assume that there is only one new table)
            oldNumRows = num_rows;
            oldNumCols = num_cols;
            const cprc = utils.calcPreviewRowsCols(nt);
            num_rows = cprc.num_rows;
            num_cols = cprc.num_cols;
          }

          const SSRenderDiv = (
            allDfStyle[v].isFold ? null : 
            <SSRenderer dfName={v}
                        allDfInfo={allDfInfo}
                        allDfStyle={this.realAllDfStyle}
                        allColMode={this.state._allColMode}
                        histogramBin={this.props.histogramBin}
                        valueCounts={this.props.valueCounts}
                        rowSampleCache={this.props.rowSampleCache}
                        previewItems={this.props.previewItems}
                        setAllDfStyle={this.props.setAllDfStyle}
                        getRowSampleOfOneDf={this.props.getRowSampleOfOneDf}
                        onSampleBtnClick={this.onSampleBtnClick} />
          )

          return <div className="xavier-mv-df" key={"xavier-df-"+v}>
            <DFTitle  dfName={v}
                      numRows={num_rows}
                      numCols={num_cols}
                      oldNumRows={oldNumRows}
                      oldNumCols={oldNumCols}
                      isFold={yes_fold}
                      onUpdateDCIconClick={this.onUpdateDCIconClick}
                      onTitleClick={this.onTitleClick} />
            {SSRenderDiv}
          </div>
        })}
        {extraPreview}
      </div>
    );
  }

  componentWillReceiveProps(nextProps: Readonly<IProps>, nextContext: any): void {
    if (nextProps.allDfInfo !== this.props.allDfInfo) {
      const newDfStyle = initAllDfStyleForMV(nextProps, this.state._allDfStyle);
      // const newDfMode = initAllDfMode(nextProps.allDfInfo);
      const newColMode = initAllColMode(nextProps.allDfInfo);
      const newDfColSelect = initAllDfColSelect(nextProps.allDfInfo);
      this.setState({
        _allDfStyle: newDfStyle,
        // _allDfMode: newDfMode,
        _allColMode: newColMode
      });
      this.context.setAllDfColSelect(newDfColSelect);
      this.context.setAllDfCateColItemSearch({});
    }
  }

  render() {
    return (
      <div className="xavier-metadata-view">
        {this.renderDfList()}
      </div>
    );
  }

};

// function initAllDfMode(allDfInfo: IDFInfoAll) {
//   const res: IDfMode = {};
//   for (const dfName in allDfInfo) {
//     res[dfName] = constant.ViewMode.INIT;
//   }
//   return res;
// }

function initAllColMode(allDfInfo: IDFInfoAll) {
  const res: IColMode = {};
  for (const dfName in allDfInfo) {
    res[dfName] = {};
    for (const colName of allDfInfo[dfName].columnNameList) {
      res[dfName][colName] = constant.ViewMode.INIT;
    }
  }
  return res;
}

function initAllDfColSelect(allDfInfo: IDFInfoAll) {
  const res: IDfColSelect = {};
  for (const dfName in allDfInfo) {
    res[dfName] = {};
    for (const colName of allDfInfo[dfName].columnNameList) {
      res[dfName][colName] = true;
    }
  }
  return res;
}

function initAllDfStyleForMV(nextProps: Readonly<IProps>, oldAllDfStyle: IDFStyleAll | undefined = undefined) {
  return (nextProps.isLive && nextProps.allDfStyle !== null) ? nextProps.allDfStyle : utils.initAllDfStyle(nextProps.allDfInfo, oldAllDfStyle);
}