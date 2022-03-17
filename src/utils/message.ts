declare var vuplex: Window;

const is_vuplex = typeof vuplex !== "undefined";

export interface Messaging {
  postMessage(msg: string): void;
  addEventListener(
    event: "message",
    listener: (data: MessageEvent) => void
  ): void;
}

export const postMessage = is_vuplex
  ? vuplex.postMessage.bind(vuplex)
  : function postMessageToParent(message: string) {
      parent.postMessage(message, "*");
    };

export const addEventListener = is_vuplex
  ? vuplex.addEventListener.bind(vuplex)
  : window.addEventListener.bind(window);

interface Message {
  type: `whiteboard.${string}`;
}

interface ReadyMessage extends Message {
  type: "whiteboard.ready";
}
export function ready(): ReadyMessage {
  return { type: "whiteboard.ready" };
}

interface ErrorMessage extends Message {
  type: "whiteboard.error";
  error: string;
}
export function error(error: string): ErrorMessage {
  return { type: "whiteboard.error", error };
}
