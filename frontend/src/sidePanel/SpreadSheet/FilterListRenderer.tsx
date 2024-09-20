import React from "react";

import { IColMode, IDfCondAll, IDFInfoAll, IRowSampleCache, IValueCount, IValueCountCache } from "../interface";
import * as constant from "../../constant";
import * as utils from "../../utils";
import { ReactStore } from "../Wrapper/SidePanelReactStore";
import { MultiSelectIcon } from "../Icons/MultiSelectIcon";
import _ from "lodash";
import { FgetRowSampleOfOneDf } from "../interfaceFunc";
import { CateItem } from "../Metadata/CateItem";
import RangeFilter from "./RangeFilter";


interface IProps {
  dfName: string;
  colName: string;
  selectCond: IDfCondAll | null;
  allColMode: IColMode;
  allDfInfo: IDFInfoAll;
  valueCounts: IValueCountCache;
  rowSampleCache: IRowSampleCache;
  getRowSampleOfOneDf: FgetRowSampleOfOneDf;
}

interface IState {
}


export class FilterListRenderer extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
    };
    this.onsearchCateItem = this.onsearchCateItem.bind(this);
    this.onCateSelectIconClick = this.onCateSelectIconClick.bind(this);
    this.onMultiSelectIconClick = this.onMultiSelectIconClick.bind(this);
    this.renderMutilFilter = this.renderMutilFilter.bind(this);
    this.renderCateItemList = this.renderCateItemList.bind(this);
    this.onNumRangeSelectIconClick = this.onNumRangeSelectIconClick.bind(this);
  }

  static contextType = ReactStore;
  context!: React.ContextType<typeof ReactStore>;

  onsearchCateItem(e: React.FormEvent<HTMLInputElement>, dfName: string, colName: string) {
    // Read input value
    e.stopPropagation();
    const inputText = e.currentTarget.value;
    const newAllDfCateColItemSearch = {...this.context.allDfCateColItemSearch};
    if (newAllDfCateColItemSearch[dfName] === undefined) {
      newAllDfCateColItemSearch[dfName] = {};
    }
    newAllDfCateColItemSearch[dfName][colName] = inputText;
    this.context.setAllDfCateColItemSearch(newAllDfCateColItemSearch);
  }

  async onMultiSelectIconClick(e: React.MouseEvent, dfName: string, colName: string) {
    e.stopPropagation();
    const dfCache = this.props.rowSampleCache[dfName];
    const vc = this.props.valueCounts[dfName];
    if (dfCache === undefined || vc === undefined) {
      console.warn("[onMultiSelectIconClick] rowSampleCache is undefined or valueCounts is undefined.");
      return;
    }
    let newCond = _.cloneDeep(dfCache.condition);
    
    if (newCond === null) { // previously, full table is selected
      newCond = {
        [colName]: {
          dfName, colName,
          cateSelect: [], // empty array means select nothing
          rangeSelect: null // don't care
        }
      };
      await this.props.getRowSampleOfOneDf(dfName, newCond);
      return;
    } else if (newCond[colName] === undefined) { // previously, we select all values of this column
      newCond[colName] = {
        dfName, colName,
        cateSelect: [], // empty array means select nothing
        rangeSelect: null // don't care
      };
      await this.props.getRowSampleOfOneDf(dfName, newCond);
      return;
    }
    const newCondCol = newCond[colName];
    if (newCondCol.cateSelect === null || newCondCol.cateSelect.length === vc[colName].length) { // previously, we select all values of this column
      newCond[colName].cateSelect = []; // empty array means select nothing      
    } else {// previously, we select some values of this column
      newCond[colName].cateSelect = null;
    }
    console.log("[onCateSelectIconClick] newAllDfRowSelect:", newCond);
    await this.props.getRowSampleOfOneDf(dfName, newCond);
  }

  async onNumRangeSelectIconClick(e: React.MouseEvent, dfName: string, colName: string, lowerBundle: number, upperBundle: number) {
    e.stopPropagation();

    const startOpen = false;//闭区间
    const endOpen = false;//闭区间 

    const dfCache = this.props.rowSampleCache[dfName];
    const vc = this.props.valueCounts[dfName];
    if (dfCache === undefined || vc === undefined) {
      console.warn("[onNumRangeSelectIconClick] rowSampleCache is undefined or valueCounts is undefined.");
      return;
    }
    let newCond = _.cloneDeep(dfCache.condition);

    if (newCond === null) { // previously, full table is selected
      newCond = {
        [colName]: {
          dfName, colName,
          cateSelect: null,// don't care
          rangeSelect: [{startOpen: startOpen, endOpen: endOpen, start: lowerBundle, end: upperBundle}] 
        }
      };
    } else if (newCond[colName] === undefined) { // previously, we select all values of this column
      newCond[colName] = {
        dfName, colName,
        cateSelect: null,// don't care
        rangeSelect: [{startOpen: startOpen, endOpen: endOpen, start: lowerBundle, end: upperBundle}] 
      };
    }

    const newCondCol = newCond[colName];
    if (newCondCol.rangeSelect === null) { // previously, we select all values of this column
      newCondCol.rangeSelect = [{startOpen: startOpen, endOpen: endOpen, start: lowerBundle, end: upperBundle}]
    } else {// previously, we select some values of this column
      newCondCol.rangeSelect = [{startOpen: startOpen, endOpen: endOpen, start: lowerBundle, end: upperBundle}]
    }
    console.log("[onNumRangeSelectIconClick] newAllDfRowSelect:", newCond);
    await this.props.getRowSampleOfOneDf(dfName, newCond);
  }

  async onCateSelectIconClick(e: React.MouseEvent, dfName: string, colName: string, cate: number | string) {
    e.stopPropagation();
    const dfCache = this.props.rowSampleCache[dfName];
    const vc = this.props.valueCounts[dfName];
    if (dfCache === undefined || vc === undefined) {
      console.warn("[onCateSelectIconClick] rowSampleCache is undefined or valueCounts is undefined.");
      return;
    }
    let newCond = _.cloneDeep(dfCache.condition);

    if (newCond === null) { // previously, full table is selected
      newCond = {
        [colName]: {
          dfName, colName,
          cateSelect: vc[colName].map(v => v.value).filter(v => v !== cate), // exclude the selected value
          rangeSelect: null // don't care
        }
      };
    } else if (newCond[colName] === undefined) { // previously, we select all values of this column
      newCond[colName] = {
        dfName, colName,
        cateSelect: vc[colName].map(v => v.value).filter(v => v !== cate), // exclude the selected value
        rangeSelect: null // don't care
      };
    }

    const newCondCol = newCond[colName];
    if (newCondCol.cateSelect === null) { // previously, we select all values of this column
      newCondCol.cateSelect = vc[colName].map(v => v.value).filter(v => v !== cate); // exclude the selected value
    } else {// previously, we select some values of this column
      newCondCol.cateSelect = newCondCol.cateSelect.filter((v) => v !== cate); // exclude the selected value
    }
    console.log("[onCateSelectIconClick] newAllDfRowSelect:", newCond);
    await this.props.getRowSampleOfOneDf(dfName, newCond);
  }

  renderMutilFilter(dfName: string, colName: string) {
    let allSelect = false;
    const rc = this.props.rowSampleCache[dfName];
    const vc = this.props.valueCounts[dfName];
    if (rc === undefined || vc === undefined) {
      console.warn("[renderMutilFilter] valueCounts is undefined.");
      allSelect = true;
    } else if (rc.condition === null) {
      allSelect = true;
    } else if (rc.condition[colName] === undefined){
      allSelect = true;
    } else if (rc.condition[colName].cateSelect === null){
      allSelect = true;
    } else if (rc.condition[colName].cateSelect?.length === vc[colName].length) {
      allSelect = true;
    }
    
    return (
      <div className="xavier-mv-col">
        <div className="xavier-mct-wrapper">
          {/* <div className="xavier-mdt-icon-wrapper xavier-mdt-icon-placeholder"></div> */}
          <MultiSelectIcon  status={allSelect ? "full" : "empty"}
            handleIconClick={(e) => this.onMultiSelectIconClick(e, dfName, colName) } />
          <div className="xavier-mct-name-wrapper" style={{width: "calc(100% - 2 * var(--xavier-icon-width))"}}>
            <div className="xavier-mct-name">
              Select all columns
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderCateItemList(dfName: string, colName: string, itemList: IValueCount[], cateSearch: string | undefined, cateSelect: (string | number)[] | null, isFilterValue: boolean) {
    
    if (cateSearch !== undefined) {
      itemList = itemList.filter((v) => {
        const itemV = String(v.value).toLowerCase();
        const searchV = cateSearch.toLowerCase();
        return itemV.includes(searchV);
      });
    }
    
    // console.log('cateSelect:',cateSelect);
    const cateItemDivList = itemList.map((v: IValueCount) => {
      
      const isSelect = cateSelect === null ? true : cateSelect.includes(String(v.value));
      return (
        <CateItem dfName={dfName}
                  colName={colName}
                  vc={v}
                  onCateSelectIconClick={this.onCateSelectIconClick}
                  // cateSearch={cateSearch}
                  // 默认显示
                  isFilterValue={true || isFilterValue}
                  isSelect={isSelect}
                  />
      )
    });

    return cateItemDivList;
  }

  render(): React.ReactNode {
    const dfName = this.props.dfName;
    const colName = this.props.colName;
    // const numRows = this.props.allDfInfo[dfName].numRows;
    // console.log('dfName:',dfName,'colName:',colName);
    // console.log(`allDfRowSelect[dfName] :${allDfRowSelect[dfName]}`);
    const cateSelect = (this.props.selectCond !== null) && (this.props.selectCond[colName] !== undefined) ? this.props.selectCond[colName].cateSelect : null;
    // console.log(`allDfRowSelect[dfName] :${allDfRowSelect[dfName]}. allDfRowSelect[dfName][colName] :${allDfRowSelect[dfName][colName]}. cateSelect :${cateSelect}`);
    const isFilterValue = this.props.allColMode[dfName][colName] === constant.ViewMode.FILTER_VALUE;
    
    const colInfoObj = this.props.allDfInfo[dfName].columns[colName];
    const isNumColumn = utils.isNumColumn(colInfoObj.dtype);
    const dfObj = this.props.valueCounts[dfName];
    const colObj = dfObj !== undefined ? dfObj[colName] : undefined;
    let itemList = colObj !== undefined ? colObj : [];
    const cateSearchDf = this.context.allDfCateColItemSearch[dfName];
    const cateSearch = cateSearchDf !== undefined ? cateSearchDf[colName] : undefined;
    // const isShowSelectIcon = _allDfMode[dfName] === constant.ViewMode.FILTER_COLUMN;

    //渲染数字列的过滤器
    let minValue = this.props.allDfInfo[dfName].columns[colName].minValue;
    let maxValue = this.props.allDfInfo[dfName].columns[colName].maxValue;
    
    const dfCache = this.props.rowSampleCache[dfName];
    if (dfCache !== undefined) {
      let cond = dfCache.condition;
      if(cond !== null) {
        const colCond = cond[colName];
        if(colCond !== null && colCond !== undefined) {
          if(colCond.rangeSelect !== null) {
            const rangeSelect = colCond.rangeSelect;
            minValue = rangeSelect[0].start;
            maxValue = rangeSelect[0].end;

          }

        }
      }
    }

    return (
      // onMouseLeave={() => setSearchInputActive(null)}
      <div className="xavier-mv-itemlist-wrapper" >
        {!isNumColumn && 
        <div className="xavier-mv-search-bar">
        <input  type="text" className="xavier-mv-search-input" value={cateSearch} placeholder="Search values..."
                onInput={(e) => this.onsearchCateItem(e, dfName, colName)}/>
        </div>}
        
        <div className="xavier-mv-cate-list">
          {!isNumColumn && true ? this.renderMutilFilter(dfName, colName) : null }
          {/* {默认显示}isShowSelectIcon */}
          {isNumColumn ? <RangeFilter dfName={dfName} colName={colName} minValue={Number(minValue)} maxValue={Number(maxValue) } onNumRangeSelectIconClick={this.onNumRangeSelectIconClick}></RangeFilter>
           : this.renderCateItemList(dfName, colName, itemList, cateSearch, cateSelect, isFilterValue)}
        </div>
      </div>
    )
  }
}