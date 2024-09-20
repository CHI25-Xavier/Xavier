import { NotebookPanel, Notebook, NotebookActions } from '@jupyterlab/notebook';
import { Signal, type ISignal } from '@lumino/signaling';
// import { IKernelConnection } from '@jupyterlab/services/lib/kernel/kernel';
import { /*JSONValue,*/ PromiseDelegate } from '@lumino/coreutils';

import { _debugVarInfo } from "../interfaces";
import CellAPI from './nbcell';
import { getActiveDataFrames } from '../utils';

function _getKernel(panel: NotebookPanel) {
	const s = panel.sessionContext.session;
	if (s === null) {
		throw new Error("[_getKernel] No session found.");
	}
	if (s.kernel === null) {
		throw new Error("[_getKernel] No kernel found.");
	}
	return s.kernel;
}


export class NBApi {
  private readonly _ready: PromiseDelegate<void>;
  private _changed = new Signal<this, string>(this);
  private _hasConnection = false;
	private _dfList: _debugVarInfo[] = [];

  _panel: NotebookPanel | null;
  cells: CellAPI[];
  mostRecentExecutionCount: number;

  constructor(notebookPanel: NotebookPanel | null) {
		this._panel = notebookPanel;
		this._ready = new PromiseDelegate<void>();
		this.cells = [];
		this.mostRecentExecutionCount = -1;

		if (this._panel) {      
      // this.listenToSession();
      this._panel.revealed.then(() => {
        this.listenToCells();
        this._hasConnection = true
        this._ready.resolve();        
      });
    } else {        
        this._ready.resolve();
    }
  }

  // saveToNotebookMetadata(key: string, value: any) {
  //     this.panel.model.metadata.set(key, value);
  // }

  
  // ready is a Promise that resolves once the notebook is done loading
  get ready(): Promise<void> {
      return this._ready.promise;
  }

  get panel(): NotebookPanel {
    if (!this._panel) {
      throw Error("[NBApi] Notebook panel is not defined.");
    }
    return this._panel;
  }

	get dfList(): _debugVarInfo[] {
		return this._dfList;
	}

  get hasConnection(): boolean {
      return this._hasConnection;
  }

  // changed is a signal emitted when various things in this notebook change
  get changed(): ISignal<NBApi, string> {
      return this._changed;
  }

  get notebook(): Notebook | undefined {
      return this.panel?.content;
  }

  // get path(): string | undefined {
  //     return this.panel?.sessionContext?.path;
  // }

  // get name(): string | undefined {
  //     return this.path ? PathExt.basename(this.path) : undefined;
  // }

  // get activeCell(): CellAPI | undefined {
  //     if (this.notebook && this.cells) {
  //         const active = this.notebook.activeCell;
  //         return this.cells.find(c => c.model.id === active.model.id);
  //     }
  //     return undefined;
  // }


  // Various notebook level events you can listen to
  private listenToCells() {
		this.loadCells();
		if (this.notebook === undefined || this.notebook.model === null) {
			console.warn("[listenToCells] notebook is undefined");
			return;
		}
		// event fires when cells are added, deleted, or moved
		this.notebook.model.cells.changed.connect(() => {
		    this.loadCells();
		    this._changed.emit('cells');
		});

		// // event fires when the user selects a cell
		this.notebook.activeCellChanged.connect((_, cell) => {
		    this._changed.emit('activeCell');
		});
		
		// event fires when any cell is run
		NotebookActions.executed.connect(async (_, args) => {
			// can get execution signals from other notebooks
			if (this.notebook === undefined) {
				console.warn("[listenToCells] notebook is undefined");
				return;
			}

			if (args.notebook.id === this.notebook.id) {				
				const cell = this.cells.find(c => c.model.id === args.cell.model.id);
				if (cell !== undefined) {
					const exCount = cell.getExecutionCount()
					this.mostRecentExecutionCount = (exCount !== null) ? exCount : this.mostRecentExecutionCount;
					cell._runSignal.emit();
					this._changed.emit('cellRun');
					const k = _getKernel(this.panel);
					const dfList = await getActiveDataFrames(k);
					this._dfList = dfList;
					// this._allDfInfo = await _getallDfInfo(k, dfList);
          // console.log("[listenToCells] allDfInfo", this._allDfInfo);
          
				}
			}
		});

		// this.notebook.model.metadata.changed.connect((_, args) => {
		//     this._changed.emit('language changed');
		// })
  }

  private loadCells() {
		this.cells = [];
		if (this.notebook == undefined || this.notebook.model == undefined) {
			console.warn("[loadCells] notebook or notebook model is undefined");
			return;
		}

		for (let i = 0; i < this.notebook.model.cells.length; i++) {
			this.cells.push(new CellAPI(this.notebook.model.cells.get(i), i));
		}
  }
}
