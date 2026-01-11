export const PRODUCT_STATUS = {
  PUBLISHED: "published",
  DRAFT: "draft",
  PRIVATE: "private",
} as const;

export const PRODUCT_TYPE = {
  SIMPLE: "simple",
  VARIABLE: "variable",
} as const;

export const PRODUCT_FIELD_CONFIG = {
  simple: {
    price: true,
    inventory: true, // Specific stock for this item
    variations: false, // Simple products don't have variations
    attributes: true, // Optional attributes for display
  },
  variable: {
    price: true, // Base price or range placeholder
    inventory: false, // Stock is managed at variation level
    variations: true, // Required
    attributes: true, // Required for defining variation axes
  },
};
