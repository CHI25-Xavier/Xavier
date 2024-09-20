import { IDfCondAll, IDFStyleAll } from "./interface";

export type FOnUpdateDCIconClick = (e: React.MouseEvent, channel: "table" | "column", op: "add" | "remove" | "toggle", ctx: {dfName?: string, colName?: string}) => void;

export type FOnColSelectIconClick = (e: React.MouseEvent, dfName: string, colName: string) => void;

export type FOnFilterValueIconClick = (e: React.MouseEvent, dfName: string, colName: string) => void;

export type FOnFilterColumnIconClick = (e: React.MouseEvent, dfName: string) => void;

export type FOnTitleClick = (e: React.MouseEvent, dfName: string) => void;

export type FOnCateSelectIconClick = (e: React.MouseEvent, dfName: string, colName: string, cate: number | string) => Promise<void>;

export type FonNumRangeSelectIconClick = (e: React.MouseEvent, dfName: string, colName: string, lowerBundle: number, upperBundle: number) => Promise<void>;

export type FSetAllDfStyle = (newStyle: IDFStyleAll) => void;

export type FSetSelectedDFName = (dfName: string) => void;

export type FOnSampleBtnClick = (dfName: string) => void;

export type FgetRowSampleOfOneDf = (dfName: string, condition: IDfCondAll | null) => Promise<void>;

export type FfloatColumnRefFunc = (colNum: number, isHighlight: boolean) => (el: HTMLDivElement | null) => void;

export type FSetSearchInputActive = React.Dispatch<React.SetStateAction<number | null>>;