// plugins/deviceId.client.ts
export default defineNuxtPlugin(() => {
  const key = "poll-device-id";
  let id = localStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }

  return {
    provide: {
      deviceId: id,
    },
  };
});
