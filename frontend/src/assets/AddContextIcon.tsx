import React from "react";

interface IProps {
  handleIconClick: (e: React.MouseEvent) => void;
  sign: "+" | "-";
};

interface IState {
  
};

export class AddContextIcon extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.onIconClick = this.onIconClick.bind(this);
  }

  onIconClick(e: React.MouseEvent) {
    e.stopPropagation();
    this.props.handleIconClick(e);
  }

  render() {
    return (
      <div  className="xavier-mdt-icon-wrapper" 
            onClick={this.onIconClick}>
        {this.props.sign === "+" ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.41665 6.41659V2.33325H7.58331V6.41659H11.6666V7.58325H7.58331V11.6666H6.41665V7.58325H2.33331V6.41659H6.41665Z" fill="#444444"/>
            </svg>
          ) : (
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1437" width="14" height="14">
              <path d="M170.666667 469.333333h682.666666v85.333334H170.666667z" fill="#444444" p-id="1438"></path>
            </svg>
          )
        }
      </div>
    )
  }
}