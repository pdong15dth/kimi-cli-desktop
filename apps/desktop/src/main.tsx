const bootstrap = async (): Promise<void> => {
  if (import.meta.env.DEV) {
    try {
      const { scan } = await import("react-scan");
      scan({ enabled: true });
    } catch {
      // react-scan not available, skip
    }
  }

  // Tauri desktop initialization: discover and configure backend URL
  if (typeof window !== "undefined" && "__TAURI__" in window) {
    try {
      const { getTauriBackendUrl, discoverTauriBackend, setTauriBackendUrl } =
        await import("./lib/tauri");
      let backendUrl = await getTauriBackendUrl();
      if (!backendUrl) {
        const discovered = await discoverTauriBackend();
        if (discovered?.healthy) {
          backendUrl = discovered.url;
          await setTauriBackendUrl(backendUrl);
        }
      }
      // Always set the backend URL for the web UI to use, falling back to default
      (window as unknown as Record<string, unknown>).__KIMI_BACKEND_URL__ =
        backendUrl || "http://127.0.0.1:5494";
    } catch (e) {
      console.warn("[main] Tauri init failed:", e);
    }
  }

  await import("./bootstrap");
};

bootstrap().catch((error: unknown) => {
  console.error("[main] bootstrap failed:", error);
});
