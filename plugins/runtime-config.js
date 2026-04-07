export default defineNuxtPlugin(() => {
  const config = window.__APP_CONFIG__ || {
    apiBase: "http://localhost:9005"
  };

  return {
    provide: {
      runtimeConfig: config
    }
  };
});
