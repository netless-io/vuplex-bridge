import { createFastboard, FastboardApp, mount } from "@netless/fastboard";
import { read_query_params } from "./behaviors/query";
import { error, postMessage, ready } from "./utils/message";

declare global {
  var app: FastboardApp;
  var ui: ReturnType<typeof mount>;
}

async function main() {
  const query = read_query_params();
  const app = await createFastboard({
    sdkConfig: {
      appIdentifier: query.appid,
      region: query.region,
    },
    joinRoom: {
      roomToken: query.roomToken,
      uid: query.uid,
      uuid: query.uuid,
    },
  });
  window.app = app;
  window.ui = mount(app, document.querySelector("#whiteboard"));

  const isDark = matchMedia("(prefers-color-scheme: dark)");
  const updateTheme = (isDark: MediaQueryList | MediaQueryListEvent) => {
    if (isDark.matches) {
      document.documentElement.style.colorScheme = "dark";
      document.body.classList.add("dark");
    } else {
      document.documentElement.style.colorScheme = "light";
      document.body.classList.remove("dark");
    }
  };
  isDark.addEventListener("change", updateTheme);
  updateTheme(isDark);

  postMessage(ready());
}

main().catch(err => {
  console.error(err);
  postMessage(error(err.message));
});
