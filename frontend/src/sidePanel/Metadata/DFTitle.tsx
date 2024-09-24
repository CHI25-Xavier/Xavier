import React from "react";
import { AddContextIcon } from "../../assets/AddContextIcon";
import { FOnTitleClick, FOnUpdateDCIconClick } from "../interfaceFunc";


interface IProps {
  dfName: string;
  numRows: number;
  numCols: number;
  isFold: boolean;
  oldNumRows?: number;
  oldNumCols?: number;
  onUpdateDCIconClick?: FOnUpdateDCIconClick;
  onTitleClick?: FOnTitleClick;
}

interface IState {

}

export class DFTitle extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.iconClickHandler = this.iconClickHandler.bind(this);
    this.titleClickHandler = this.titleClickHandler.bind(this);
  }

  iconClickHandler(e: React.MouseEvent<Element, MouseEvent>) {
    if (this.props.onUpdateDCIconClick === undefined) {
      return;
    }
    this.props.onUpdateDCIconClick(e, "table", "toggle", {dfName: this.props.dfName});
  }

  titleClickHandler(e: React.MouseEvent<Element, MouseEvent>) {
    if (this.props.onTitleClick === undefined) {
      return;
    }
    this.props.onTitleClick(e, this.props.dfName);
  }

  render(): React.ReactNode {
    const oldShapeStr = `${this.props.oldNumRows} × ${this.props.oldNumCols}`
    const curShapeStr = `${this.props.numRows} × ${this.props.numCols}`
    const shapeStr = (this.props.oldNumRows === undefined || this.props.oldNumCols === undefined) ? curShapeStr : `${oldShapeStr} -> ${curShapeStr}`;
    const addSign = this.props.isFold ? "+" : "-";
    
    return (
      <div  className="xavier-mdt-wrapper">
        <AddContextIcon handleIconClick={this.iconClickHandler}
                        sign={addSign}/>
        <div  className="xavier-mdt-name-wrapper"
              style={{width: `calc(100% - var(--xavier-icon-width))`}}
              onClick={this.titleClickHandler}>
          <div className="xavier-mdt-name">
            {this.props.dfName}
          </div>
          <div className="xavier-mdt-shape" style={{
            color: shapeStr.includes("NaN") ? "red" : "#000"
          }}>
            {shapeStr}
          </div>
        </div>
      </div>
    );
  }
}