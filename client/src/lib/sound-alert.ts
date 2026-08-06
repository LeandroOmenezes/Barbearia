export const SOUND_ALERT_STORAGE_KEY = "professional_sound_alert_enabled";
export const SOUND_ALERT_UPDATED_EVENT = "professional-sound-alert-updated";

export function getSoundAlertEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const saved = window.localStorage.getItem(SOUND_ALERT_STORAGE_KEY);
  return saved === null ? true : saved === "true";
}

export function setSoundAlertEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_ALERT_STORAGE_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent(SOUND_ALERT_UPDATED_EVENT, { detail: { enabled } }));
}
