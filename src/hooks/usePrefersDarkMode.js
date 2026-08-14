import { useEffect, useState } from 'react';

const QUERY = '(prefers-color-scheme: dark)';

const getMediaQueryList = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY)
    : null;

function usePrefersDarkMode() {
  const [prefersDarkMode, setPrefersDarkMode] = useState(
    () => getMediaQueryList()?.matches ?? false
  );

  useEffect(() => {
    const mediaQueryList = getMediaQueryList();
    if (!mediaQueryList) return;

    setPrefersDarkMode(mediaQueryList.matches);

    const handleChange = event => setPrefersDarkMode(event.matches);

    // addListener is deprecated but needed for Safari < 14
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
      return () => mediaQueryList.removeEventListener('change', handleChange);
    }
    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, []);

  return prefersDarkMode;
}

export default usePrefersDarkMode;
