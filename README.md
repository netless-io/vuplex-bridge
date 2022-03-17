# vuplex-bridge

Control a whiteboard in unity through the [vuplex](https://developer.vuplex.com/webview/overview) plugin's messaging api.

This repo distributes files in the <q>dist</q> folder. You can build that folder with these steps:

1. Install [Node.js](https://nodejs.org). (Notes to macOS users: `brew install nodejs`).
2. Run `npm install` in the project root directory.
3. Run `npm run build` to build the dist folder.

| file                           | place it in                           |
| ------------------------------ | ------------------------------------- |
| dist/index.html <sup>(1)</sup> | Assets/StreamingAssets <sup>(2)</sup> |
| dist/main.js                   | Assets/StreamingAssets                |
| dist/Whiteboard.cs             | Assets                                |

1. The html file is **just** a demo that having the whiteboard filling the whole [WebView](https://developer.vuplex.com/webview/IWebView), you're free to change the content in it. Just be sure to leave the code about initializing whiteboard-bridge not change.

2. The <q>StreamingAssets</q> folder is a special place that Unity allows you to reference files in it through `streaming-assets://*`. See [IWebView#LoadUrl](https://developer.vuplex.com/webview/IWebView#LoadUrl) for more information.

## Usage

After downloading and putting the files in the right place, go read the [vuplex&nbsp;documentation](https://developer.vuplex.com/webview/overview) to setup a working 3d webview. If you got any issue about using vuplex, please go find a unity expert to help you, I'm not such guy.

Then, drag the [CanvasWebViewPrefab](https://developer.vuplex.com/webview/CanvasWebViewPrefab) to a Canvas, attach a Script to that Canvas:

```csharp
using UnityEngine;
using Vuplex.WebView;
using Whiteboard;

public class InitWhiteboard : MonoBehavior {
    private Whiteboard _whiteboard;

    void Start() {
        _whiteboard = new Whiteboard(
            GameObject.Find("CanvasWebViewPrefab")
                      .GetComponent<CanvasWebViewPrefab>()
        );
        _whiteboard.joinRoom(
            appIdentifier: "",
            roomUUID: "",
            roomToken: "",
            uid: "",
            region: WhiteboardRegion.CN_HZ,
        );
    }
}
```

## Developing Notes

The chromium version in vuplex is [90 since v3.13](https://developer.vuplex.com/webview/releases#v3.13). This repo targets es2017 where we can just use async/await keywords.

## License

MIT @ [netless](https://github.com/netless-io)
