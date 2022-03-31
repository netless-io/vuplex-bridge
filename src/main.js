import { createFastboard, mount } from "@netless/fastboard";

const IPC = {
  // Send message to the controller (Unity or parent window).
  postMessage(str) {
    if (typeof vuplex !== "undefined") {
      vuplex.postMessage(str);
    } else {
      parent.postMessage(str, "*");
    }
  },
  // Get message from the controller.
  addEventListener(type, callback) {
    if (typeof vuplex !== "undefined") {
      vuplex.addEventListener(type, callback);
    } else {
      window.addEventListener(type, callback);
    }
  },
};

const EVENTS = {
  // Fired after joined room.
  ready: () => ({ type: "whiteboard.ready" }),
  // Fired if any error occurs. (error: string)
  error: error => ({ type: "whiteboard.error", error }),
};

const REQUIRED_QUERY_PARAMS = ["appid", "region", "uid", "uuid", "roomToken"];
function read_query_params() {
  const query = new URLSearchParams(location.search);
  for (const key of REQUIRED_QUERY_PARAMS) {
    let value = query.get(key);
    if (value === null) {
      throw new Error(`Missing required query parameter: ${key}`);
    }
  }
  return Object.fromEntries(query.entries());
}

window.app = null;
window.ui = null;

// Start from here.
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
  IPC.postMessage(EVENTS.ready());
}

main().catch(err => {
  console.error(err);
  IPC.postMessage(EVENTS.error(err.message));
});
