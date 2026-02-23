/* global self, setInterval, clearInterval */

let intervalId = null;

self.addEventListener("message", function (e) {
  if (e.data && e.data.type === "MG_INJECT_RESOURCES") {
    self.postMessage({ type: "MG_RESOURCES_READY" });
  }
  if (e.data === "uci") self.postMessage("uciok");
  if (e.data === "isready") self.postMessage("readyok");
  if (e.data === "ucinewgame") {
    /* ignore */
  }

  if (typeof e.data === "string" && e.data.startsWith("go")) {
    if (intervalId) clearInterval(intervalId);
    let t = 0;
    intervalId = setInterval(() => {
      t++;
      self.postMessage(`info depth ${t} score cp 15 pv e2e4`);
      if (t >= 50) {
        clearInterval(intervalId);
        intervalId = null;
        // 2026 Best Practice: Send bestmove even on auto-stop to prevent UI hang
        self.postMessage("bestmove e2e4");
      }
    }, 100);
  }

  if (e.data === "stop") {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    self.postMessage("bestmove e2e4");
  }
});
