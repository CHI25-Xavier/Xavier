// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Modified from jupyterlab/packages/completer/src/contextconnector.ts

import _ from 'lodash';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMime } from "@jupyterlab/rendermime-interfaces"
import {
  Completer,
  CompleterModel,
  CompletionHandler,
  CompletionTriggerKind,
  ICompletionContext,
  ICompletionProvider
} from '@jupyterlab/completer';
import { SourceChange } from '@jupyter/ydoc';
import { IDocumentWidget } from '@jupyterlab/docregistry';

import { completeQuery } from "../backendApi/completeApi";
import * as utils from '../utils';
import { CustomModel } from './customModel';
import { CompResult, continuousHintingOptions, PyToken } from "../interfaces";
import { SidePanelModel } from '../dataApi/sidePanelModel';
import { IDFStyleAll } from '../sidePanel/interface';
import { concatTokens, findAllTableColumn, findColumnAddTemp, findColumnRenameTemp, findColumnFillnaTemp, findColumnSelectTemp, findColumnStrReplaceTemp, findGroupby, findPdMergeTemp, findTableConcatTemp, findTableFilterTemp, findTableMergeTemp, findTableSortTemp, tokenizePythonScript } from './pyTokenizer';
import { resetAllColumnHighlight, resetAllDfFold } from '../codePanelLink/highlightSidePanel';


/**
 * A namespace for custom connector statics.
 */
export namespace CustomConnector {
  /**
   * The instantiation options for cell completion handlers.
   */
  export interface IOptions {
    /**
     * The session used by the custom connector.
     */
    editor: CodeEditor.IEditor | null;
  }
}

function findCompletionLiCode() {
  let liCode = null;
  const allLI = [...document.querySelectorAll(".jp-Completer-item.jp-mod-active")];
  const findres = allLI.find((v) => {
    const childres = v.querySelector(".jp-Completer-match");
    const parent = v.parentElement;
    const pp = parent === null ? null : parent.parentElement;
    const isHidden = pp !== null && pp.classList.contains("lm-mod-hidden");
    return childres !== null && childres.textContent !== "Loading..." && !isHidden;
  })
  if (findres !== undefined) {
      liCode = findres.querySelector(".jp-Completer-match");
  }
  return liCode;
}

function insertText(editor: CodeEditor.IEditor, text: string, offset: number, yesNew: boolean) {
  // 1. add text
  let realText = text;
  const cursorTok = editor.getTokenAtCursor();
  if (yesNew && realText.startsWith(cursorTok.value)) {
    realText = realText.slice(cursorTok.value.length);
  }

  editor.model.sharedModel.updateSource(offset, offset, realText);
  // 2. modify style
  const newOffset = offset + realText.length;
  const newCursorPos = editor.getPositionAt(newOffset);
  if (newCursorPos !== undefined) {
    editor.setCursorPosition(newCursorPos);
  } else {
    console.error("[insertText] newCursorPos is undefined.");
  }
  return realText;
}

/**
 * A custom connector for completion handlers.
 */
export class XavierCompleterProvider implements ICompletionProvider {
  constructor(_notebooks: INotebookTracker, _dataModel: SidePanelModel, _contextProvider?: ICompletionProvider<CompletionHandler.ICompletionItem>, _kernelProvider?: ICompletionProvider<CompletionHandler.ICompletionItem>) {
    this.notebooks = _notebooks;
    this.contextProvider = _contextProvider;
    this.kernelProvider = _kernelProvider;
    this.dataModel = _dataModel;
    // Variables for partial accept of completion items
    this.addedBufferTokens = [];
    this.bufferTokens = [];
    this.currentEditor = null;
    this.pCodeForLastTokenAccept = [];
    // Variables for side panel highlight
    // this.lastAnalyze = null;
    this.currentCompItems = [];
    this.currentCompItemsIdx = -1;
    
    _notebooks.currentChanged.connect((_, widget) => {
      if (widget === null) {
        console.warn("[XavierCompleterProvider] no widget");
        return;
      }
    });

    this.tokenAcceptListener = this.tokenAcceptListener.bind(this);
    this.resetCurrentEditor = this.resetCurrentEditor.bind(this);
    this.tryGetNewBufferTokens = this.tryGetNewBufferTokens.bind(this);
    document.removeEventListener("keydown", this.tokenAcceptListener, true); // "true" means useCapture
    document.addEventListener("keydown", this.tokenAcceptListener, true);
  }

  private resetCurrentEditor() {
    if (this.currentEditor !== null && !this.currentEditor.hasFocus()) {
      this.currentEditor = null;
      this.bufferTokens = [];
      this.addedBufferTokens = [];
    }
  }

  private tryGetNewBufferTokens(nb: INotebookTracker) {
    let yesNew = false;
    if (this.bufferTokens.length === 0) {
      // try to fill the buffer
      const liCode = findCompletionLiCode();
      if (liCode !== null && liCode.textContent) {
        const newText = liCode.textContent;
        const txtTokens = tokenizePythonScript(newText);
        this.bufferTokens = txtTokens;
        this.addedBufferTokens = [];
        if (this.currentEditor !== null) {
          this.pCodeForLastTokenAccept = utils.getPreviousText(nb, this.currentEditor.getCursorPosition());
        }
        yesNew = true;
      }
    }
    return yesNew;
  }

  private canStillAddTokens(nb: INotebookTracker, edt: CodeEditor.IEditor) {
    const newPreviousCode2D = utils.getPreviousText(nb, edt.getCursorPosition());
    const oldPreviousCode2D = this.pCodeForLastTokenAccept;
    // different number of cell
    if (newPreviousCode2D.length !== oldPreviousCode2D.length) {
      // console.log("not equal", newPreviousCode2D.length, oldPreviousCode2D.length);
      return false;
    }
    // different number of line
    for (let i = 0; i < newPreviousCode2D.length; i++) {
      if (newPreviousCode2D[i].length !== oldPreviousCode2D[i].length) {
        // console.log("not euql 2", newPreviousCode2D[i].length, oldPreviousCode2D[i].length);
        return false;
      }
    }
    // For old, must have at least one line
    if (oldPreviousCode2D.length === 0 || oldPreviousCode2D[oldPreviousCode2D.length-1].length === 0) {
      // console.log("must one line", oldPreviousCode2D.length, oldPreviousCode2D[oldPreviousCode2D.length-1].length);
      return false;
    }
    // Whole comparison
    const buffStr = concatTokens(this.addedBufferTokens);
    for (let i = 0; i < newPreviousCode2D.length; i++) {
      for (let j = 0; j < newPreviousCode2D[i].length; j++) {
        if (i === newPreviousCode2D.length-1 && j === newPreviousCode2D[i].length-1) {
          if (newPreviousCode2D[i][j] !== oldPreviousCode2D[i][j] + buffStr) {
            // console.log("not equal 4", newPreviousCode2D[i][j], "$$$", oldPreviousCode2D[i][j]+ buffStr);
            return false;
          }
        } else if (newPreviousCode2D[i][j] !== oldPreviousCode2D[i][j]) {
          // console.log("not equal 3", newPreviousCode2D[i][j], "$$$", oldPreviousCode2D[i][j]);
          return false;
        }
      }
    }
    return true;
  }

  private tokenAcceptListener(e: KeyboardEvent) {
    if (e.key === "ArrowRight" && e.ctrlKey && e.altKey && this.notebooks !== undefined) {
      this.resetCurrentEditor();
      const yesNew = this.tryGetNewBufferTokens(this.notebooks);
      if (this.bufferTokens.length !== 0 && this.currentEditor !== null && this.canStillAddTokens(this.notebooks, this.currentEditor)) {
        const cursorPos = this.currentEditor.getCursorPosition();
        const cursorOffset = this.currentEditor.getOffsetAt(cursorPos);
        const nextToken = this.bufferTokens.shift();
        if (nextToken === undefined) {
          console.error("[tokenAcceptListener] no next token found.");
          return;
        }
        const realInsert = insertText(this.currentEditor, nextToken.value, cursorOffset, yesNew);
        this.addedBufferTokens.push({
          type: nextToken.type,
          value: realInsert
        });
      }
    } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && this.notebooks !== undefined) {
      const liCode = findCompletionLiCode(); // Just to determine whether the completion menu is shown
      if (liCode !== null && liCode.textContent !== null && this.currentEditor !== null) {
        if (e.key === "ArrowDown") {
          this.currentCompItemsIdx = (this.currentCompItemsIdx + 1) % this.currentCompItems.length;
        } else {
          this.currentCompItemsIdx = (this.currentCompItemsIdx - 1 + this.currentCompItems.length) % this.currentCompItems.length;
        }
        const token = this.currentEditor.getTokenAtCursor();
        let lastLine = utils.getLastLine(this.notebooks, this.currentEditor.getCursorPosition());
        lastLine = lastLine !== null ? utils.removeSuffix(lastLine, token.value) : null;
        this.highlightInSidePanel(lastLine, this.currentCompItems[this.currentCompItemsIdx] === undefined ? null : this.currentCompItems[this.currentCompItemsIdx]);
      }
    }
  }

  modelFactory(context: ICompletionContext): Promise<Completer.IModel> {
    const m = new CustomModel();
    return Promise.resolve(m);
  }

  shouldShowContinuousHint(completerIsVisible: boolean, changed: SourceChange, context?: ICompletionContext | undefined): boolean {
    if (!context || !context.editor) {
      // waiting for https://github.com/jupyterlab/jupyterlab/pull/15015 due to
      // https://github.com/jupyterlab/jupyterlab/issues/15014
      console.log("[shouldShowContinuousHint] no context");
      return false;
    }
    const editor = context.editor;
    const token = editor.getTokenAtCursor();

    // if (token.value === ")") {
    //   return false;
    // }

    // @TODO
    const triggerCharacters = [".", "'", '"'];
    const sourceChange = changed.sourceChange;
    if (sourceChange === undefined) {
      console.log("[shouldShowContinuousHint] no sourceChange");
      return false;
    }
    // if (sourceChange.some(delta => delta.delete != null)) {
    //   console.log("[shouldShowContinuousHint] delete", sourceChange);    
    //   return false;
    // }

    //@TODO by default
    const thisOptions: continuousHintingOptions = {
      settings: {
        composite: {
          continuousHinting: true, 
          suppressContinuousHintingIn: [/*"Comment",*/ "BlockComment", "LineComment", /*"String"*/],
          suppressTriggerCharacterIn: [/*"Comment",*/ "BlockComment", "LineComment", /*"String"*/]
        }
      }
    }

    if (thisOptions.settings.composite.continuousHinting) {
      // if token type is known and not ignored token type is ignored - show completer
      if (token.type && !thisOptions.settings.composite.suppressContinuousHintingIn.includes(token.type)) {
        return true;
      }
      // otherwise show it may still be shown due to trigger character
    }
    if (!token.type || thisOptions.settings.composite.suppressTriggerCharacterIn.includes(token.type)) {
      return false;
    }

    const yesShould = sourceChange.some(
      delta =>
        (delta.insert != null) &&
        (triggerCharacters.includes(delta.insert) || (!completerIsVisible && delta.insert.trim().length > 0))
    );
    return yesShould;
  }
  /**
   * The context completion provider is applicable on all cases.
   * @param context - additional information about context of completion request
   */
  async isApplicable(context: ICompletionContext): Promise<boolean> {
    const widget = context.widget as IDocumentWidget;
    if (typeof widget.context === 'undefined') {
      // there is no path for Console as it is not a DocumentWidget
      console.log("[isApplicable]: no context");
      return false;
    }
    return true;
  }

  /**
   * Fetch completion requests.
   *
   * @param request - The completion request text and details.
   * @returns Completion reply
   */
  async _fetch(
    request: CompletionHandler.IRequest,
    context: ICompletionContext,
    trigger?: CompletionTriggerKind
  ): Promise<CompletionHandler.ICompletionItemsReply> {
    const editor = context.editor;
    if (!editor) {
      console.error("No editor found.");
      return Promise.reject('No editor');
    }

    const originItems = await Private.getOriginItems(request, context, editor, trigger, this.contextProvider, this.kernelProvider);
    const reply = await this._completionHint(editor, originItems, request, context.sanitizer);
    this.currentCompItems = reply.items.map((v) => v.label);
    this.currentCompItemsIdx = reply.items.length > 0 ? 0 : -1;
    return reply;
  }

  async fetch(
    request: CompletionHandler.IRequest,
    context: ICompletionContext,
    trigger?: CompletionTriggerKind,
    delay: number = 500
  ): Promise<CompletionHandler.ICompletionItemsReply> {
    return new Promise((resolve, reject) => {
      if (this._fetchTimeout) {
        clearTimeout(this._fetchTimeout);
      }

      this._fetchTimeout = setTimeout(async () => {
        try {
          const result = await this._fetch(request, context, trigger);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, this.bufferTokens.length !== 0 ? 0 : delay);
    });
  }

  private highlightInSidePanel(lastLine: string | null, compText: string | null) {
    if (this.dataModel === undefined || lastLine === null) {
      console.warn("[highlightInSidePanel] no dataModel or analyzeRes or lastLine found.");
      return;
    }
    const lastAndComp = lastLine + (compText === null ? "" : compText);
    const allTableColumns: {[k: string]: string[]} = {};
    Object.keys(this.dataModel.allDfInfo).forEach((k) => {
      allTableColumns[k] = this.dataModel.allDfInfo[k].columnNameList;
    });
    let newAllDfStyle: IDFStyleAll = _.cloneDeep(this.dataModel.allDfStyle);
    // 1. handle fold and unfold of dataframe
    resetAllColumnHighlight(newAllDfStyle);
    const tableColumnsLL = findAllTableColumn(lastAndComp, allTableColumns);
    for (const t in tableColumnsLL) {
      newAllDfStyle[t].isFold = false;
    }
    resetAllDfFold(tableColumnsLL, newAllDfStyle);

    // 3. handle show or hidden of columns
    // We only consider table mentioned in the code line. For table not mentioned, the column will always be shown
    for (const t in tableColumnsLL) {
      const cols = tableColumnsLL[t];
      newAllDfStyle[t].isShowRows = (cols.length > 0);
      for (const c in newAllDfStyle[t].columns) {
        // If cols is empty, show all columns
        newAllDfStyle[t].columns[c].isHighlight = (cols.includes(c));
      }
    }

    // 4. Preview format transformation of single column
    const fillnaTemp = findColumnFillnaTemp(lastAndComp, allTableColumns);
    const strReplaceTemp = findColumnStrReplaceTemp(lastAndComp, allTableColumns);
    const columnSelectTemp = findColumnSelectTemp(lastAndComp, allTableColumns);
    const tableFilterTemp = findTableFilterTemp(lastAndComp, allTableColumns);
    const tableConcatTemp = findTableConcatTemp(lastAndComp, allTableColumns);
    const tableSortTemp = findTableSortTemp(lastAndComp, allTableColumns);
    const pdMergeTemp = findPdMergeTemp(lastAndComp, allTableColumns);
    const tableMergeTemp = findTableMergeTemp(lastAndComp, allTableColumns);
    const groupbyTemp = findGroupby(lastAndComp, allTableColumns);
    const columnAddTemp = findColumnAddTemp(lastAndComp, allTableColumns);
    const columnRenameTemp = findColumnRenameTemp(lastAndComp, allTableColumns);
    if (fillnaTemp !== null) {
      this.dataModel.previewColumnFillna(fillnaTemp);
    } else if (strReplaceTemp !== null) {
      this.dataModel.previewStrReplace(strReplaceTemp);
    } else if (tableConcatTemp !== null) {
      this.dataModel.previewTableConcat(tableConcatTemp);
    } else if (pdMergeTemp !== null) {
      this.dataModel.previewTableMerge(pdMergeTemp, allTableColumns);
    } else if (tableMergeTemp !== null) {
      this.dataModel.previewTableMerge(tableMergeTemp, allTableColumns);
    } else if (tableSortTemp !== null) {
      this.dataModel.previewTableSort(tableSortTemp);
    } else if (columnSelectTemp !== null) {
      this.dataModel.previewColumnSelect(columnSelectTemp);
    } else if (tableFilterTemp !== null) {
      this.dataModel.previewTableFilter(tableFilterTemp);
    } else if (groupbyTemp !== null) {
      this.dataModel.previewGroupby(groupbyTemp);
    } else if (columnAddTemp !== null) {
      this.dataModel.previewColumnAdd(columnAddTemp);
    } else if (columnRenameTemp !== null) {
      this.dataModel.previewColumnRename(columnRenameTemp);
    } else {
      this.dataModel.resetPreviewItems();
    }

    console.log(`lastline: ${lastLine}, firstItem: ${compText}, pattern: ${lastAndComp}`, "strReplaceTemp", strReplaceTemp, "columnSelectTemp", columnSelectTemp, "tableFilterTemp", tableFilterTemp, "tableConcatTemp", tableConcatTemp, "tableSortTemp", tableSortTemp, "groupbyTemp", groupbyTemp, 'columnAddTemp', columnAddTemp, "fillnaTemp", fillnaTemp, "pdMergeTemp", pdMergeTemp, "tableMergeTemp", tableMergeTemp );
    this.dataModel.setAllDfStyle(newAllDfStyle);
  }

  private async _completionHint(
    editor: CodeEditor.IEditor,
    originItems: CompletionHandler.ICompletionItem[],
    request: CompletionHandler.IRequest,
    sanitizer?: IRenderMime.ISanitizer
  ): Promise<CompletionHandler.ICompletionItemsReply> {
    const token = editor.getTokenAtCursor();
    const res: CompletionHandler.ICompletionItemsReply = {
      start: token.offset,
      end: token.offset + token.value.length,
      items: []
    };
    // vefify the parameters
    if (this.notebooks === undefined /*|| _.isEmpty(this.dataModel.allDfInfo)*/) {
      console.warn("[completionHint] no notebook tracker or no dfInfo found.");
      res.items = originItems;
      return res;
    }
    if (this.bufferTokens.length !== 0) {
      if (this.canStillAddTokens(this.notebooks, editor)) {
        res.items = [{
          label: concatTokens(this.bufferTokens),
          type: "code"
        }];
        return res;
      } else {
        this.bufferTokens = [];
        this.currentEditor = null;
        this.addedBufferTokens = [];
        this.pCodeForLastTokenAccept = [];
      }
    }
    
    // get previous code
    const previousCode2D = utils.getPreviousText(this.notebooks, editor.getCursorPosition());
    let lastLine = utils.getLastLine(this.notebooks, editor.getCursorPosition());
    lastLine = lastLine !== null ? utils.removeSuffix(lastLine, token.value) : null;

    // get completer
    if (this.tempCompleter === undefined) {
      this.tempCompleter = Private.createTempCompleter(editor, originItems, request, sanitizer);
    } else {
      Private.updatePosOfTempCompleter(editor, this.tempCompleter);
    }
    
    this.tempCompleter.show();
    const queryRes: CompResult = await completeQuery(previousCode2D, token, this.dataModel.tableLvInfo, this.dataModel.rowLvInfo, this.dataModel.colLvInfo);
    this.tempCompleter.hide();
    // this.lastAnalyze = queryRes.analyzeResp;

    let items = utils.deDuplicateCompletionItems(queryRes.tokenList);

    if (items.length === 0 && (token.value === "]" || token.value === ")")) {
      this.highlightInSidePanel(lastLine, null);
      return res;
    }

    // No need to concat originItems since the token start and end are different
    res.items = items.length > 0 ? items : originItems;
    const firstItem = res.items.length > 0 ? res.items[0].label : null;
    this.highlightInSidePanel(lastLine, firstItem);

    if (res.items.length !== 0) {
      this.currentEditor = editor;
    }
    console.log("[_completionHint] res:", res.items)
    return res;
  }

  readonly rank = 5000; // Higher than the default provider means the priority is higher.
  readonly identifier = 'CompletionProvider:custom';
  notebooks?: INotebookTracker = undefined;
  private contextProvider?: ICompletionProvider<CompletionHandler.ICompletionItem> = undefined;
  private kernelProvider?: ICompletionProvider<CompletionHandler.ICompletionItem> = undefined;
  private tempCompleter?: Completer = undefined;
  private dataModel: SidePanelModel;
  private _fetchTimeout: NodeJS.Timeout | null = null;

  // Variables for partial accept of completion items
  private bufferTokens: PyToken[] = [];
  private currentEditor: CodeEditor.IEditor | null = null;
  private addedBufferTokens: PyToken[] = [];
  private pCodeForLastTokenAccept: string[][] = [];
  // Variables for side panel highlight
  // private lastAnalyze: AnalyzeCodeResp | null = null;
  private currentCompItems: string[] = [];
  private currentCompItemsIdx: number = -1;
}

/**
 * A namespace for Private functionality.
 */
namespace Private {
  /**
   * Get a list of mocked completion hints.
   *
   * @param editor Editor
   * @returns Completion reply
   */
  

  
  export async function getOriginItems(request: CompletionHandler.IRequest, context: ICompletionContext, editor: CodeEditor.IEditor, trigger?: CompletionTriggerKind, contextProvider?: ICompletionProvider<CompletionHandler.ICompletionItem>, kernelProvider?: ICompletionProvider<CompletionHandler.ICompletionItem>): Promise<CompletionHandler.ICompletionItem[]> {
    const allItems: CompletionHandler.ICompletionItem[] = [];
    if (contextProvider && kernelProvider) {
      const f1 = await contextProvider.fetch(request, context, trigger);
      const f2 = await kernelProvider.fetch(request, context, trigger);
      allItems.push(...f1.items, ...f2.items);
    }
    return allItems.filter((v) => !v.label.startsWith("%"));
  }

  export function updatePosOfTempCompleter(editor: CodeEditor.IEditor, tempCompleter: Completer) {
    const cursorPos = editor.getCursorPosition();
    const cor = editor.getCoordinateForPosition(cursorPos);
    if (cor) {
      tempCompleter.node.style.top = cor.top + editor.lineHeight + "px";
      tempCompleter.node.style.left = cor.left + "px";
    }
    tempCompleter.node.classList.add("jp-HoverBox")
    return tempCompleter;
  }

  export function createTempCompleter(editor: CodeEditor.IEditor, originItems: CompletionHandler.ICompletionItem[], request: CompletionHandler.IRequest, sanitizer?: IRenderMime.ISanitizer) {
    const cursorPos = editor.getCursorPosition();
    const fakeitems = new Array<CompletionHandler.ICompletionItem>();
    fakeitems.push({label: "Loading..."})
    fakeitems.push(...originItems);
    const tempCompleterModel = new CompleterModel();
    tempCompleterModel.setCompletionItems(fakeitems);
    tempCompleterModel.cursor = { //?
      start: request.offset,
      end: request.offset + request.text.length
    };
    // tempCompleterModel.current = {
    //   text: request.text,
    //   line: cursorPos.line + 200,
    //   column: cursorPos.column + 200
    // };
    // tempCompleterModel.original = {
    //   text: request.text,
    //   line: cursorPos.line + 400,
    //   column: cursorPos.column + 400
    // }
    const cor = editor.getCoordinateForPosition(cursorPos);
    const tempCompleter = new Completer({
      editor: editor,
      model: tempCompleterModel,
      showDoc: true,
      sanitizer: sanitizer,
    });
    (tempCompleter as any).onUpdateRequest("update-request") // @TODO
    document.body.appendChild(tempCompleter.node);
    tempCompleter.node.style.position = "absolute";
    if (cor) {
      tempCompleter.node.style.top = cor.top + editor.lineHeight + "px";
      tempCompleter.node.style.left = cor.left + "px";
    }
    tempCompleter.node.style.height = "240px";
    tempCompleter.node.style.width = "200px";
    // tempCompleter.show();

    return tempCompleter;
  }

  export function hideTempCompleter(tempCompleter: Completer) {
    tempCompleter.hide();
    tempCompleter.node.remove();
    tempCompleter.dispose();
  }
}
