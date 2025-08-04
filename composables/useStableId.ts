// composables/useStableId.ts
export function useStableId(base: string) {
  const hash = Array.from(base)
    .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    .toString(36);
  return `uid-${Math.abs(parseInt(hash))}`;
}
