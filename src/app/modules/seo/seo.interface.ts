export type TSeoData = {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  schemaMarkup?: string;
};

export type TProductSeoData = TSeoData & {
  focusKeyphrase?: string;
  slug?: string;
};
