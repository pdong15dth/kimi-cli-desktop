/**
 * Tauri API wrapper for Kimi Code Desktop
 * Provides safe access to Tauri commands with graceful fallback for web browser.
 */

import { invoke } from "@tauri-apps/api/core";

/** Detect if running inside a Tauri desktop app */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/** Get the configured backend URL from Tauri storage */
export async function getTauriBackendUrl(): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<string>("get_backend_url");
  } catch {
    return null;
  }
}

/** Save the backend URL to Tauri storage */
export async function setTauriBackendUrl(url: string): Promise<void> {
  if (!isTauri()) return;
  await invoke("set_backend_url", { url });
}

/** Auto-discover a running Kimi CLI backend */
export async function discoverTauriBackend(): Promise<{
  url: string;
  version?: string;
  healthy: boolean;
} | null> {
  if (!isTauri()) return null;
  try {
    return await invoke("cmd_discover_backend");
  } catch {
    return null;
  }
}

/** Check if a backend is healthy at the given URL */
export async function checkTauriBackend(
  url: string,
): Promise<{ url: string; version?: string; healthy: boolean } | null> {
  if (!isTauri()) return null;
  try {
    return await invoke("cmd_check_backend", { url });
  } catch {
    return null;
  }
}

/** Open the native file picker */
export async function pickTauriFiles(multiple = true): Promise<string[] | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<string[]>("pick_files", { multiple });
  } catch {
    return null;
  }
}

/** Show a native desktop notification */
export async function showTauriNotification(
  title: string,
  body: string,
): Promise<void> {
  if (!isTauri()) return;
  await invoke("show_notification", { title, body });
}

/** Get the desktop app version */
export async function getTauriAppVersion(): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<string>("get_app_version");
  } catch {
    return null;
  }
}

/** Open a native folder picker for selecting a project folder */
export async function pickTauriProjectFolder(): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<string | null>("pick_project_folder");
  } catch {
    return null;
  }
}
