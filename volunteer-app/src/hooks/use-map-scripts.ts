import { useEffect, useRef } from 'react';
import WebView from 'react-native-webview';

/**
 * Keeps a mapbox-gl WebView page in sync with values that change too often to bake
 * into its HTML (see map-user-location.ts). Each entry is a JS statement for the page;
 * one is (re)injected whenever its text changes, and all of them once a freshly
 * loaded page reports `ready`. Null entries are skipped.
 */
export function useMapScripts(scripts: Record<string, string | null>) {
  const webViewRef = useRef<WebView>(null);
  const pageReady = useRef(false);
  // What the current page has already been sent, so unchanged scripts aren't resent.
  const injected = useRef<Record<string, string>>({});

  function flush() {
    if (!pageReady.current) return;
    for (const [key, script] of Object.entries(scripts)) {
      if (!script || injected.current[key] === script) continue;
      webViewRef.current?.injectJavaScript(`${script}; true;`);
      injected.current[key] = script;
    }
  }

  // Runs after every render, but only injects what changed.
  useEffect(flush);

  return {
    webViewRef,
    /** A new page (e.g. the HTML changed) has to be told everything again. */
    onLoadStart() {
      pageReady.current = false;
      injected.current = {};
    },
    onReady() {
      pageReady.current = true;
      flush();
    },
  };
}
