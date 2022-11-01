# Whiteboard Vuplex Bridge

This project offers a C# interface to control a webpage-based whiteboard via the [vuplex](https://developer.vuplex.com/webview/overview) plugin.

https://user-images.githubusercontent.com/6882794/199195475-625d633f-2682-437e-8f1e-bd7d71e2edee.mp4

## Quick Start

### Copy Whiteboard Source Files

1. Download the prebuilt whiteboard source `dist.zip` from [releases](https://github.com/netless-io/vuplex-bridge/releases).
2. Unzip it and copy files to corresponding directories in the Unity project as follow:

   | source file        | copy to                               |
   | ------------------ | ------------------------------------- |
   | dist/index.html    | Assets/StreamingAssets <sup>[1]</sup> |
   | dist/whiteboard.js | Assets/StreamingAssets                |
   | dist/Whiteboard.cs | Assets                                |

<samp>[1]</samp> The <q>StreamingAssets</q> folder is a special place that Unity allows you to reference files in it through `streaming-assets://*`. See [IWebView#LoadUrl](https://developer.vuplex.com/webview/IWebView#LoadUrl) for more information.

### Usage

1. Obtain Agora Whiteboard security credentials following [instructions](https://docs.agora.io/en/whiteboard/enable_whiteboard).
2. Setup a working 3d webview following [vuplex&nbsp;documentation](https://developer.vuplex.com/webview/overview).
3. Drag the [CanvasWebViewPrefab](https://developer.vuplex.com/webview/CanvasWebViewPrefab) to a Canvas and attach a Script to the Canvas object:

   ```csharp
   using UnityEngine;
   using Vuplex.WebView;
   using Whiteboard;

   public class InitWhiteboard : MonoBehavior {
       private Whiteboard _whiteboard;

       async void Start() {
           _whiteboard = new Whiteboard(
               GameObject.Find("CanvasWebViewPrefab")
                       .GetComponent<CanvasWebViewPrefab>()
           );
           await _whiteboard.joinRoom(
               appIdentifier: "",
               roomUUID: "",
               roomToken: "",
               uid: "",
               region: "cn-hz",
           );
       }
   }
   ```

4. Start playing the project. You should see the whiteboard on a canvas.

## API

```csharp
class Whiteboard {
    public async Task JoinRoom(string appIdentifier, string region, string uid, string uuid, string roomToken);
    public Task<bool> GetWritable();
    public Task<WhiteboardMeta> GetMeta();
    public Task<WhiteboardMember[]> GetMembers();
}

[Serializable]
public class WhiteboardMeta {
    public string sessionUID;
    public string uid;
    public string roomUUID;
    public string userPayload;
}

[Serializable]
public class WhiteboardMember {
    public string sessionUID;
    public string uid;
    public string userPayload;
}
```

## Build Whiteboard From Source

If you want to build the `whiteboard.js` from source:

1. Install [Node.js](https://nodejs.org). (Notes to macOS users: `brew install nodejs`).
2. Run `npm install` in the project root directory.
3. Run `npm run build` to build the dist folder.

## License

MIT @ [netless](https://github.com/netless-io)
