import React from "react";
import { IValueCount } from "../interface";
import { FOnCateSelectIconClick } from "../interfaceFunc";
import { MultiSelectIcon } from "../../assets/MultiSelectIcon";

interface IProps {
  dfName: string;
  colName: string;
  // numRows: number;
  vc: IValueCount;
  isFilterValue: boolean;
  isSelect: boolean;
  onCateSelectIconClick: FOnCateSelectIconClick;
}

interface IState {

}

export class CateItem extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
  }

  render(): React.ReactNode {
    const dfName = this.props.dfName;
    const colName = this.props.colName;
    // const cnt = this.props.vc.count;
    const val = this.props.vc.value;
    // const ratio = 100 * cnt / this.props.numRows;
    // const ratioStr = ratio < 0.1 ? `${cnt} (< 0.1%)` : `${cnt} (${ratio.toFixed(1)}%)`;

    const multiSelectIconDiv = this.props.isFilterValue ? (
      <MultiSelectIcon  status={this.props.isSelect ? "full" : "empty"} 
                        handleIconClick={(e) => this.props.onCateSelectIconClick(e, dfName, colName, val)} />
    ) : null;
    let iconWidthUnit = 0;
    iconWidthUnit += multiSelectIconDiv !== null ? 1 : 0;
    return (
      <div className="xavier-mv-cate" key={`xavier-${dfName}-${colName}-${val}`}>
        {multiSelectIconDiv}
        <div  className="xavier-mct-name xavier-mv-cate-value"
              style={{
                width: `calc(70% - 5px - ${iconWidthUnit} * var(--xavier-icon-width))`
              }} >
          {val}
        </div>
        {/* <div className="xavier-mct-histogram xavier-mv-cate-hist">
          <div  className="xavier-mct-histogram-rect"
                style={{ width: `${ratio}%`}}>
          </div>
          <div className="xavier-mct-histogram-text xavier-mv-cate-str">{ratioStr}</div>
        </div> */}
      </div>
    )
  } 
}