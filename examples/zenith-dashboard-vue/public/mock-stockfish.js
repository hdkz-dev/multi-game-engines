let intervalId = null;
/* global self, clearInterval, setInterval */
const MG_INJECT_RESOURCES = "MG_INJECT_RESOURCES";

self.addEventListener("message", function (e) {
  if (e.data && e.data.type === MG_INJECT_RESOURCES) {
    self.postMessage({ type: "MG_RESOURCES_READY" });
  }
  if (e.data === "uci") self.postMessage("uciok");
  if (e.data === "isready") self.postMessage("readyok");
  if (typeof e.data === "string" && e.data.startsWith("go")) {
    if (intervalId) clearInterval(intervalId);
    let t = 0;
    intervalId = setInterval(() => {
      self.postMessage(`info depth ${++t} score cp 15 pv e2e4`);
      if (t > 50) {
        clearInterval(intervalId);
        intervalId = null;
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
