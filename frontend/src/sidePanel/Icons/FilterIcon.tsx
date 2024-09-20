import React from "react";

interface IProps {
  handleIconClick: (e: React.MouseEvent) => void;
  status: boolean;
};

interface IState {

};

export class FilterIcon extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.handleIconClick = this.handleIconClick.bind(this);
  }

  handleIconClick(e: React.MouseEvent) {
    this.props.handleIconClick(e);
  }

  render() {
    return (
      <div  className="xavier-fci-wrapper"
            onClick={this.handleIconClick}>
        {this.props.status ? 
          (
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2323" width="14" height="14">
              <path d="M894 830l130 130-64 64-126-130-130 130-64-64 130-130-130-126 64-64 130 128 126-128 64 64zM704 64q40 0 58 34t-4 66L532 424q-20 20-20 44v236L312 886q-14 10-24 10-12 0-22-9t-10-23V468q0-26-18-44-64-74-114-130l-77-88-35-42q-22-32-4-66t56-34h640zM486 380l9-10 24-28 35-41 40-47q48-56 110-126H66l16 19 40 47 53 61 54 61 41 46 16 18q34 38 34 88v324l128-118V468q0-50 38-88z" p-id="2324" fill="#444444">
              </path>
            </svg>
          ) : (
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5249" width="14" height="14">
              <path d="M390.656 963.84c-5.632 0-11.008-1.536-15.616-4.864-7.68-5.12-12.544-14.08-12.544-23.296V419.072L79.872 107.264c-7.424-8.192-9.472-20.224-4.864-30.208 4.608-10.24 14.592-16.64 25.856-16.64h822.528c11.264 0 21.248 6.656 25.856 16.64 4.608 10.24 2.56 22.016-4.864 30.208L661.504 419.072v417.28c0 11.52-6.912 21.76-17.408 26.112l-242.944 99.328c-3.328 1.28-6.912 2.048-10.496 2.048z m-226.304-847.36L411.392 389.12c4.608 5.12 7.168 12.032 7.168 18.944v485.632l186.624-76.288V408.064c0-6.912 2.56-13.824 7.168-18.944l247.296-272.64H164.352z" p-id="5250" fill="#444444">
              </path>
            </svg>
          )
        }
      </div>
    )
  }
};