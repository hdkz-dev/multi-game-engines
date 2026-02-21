self.addEventListener("message", function (e) {
  if (e.data && e.data.type === "MG_INJECT_RESOURCES") {
    self.postMessage({ type: "MG_RESOURCES_READY" });
  }
  if (e.data === "uci") self.postMessage("uciok");
  if (e.data === "isready") self.postMessage("readyok");
  if (typeof e.data === "string" && e.data.startsWith("go")) {
    let t = 0;
    const interval = setInterval(() => {
      self.postMessage(`info depth ${++t} score cp 15 pv e2e4`);
      if (t > 50) clearInterval(interval);
    }, 100);
  }
  if (e.data === "stop") {
    self.postMessage("bestmove e2e4");
  }
});
