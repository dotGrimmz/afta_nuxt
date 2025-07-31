export const useResponsiveImage = (path: string) => {
  const { isDesktop } = useIsMobile();

  return computed(() => (isDesktop.value ? path : ""));
};
