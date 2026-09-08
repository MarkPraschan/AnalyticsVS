import type { ReviewDimension } from './dimensions';

export interface ToolReviewSource {
  label: string;
  url: string;
  checkedOn: string;
}

export interface ToolReviewFaq {
  question: string;
  answer: string;
}

export interface ToolReviewFigure {
  src: string;
  alt: string;
  caption?: string;
}

export interface ToolReviewSection {
  id: string;
  title: string;
  dimension: ReviewDimension;
  content: string;
  figures?: ToolReviewFigure[];
}

export interface ToolReview {
  slug: string;
  reviewScope?: string;
  reviewStatus: 'draft' | 'reviewed' | 'verified';
  reviewedOn: string;
  quickAnswer: string;
  bestFor: string[];
  notFor: string[];
  sections: ToolReviewSection[];
  setupNotes: string;
  setupFigures: ToolReviewFigure[];
  benchmarkNotes?: string;
  benchmarkFigures: ToolReviewFigure[];
  pricingNotes: string;
  limitations: string[];
  faq: ToolReviewFaq[];
  sources: ToolReviewSource[];
}
