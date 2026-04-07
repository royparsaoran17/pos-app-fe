export default defineNuxtPlugin(() => {
  const config = window.__APP_CONFIG__ || {
    apiBase: "https://omt-api.gct.my.id",
  };

  return {
    provide: {
      runtimeConfig: config,
    },
  };
});
