// composables/useDeviceId.ts
export function useDeviceId() {
  const key = "poll-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
