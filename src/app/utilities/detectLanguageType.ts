export function detectLanguageType(text: string): "English" | "Unicode" {
  const trimmedText = text.trim();

  // eslint-disable-next-line no-control-regex
  const result = /[^\x00-\x7F]/.test(trimmedText) ? "Unicode" : "English";

  return result;
}
