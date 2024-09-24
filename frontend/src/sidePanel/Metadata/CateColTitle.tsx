import React from "react";

// import { MultiSelectIcon } from "../Icons/MultiSelectIcon";
// import { ViewMode } from "../../constant";

interface IProps {
  dfName: string;
  colName: string;
  nullCount: number;
  cardinality: number;
  numRows: number;
  // _itemValue: string;
  // if_highLight: boolean;
  basicPx?: number;
}

interface IState {

}

export class CateColTitle extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
  }

  get realBasicPx(): number {
    return this.props.basicPx === undefined ? 2 : this.props.basicPx;
  }

  render(): React.ReactNode {
    // const isShowSelectIcon = this.props.dfMode === ViewMode.FILTER_COLUMN;
    // // const nullPercent = this.props.nullCount / this.props.numRows * 100;
    // // let percentage_str = `${nullPercent.toFixed(1)}%`;
    // const dfName = this.props.dfName;
    // const colName = this.props.colName;
    // const multiSelectIconDiv = isShowSelectIcon ? (
    //   <MultiSelectIcon  status={this.props.isColSelect ? "full" : "empty"}
    //                     handleIconClick={(e) => this.props.onColSelectIconClick(e, dfName, colName) } />
    // ) : null;
    // let iconWidthUnit = 1;
    // iconWidthUnit += multiSelectIconDiv === null ? 0 : 1;
    // iconWidthUnit += filterValueIconDiv === null ? 0 : 1;

    return (
      <div className="xavier-mct-wrapper">
        {/*
        {multiSelectIconDiv}
        {filterValueIconDiv} */}
        {/* <div  className="xavier-mct-name-wrapper"
              style={{width: `calc(100% - ${iconWidthUnit} * var(--xavier-icon-width))` }}> */}
          {/* <div className="xavier-mct-name">
            {this.props.colName}
          </div> */}
          <div className="xavier-mct-histogram" style={{width:'100%'}}>
            {/* {highLight === false ? ( */}
              <div  className="xavier-mct-histogram-rect"
                    style={{
                      width: `${100 * this.props.cardinality / this.props.numRows}%`,
                      minWidth: `${this.props.cardinality === 0 ? 0 : this.realBasicPx}px`,
                    }}></div>
            <div className="xavier-mct-histogram-text">|{this.props.cardinality}|</div>
          </div>
        </div>
      // </div>
    )
  }
};