export interface OgToolMark {
  initial: string;
  color: string;
}

export interface OgImageEntry {
  path: string;
  title: string;
  description: string;
  tools?: OgToolMark[];
}
