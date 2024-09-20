import React from 'react';
import { IDfCateColItemSearch, IDfColSelect } from '../interface';

interface IProps {
  children: React.ReactNode;
}

interface IState {
  _allDfColSelect: IDfColSelect;
  _allDfCateColItemSearch: IDfCateColItemSearch;
}

export interface IContext {
  allDfColSelect: IDfColSelect;
  setAllDfColSelect: (newAllDfColSelect: IDfColSelect) => void;
  allDfCateColItemSearch: IDfCateColItemSearch;
  setAllDfCateColItemSearch: (newAllDfCateColItemSearch: IDfCateColItemSearch) => void;
}

export const ReactStore = React.createContext<IContext>({
  allDfColSelect: {},
  setAllDfColSelect: () => {},
  allDfCateColItemSearch: {},
  setAllDfCateColItemSearch: () => {},
});

// Create a provider component
export class SidePanelReactStore extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      _allDfColSelect: {}, //this.initAllDfColSelect(props.allDfInfo),
      _allDfCateColItemSearch: {},
    }
    this.setAllDfColSelect = this.setAllDfColSelect.bind(this);
    this.setAllDfCateColItemSearch = this.setAllDfCateColItemSearch.bind(this);
  }

  setAllDfColSelect(newAllDfColSelect: IDfColSelect) {
    this.setState({ _allDfColSelect: newAllDfColSelect });
  }

  setAllDfCateColItemSearch(newAllDfCateColItemSearch: IDfCateColItemSearch) {
    this.setState({ _allDfCateColItemSearch: newAllDfCateColItemSearch });
  }

  render() {
    return (
      <ReactStore.Provider value={{ 
        allDfColSelect: this.state._allDfColSelect,
        setAllDfColSelect: this.setAllDfColSelect,
        allDfCateColItemSearch: this.state._allDfCateColItemSearch,
        setAllDfCateColItemSearch: this.setAllDfCateColItemSearch,
      }}>
        {this.props.children}
      </ReactStore.Provider>
    );
  }
}
