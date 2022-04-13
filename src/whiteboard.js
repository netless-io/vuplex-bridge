import { createFastboard, mount } from "@netless/fastboard";

window.app = null;
window.ui = null;

var transform_member_state = ({ memberId, payload }) => ({
  sessionUID: memberId,
  uid: payload?.uid || "",
  userPayload: JSON.stringify(payload),
});

function get_meta() {
  const room = window.app.room;
  const displayer = room;
  const memberId = displayer.observerId;
  const userPayload = displayer.state.roomMembers.find(member => member.memberId === memberId)?.payload;
  return {
    sessionUID: memberId,
    uid: room?.uid || userPayload?.uid || "",
    roomUUID: room?.uuid,
    userPayload: JSON.stringify(userPayload),
  };
}

const IPC = {
  // Send message to the controller (Unity or parent window).
  postMessage(msg) {
    if (typeof vuplex !== "undefined") {
      vuplex.postMessage(JSON.stringify(msg));
    } else {
      parent.postMessage(JSON.stringify(msg), "*");
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

const METHODS = {
  // Fired after joined room.
  ready: () => IPC.postMessage({ type: "whiteboard.ready" }),

  // Fired if any error occurs. (error: string)
  error: error => IPC.postMessage({ type: "whiteboard.error", error }),

  // Get whiteboard writable state.
  writable: () =>
    IPC.postMessage({
      type: "whiteboard.writable",
      value: window.app.room.isWritable,
    }),

  // Get whiteboard members state.
  members: () =>
    IPC.postMessage({
      type: "whiteboard.members",
      value: window.app.room.state.roomMembers.map(transform_member_state),
    }),

  // Get whiteboard meta data -- sessionUID, uid, userPayload, roomUUID.
  meta: () =>
    IPC.postMessage({
      type: "whiteboard.meta",
      value: get_meta(),
    }),
};

function is_string(v) {
  return typeof v === "string";
}

function handle({ type, ...args }) {
  if (is_string(type) && type.startsWith("whiteboard.")) {
    type = type.slice(11);
    if (type in METHODS) {
      METHODS[type](args);
    } else {
      console.warn(`Unknown method: ${type}`);
    }
  }
}

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

function on_catch_error(err) {
  console.error(err);
  METHODS.error(err.message);
}

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
  METHODS.ready();
  IPC.addEventListener("message", event => {
    const data = event.data;
    if (typeof data === "string") {
      try {
        handle(JSON.parse(data));
      } catch (err) {
        on_catch_error(err);
      }
    } else if (typeof data === "object" && data !== null) {
      try {
        handle(data);
      } catch (err) {
        on_catch_error(err);
      }
    }
  });
}

main().catch(on_catch_error);
