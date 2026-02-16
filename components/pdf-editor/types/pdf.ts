export type AnnotationType =
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'note'
  | 'stickyNote'
  | 'textBox'
  | 'freehand'
  | 'rectangle'
  | 'ellipse'
  | 'arrow'
  | 'line';

export type Annotation = {
  id: string;
  type: AnnotationType;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  color?: string;
  strokeWidth?: number;
  fontSize?: number;
  opacity?: number;
  points?: Array<{ x: number; y: number }>;
};

export type SourcePDF = {
  id: string;
  name: string;
  path?: string;
  bytes: Uint8Array;
};

export type FormFieldValue = {
  fieldName: string;
  value: string | boolean;
};

export type SessionPage = {
  id: string;
  pageIndex: number;
  sourceFileIndex: number;
  annotations: Annotation[];
  formValues?: FormFieldValue[];
  rotation?: number; // 0, 90, 180, 270
};

export type PDFSession = {
  files: SourcePDF[];
  pages: SessionPage[];
  currentPage: number;
};

export type DraftPage = {
  sourcePath: string;
  pageIndex: number;
  annotations: Annotation[];
};

export type SessionDraftV1 = {
  version: 1;
  filePaths: string[];
  pageOrder: DraftPage[];
  currentPage: number;
};

export type RecentFile = {
  path: string;
  name: string;
  lastOpenedAt: string;
};

export type SplitRange = {
  start: number;
  end: number;
};

export type Tab = {
  id: string;
  title: string;
  filePath?: string;
};
