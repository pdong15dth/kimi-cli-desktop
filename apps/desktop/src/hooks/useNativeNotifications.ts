import { useCallback } from "react";
import { isTauri, showTauriNotification } from "@/lib/tauri";

/**
 * Hook to show native desktop notifications when running inside Tauri.
 * Falls back to browser Notification API when not in Tauri.
 */
export function useNativeNotifications() {
  const notify = useCallback(
    async (title: string, body: string) => {
      if (isTauri()) {
        await showTauriNotification(title, body);
        return;
      }

      // Browser fallback
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(title, { body });
        } else if (Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            new Notification(title, { body });
          }
        }
      }
    },
    [],
  );

  return { notify };
}
