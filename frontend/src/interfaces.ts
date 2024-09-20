export interface _commonDict {
  [key: string]: any;
}

export interface _myCompletionItem {
  value: string;
  offset: number;
  type?: string;
  explanation?: string | null;
}

export interface CompResult {
  tokenList: _myCompletionItem[];
  analyzeResp: AnalyzeCodeResp | null;
};

export interface _debugVarInfo {
  evaluateName: string;
  name: string;
  type: string;
  value: string;
  variablesReference: number;
}

export interface AnalyzeCodeResp {
  method_name: string | null;
  need_obj: number;
  df_info_type: string;
  df_name: string | null;
  df_name_list: string[] | null;
  col_name: string | null;
  col_name_list: string[] | null;
  op_name: string | null;
  cell_value: string | null;
  col_idx_list: string[] | null;
  special_case: number;
  is_trivial: boolean;
}

export interface continuousHintingOptions {
  settings: {
    composite: {
      continuousHinting: boolean,
      suppressContinuousHintingIn: string[],
      suppressTriggerCharacterIn: string[],
    }
  }
}

export interface PyToken {
  type: string;
  value: string;
};