import React from "react";
import _ from "lodash";

import { IColMode, IColStyleAll, IDfColSelect, IDFInfoAll, IDFStyle, IDFStyleAll, IHistogramBinCache, IPreviewItems, IRowSampleCache, IValueCountCache, TCellValue, TDFRow } from "../interface";
import SpreadSheet from "./SpreadSheet";
import * as utils from "../../utils";
import * as constant from "../../constant";
import { ReactStore } from "../Wrapper/SidePanelReactStore";
import { FgetRowSampleOfOneDf, FOnSampleBtnClick, FSetAllDfStyle } from "../interfaceFunc";
import { DFTitle } from "../Metadata/DFTitle";

interface IProps {
  dfName: string;
  allDfInfo: IDFInfoAll;
  allDfStyle: IDFStyleAll;
  allColMode: IColMode;
  histogramBin: IHistogramBinCache;
  valueCounts: IValueCountCache;
  rowSampleCache: IRowSampleCache;
  previewItems: IPreviewItems;

  setAllDfStyle: FSetAllDfStyle;
  getRowSampleOfOneDf: FgetRowSampleOfOneDf;
  onSampleBtnClick: FOnSampleBtnClick;
}

interface IState {

}

export class SSRenderer extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {

    };

    // this.onColSelectIconClick = this.onColSelectIconClick.bind(this);
    this.arrJsonTo2DArray = this.arrJsonTo2DArray.bind(this);
    this.needRenderNewTable = this.needRenderNewTable.bind(this);
    this.renderPreviewNewTable = this.renderPreviewNewTable.bind(this);
  }

  static contextType = ReactStore;
  context!: React.ContextType<typeof ReactStore>;

  arrJsonTo2DArray(dfName: string, arr: TDFRow[], header: string[]): TCellValue[][] {
    let res: TCellValue[][] = [];
    for (let i = 0; i < arr.length; i++) {
      let row = arr[i];
      let rowArr: TCellValue[] = [];
      for (let j = 0; j < header.length; j++) {
        let colName = header[j];
        if (this.context.allDfColSelect[dfName][colName] === false) {
          continue;
        }
        rowArr.push(row[colName]);
      }
      res.push(rowArr);
    }
    return res;
  }

  // onColSelectIconClick(e: React.MouseEvent, dfName: string, colName: string) {
  //   e.stopPropagation();
  //   const newAllDfColSelect = {...this.context.allDfColSelect};
  //   newAllDfColSelect[dfName][colName] = !newAllDfColSelect[dfName][colName];
  //   this.context.setAllDfColSelect(newAllDfColSelect);    
  // }

  needRenderNewTable() {
    const dfName = this.props.dfName;
    const nt = this.props.previewItems.newTables;
    const op = this.props.previewItems.op;
    if ([null, "str_replace", "table_concat", "column_fillna", "column_add", "column_rename"].includes(op)) {
      return false;
    }
    return (nt[dfName] !== undefined) && (
      (nt[dfName].isInSituIfSameTable && nt[dfName].newTable !== dfName) ||
      (!nt[dfName].isInSituIfSameTable)
    );
  }

  renderPreviewNewTable() {
    const shouldRender = this.needRenderNewTable();
    if (!shouldRender) {
      return null;
    }

    const dfName = this.props.dfName;
    const nt = this.props.previewItems.newTables;
    const newDfName = nt[dfName].newTable;
    const newDfHeader = nt[dfName].dfMeta.columnNameList;
    
    const newDfTable = utils.dfRows2SSRows(nt[dfName].rows, newDfHeader, false);
    const newAllDfInfo = {
      [newDfName]: nt[dfName].dfMeta
    };
    const dfStyleColumns: IColStyleAll = {};
    newDfHeader.forEach((colName) => {
      dfStyleColumns[colName] = {
        colName: colName,
        isHighlight: false
      };
    });
    const newDfStyle: IDFStyle = {
      tableName: newDfName,
      isFold: false,
      isShowRows: true,
      columns: dfStyleColumns
    };

    const newColModes: {[colName: string]: number} = {};
    newDfHeader.forEach((colName) => {
      newColModes[colName] = constant.ViewMode.INIT;
    });
    const newAllColMode = {
      [newDfName]: newColModes
    }

    const newAllDfColSelect: IDfColSelect = {
      [newDfName]: {}
    }
    newDfHeader.forEach((colName) => {
      newAllDfColSelect[newDfName][colName] = true;
    });

    const newHistogramBin: IHistogramBinCache = {
      [newDfName]: nt[dfName].histograms
    };

    const newDfTitle = (
      <DFTitle  dfName={`Preview: ${newDfName}`}
                numRows={nt[dfName].dfMeta.numRows}
                numCols={nt[dfName].dfMeta.numCols}
                isFold={false}
      />
    )

    const newTableDiv = (
      <SpreadSheet  name={"ss-renderer-preview-" + newDfName}
                    header={newDfHeader}
                    table={newDfTable}
                    maxHeight={constant.SSMaxHeight}
                    alternateColor={constant.SSAlternateColor}
                    cellMaxWidth={constant.SSCellMaxWidth}
                    cellMinWidth={constant.SSCellMaxWidth}
                    tableRowHeight={constant.SSTableRowHeight}
                    headerFontSize={12}
                    tableFontSize={12}
                    overflowOption={"hidden"}
                    rowSampleCache={this.props.rowSampleCache}
                    allDfInfo={newAllDfInfo}
                    dfName = {newDfName}
                    selectCond={null}
                    dfStyle = {newDfStyle}
                    histogramBin = {newHistogramBin}
                    _allColMode = {newAllColMode}
                    valueCounts = {this.props.valueCounts}
                    setAllDfStyle={this.props.setAllDfStyle}
                    getRowSampleOfOneDf={this.props.getRowSampleOfOneDf}
                    />)
    return (
      <>
        {newDfTitle}
        {newTableDiv}
      </>
    );
  }

  render(): React.ReactNode {
    const dfName = this.props.dfName;
    const shownDF = this.props.allDfInfo[dfName];
    const header1D = shownDF.columnNameList;
    const rows = this.props.rowSampleCache[dfName] !== undefined ? this.props.rowSampleCache[dfName].rows : [];
    const selectedCond = this.props.rowSampleCache[dfName] !== undefined ? this.props.rowSampleCache[dfName].condition : null;
    const table2D = this.arrJsonTo2DArray(dfName, rows, header1D);

    return (
      <div  className="xavier-ss-wrapper"
            id={`xavier-ss-wrapper-${dfName}`} >
          <SpreadSheet  name={"ss-renderer" + dfName}
                        header={header1D}
                        table={table2D}
                        maxHeight={constant.SSMaxHeight}
                        alternateColor={constant.SSAlternateColor}
                        cellMaxWidth={constant.SSCellMaxWidth}
                        cellMinWidth={constant.SSCellMaxWidth}
                        tableRowHeight={constant.SSTableRowHeight}
                        headerFontSize={12}
                        tableFontSize={12}
                        overflowOption={"hidden"}
                        rowSampleCache={this.props.rowSampleCache}
                        allDfInfo={this.props.allDfInfo}
                        dfName = {dfName}
                        selectCond={selectedCond}
                        dfStyle = {this.props.allDfStyle[dfName]}
                        histogramBin = {this.props.histogramBin}
                        _allColMode = {this.props.allColMode}
                        valueCounts = {this.props.valueCounts}

                        setAllDfStyle={this.props.setAllDfStyle}
                        getRowSampleOfOneDf={this.props.getRowSampleOfOneDf}

                        previewItems={this.props.previewItems}
                        onSampleBtnClick={this.props.onSampleBtnClick}
                        />

          {this.renderPreviewNewTable()}
        </div>
    );
  }
}