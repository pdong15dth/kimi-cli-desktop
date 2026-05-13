import { useCallback } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { isTauri, pickTauriFiles } from "@/lib/tauri";

/**
 * Hook to open the native file picker when running inside Tauri.
 * Returns File[] compatible with the web UI's upload system.
 */
export function useNativeFilePicker() {
  const pickFiles = useCallback(async (): Promise<File[]> => {
    if (!isTauri()) return [];

    const paths = await pickTauriFiles(true);
    if (!paths || paths.length === 0) return [];

    const files: File[] = [];
    for (const path of paths) {
      try {
        const url = convertFileSrc(path);
        const response = await fetch(url);
        const blob = await response.blob();
        const name = path.split("/").pop() || "file";
        const file = new File([blob], name, { type: blob.type || "application/octet-stream" });
        files.push(file);
      } catch (e) {
        console.warn("[useNativeFilePicker] Failed to read file:", path, e);
      }
    }
    return files;
  }, []);

  return { pickFiles };
}
