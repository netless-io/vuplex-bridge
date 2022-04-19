using System;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using UnityEngine;
using Vuplex.WebView;

namespace Whiteboard {
    [Serializable]
    public class ErrorMessage : BridgeMessage {
        public string error;
    }

    [Serializable]
    public class BooleanMessage : BridgeMessage {
        public bool value;
    }

    [Serializable]
    public class MetaMessage : BridgeMessage {
        public WhiteboardMeta value;
    }

    [Serializable]
    public class WhiteboardMeta {
        public string sessionUID;
        public string uid;
        public string roomUUID;
        public string userPayload;
    }

    [Serializable]
    public class MembersMessage : BridgeMessage {
        public WhiteboardMember[] value;
    }

    [Serializable]
    public class WhiteboardMember {
        public string sessionUID;
        public string uid;
        public string userPayload;
    }

    public class URLBuilder {
        public string Url;
        public URLSearchParams query;

        /// <summary>
        /// Helper class to build the webview's initial url.
        /// </summary>
        /// <example>
        /// new URLBuilder(URLProtocol.streamingAssets + "index.html");
        /// </example>
        public URLBuilder(string url) {
            Url = url;

            var index = url.IndexOf('?');
            if (index == -1) {
                query = new URLSearchParams();
            } else {
                Url = Url.Substring(0, index);
                query = new URLSearchParams(url.Substring(index + 1));
            }
        }

        /// <summary>
        /// Append entry to query string.
        /// </summary>
        public void AppendQuery(string key, string value) {
            query.Set(key, value);
        }

        /// <summary>
        /// Get the full url.
        /// </summary>
        public override string ToString() {
            return query.IsEmpty() ? Url : $"{Url}?{query}";
        }
    }

    public static class URLProtocol {
        public static readonly string file = "file://";
        public static readonly string http = "http://";
        public static readonly string https = "https://";
        public static readonly string streamingAssets = "streaming-assets://";
    }

    public class URLSearchParams {
        public Dictionary<string, string> Data = new Dictionary<string, string>();

        /// <summary>
        /// Mimic JavaScript's URLSearchParams in C#.
        /// </summary>
        public URLSearchParams(string init) {
            init = init.TrimStart('?');
            var parts = init.Split(new[] { '&' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var part in parts) {
                var entry = part.Split('=');
                if (entry.Length == 2) {
                    Data.Add(entry[0], Uri.UnescapeDataString(entry[1]));
                }
            }
        }

        /// <summary>
        /// Mimic JavaScript's URLSearchParams in C#.
        /// </summary>
        public URLSearchParams() { }

        /// <summary>
        /// Add new entry to the query.
        /// </summary>
        public void Set(string key, string value) {
            Data.Add(key, value);
        }

        /// <summary>
        /// Find entry from query.
        /// </summary>
        public string Get(string key) {
            Data.TryGetValue(key, out string value);
            return value;
        }

        /// <summary>
        /// Delete entry from query.
        /// </summary>
        public void Delete(string key) {
            Data.Remove(key);
        }

        /// <summary>
        /// Get back the query string.
        /// </summary>
        public override string ToString() {
            var sb = new StringBuilder();
            bool sep = false;
            foreach (var entry in Data) {
                if (sep) sb.Append('&');
                sb.Append($"{entry.Key}={Uri.EscapeDataString(entry.Value)}");
                sep = true;
            }
            return sb.ToString();
        }

        public bool IsEmpty() {
            return Data.Count == 0;
        }
    }

    public class Whiteboard {
        public BaseWebViewPrefab webViewPrefab;

        private TaskCompletionSource<bool> readySource;
        private TaskCompletionSource<bool> writableSource;
        private TaskCompletionSource<WhiteboardMember[]> membersSource;
        private TaskCompletionSource<WhiteboardMeta> metaSource;

        /// <summary>
        /// Fire on whiteboard initialized successfully.
        /// </summary>
        public event EventHandler OnReady = delegate { };

        /// <summary>
        /// Fire on whiteboard throw error.
        /// </summary>
        public event EventHandler<string> OnError = delegate { };

        /// <summary>
        /// Fired on querying the whiteboard writable value.
        /// </summary>
        public event EventHandler<bool> OnWritableChanged = delegate { };

        /// <summary>
        /// Fired on querying the whiteboard members data.
        /// </summary>
        public event EventHandler<WhiteboardMember[]> OnMembersChanged = delegate { };

        /// <summary>
        /// Fired on querying the whiteboard meta data.
        /// </summary>
        public event EventHandler<WhiteboardMeta> OnMetaChanged = delegate { };

        /// <summary>
        /// Initiate a new Whiteboard Bridge.
        /// </summary>
        public Whiteboard(BaseWebViewPrefab prefab) {
            webViewPrefab = prefab;
        }

        /// <summary>
        /// Load streaming-assets://index.html with room info.
        /// </summary>
        public async Task JoinRoom(string appIdentifier, string region, string uid, string uuid, string roomToken) {
            await webViewPrefab.WaitUntilInitialized();

            readySource = new TaskCompletionSource<bool>();

            var ub = new URLBuilder(URLProtocol.streamingAssets + "index.html");
            ub.AppendQuery("appid", appIdentifier);
            ub.AppendQuery("region", region);
            ub.AppendQuery("uid", uid);
            ub.AppendQuery("uuid", uuid);
            ub.AppendQuery("roomToken", roomToken);

            webViewPrefab.WebView.LoadUrl(ub.ToString());
            // prevent add twice
            webViewPrefab.WebView.MessageEmitted -= WebView_MessageEmitted;
            webViewPrefab.WebView.MessageEmitted += WebView_MessageEmitted;

            // await webviewPrefab.WebView.WaitForNextPageLoadToFinish();

            await readySource.Task;
        }

        /// <summary>
        /// bool writable = await whiteboard.GetWritable();
        /// </summary>
        public Task<bool> GetWritable() {
            writableSource = new TaskCompletionSource<bool>();

            webViewPrefab.WebView.PostMessage(JsonUtility.ToJson(new BridgeMessage {
                type = "whiteboard.writable"
            }));

            return writableSource.Task;
        }

        /// <summary>
        /// var members = await whiteboard.GetMembers();
        /// </summary>
        public Task<WhiteboardMember[]> GetMembers() {
            membersSource = new TaskCompletionSource<WhiteboardMember[]>();

            webViewPrefab.WebView.PostMessage(JsonUtility.ToJson(new BridgeMessage {
                type = "whiteboard.members"
            }));

            return membersSource.Task;
        }

        /// <summary>
        /// var meta = await whiteboard.GetMeta();
        /// </summary>
        public Task<WhiteboardMeta> GetMeta() {
            metaSource = new TaskCompletionSource<WhiteboardMeta>();

            webViewPrefab.WebView.PostMessage(JsonUtility.ToJson(new BridgeMessage {
                type = "whiteboard.meta"
            }));

            return metaSource.Task;
        }

        private void WebView_MessageEmitted(object sender, EventArgs<string> e) {
            // Debug.Log(">>>> " + e.Value);
            if (e.Value.Contains("whiteboard.")) {
                switch (BridgeMessage.ParseType(e.Value)) {
                    case "whiteboard.ready":
                        readySource.SetResult(true);
                        OnReady(this, EventArgs.Empty);
                        break;
                    case "whiteboard.error":
                        string error = JsonUtility.FromJson<ErrorMessage>(e.Value).error;
                        OnError(this, error);
                        Debug.LogError(error);
                        break;
                    case "whiteboard.writable":
                        bool value = JsonUtility.FromJson<BooleanMessage>(e.Value).value;
                        writableSource.SetResult(value);
                        OnWritableChanged(this, value);
                        break;
                    case "whiteboard.members":
                        WhiteboardMember[] members = JsonUtility.FromJson<MembersMessage>(e.Value).value;
                        membersSource.SetResult(members);
                        OnMembersChanged(this, members);
                        break;
                    case "whiteboard.meta":
                        WhiteboardMeta meta = JsonUtility.FromJson<MetaMessage>(e.Value).value;
                        metaSource.SetResult(meta);
                        OnMetaChanged(this, meta);
                        break;
                    default:
                        Debug.Log("Received WebView Message: " + e.Value);
                        break;
                }
            }
        }
    }
}
