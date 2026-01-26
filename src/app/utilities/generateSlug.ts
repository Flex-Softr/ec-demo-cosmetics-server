/**
 * Generate a URL-friendly slug from a string.
 * @param text - The string to convert (e.g., category name)
 * @param unique - Whether to append a unique suffix
 * @returns string - slug
 */

export const generateSlug = (text: string, unique?: boolean): string => {
  // Convert to lowercase, remove special chars, replace spaces with hyphens
  let slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-"); // remove multiple hyphens

  if (unique) {
    const suffix =
      Date.now().toString(36).slice(-3) +
      Math.random().toString(36).slice(2, 4);
    slug = `${slug}-${suffix}`;
  }

  return slug;
};

export default generateSlug;
