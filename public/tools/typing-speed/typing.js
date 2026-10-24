(() => {
  const durationSeconds = 60;
  const promptText =
    "Op een rustige ochtend komt de stad langzaam op gang. Fietsers steken de brug over, een bakker opent zijn deur en op het plein wordt de markt opgebouwd. Wie aandachtig kijkt, ziet hoe kleine handelingen samen een dagelijks ritme vormen. De ene persoon werkt snel, de andere neemt bewust meer tijd. Juist die verschillen maken meten interessant: een uitkomst vertelt wat er tijdens deze poging gebeurde, maar nooit het hele verhaal over een mens. Typ daarom gelijkmatig en verbeter een fout wanneer je die opmerkt.";

  const prompt = document.querySelector("#typing-prompt");
  const input = document.querySelector("#typing-input");
  const startButton = document.querySelector("#start-typing");
  const resetButton = document.querySelector("#reset-typing");
  const status = document.querySelector("#typing-status");
  const timeLeft = document.querySelector("#time-left");
  const liveWpm = document.querySelector("#live-wpm");
  const liveAccuracy = document.querySelector("#live-accuracy");
  const result = document.querySelector("#typing-result");

  if (!prompt || !input || !startButton || !resetButton) return;

  let phase = "idle";
  let startedAt = 0;
  let timer = null;

  prompt.textContent = promptText;
  input.maxLength = promptText.length;

  const compare = (value) => {
    let correct = 0;
    for (let index = 0; index < value.length; index += 1) {
      if (value[index] === promptText[index]) correct += 1;
    }
    return {
      correct,
      accuracy: value.length ? (correct / value.length) * 100 : 100
    };
  };

  const scores = (elapsedSeconds) => {
    const value = input.value;
    const comparison = compare(value);
    const minutes = Math.max(elapsedSeconds / 60, 1 / 60);
    const gross = (value.length / 5) / minutes;
    const net = gross * (comparison.accuracy / 100);
    return { ...comparison, gross, net, characters: value.length };
  };

  const renderLive = () => {
    const elapsed = startedAt ? Math.min((performance.now() - startedAt) / 1000, durationSeconds) : 0;
    const current = scores(elapsed || 1);
    timeLeft.textContent = String(Math.max(0, Math.ceil(durationSeconds - elapsed)));
    liveWpm.textContent = String(Math.round(current.gross));
    liveAccuracy.textContent = String(Math.round(current.accuracy));
  };

  const finish = (reason = "time") => {
    if (phase === "done") return;
    phase = "done";
    window.clearInterval(timer);
    timer = null;
    input.disabled = true;

    const elapsed = startedAt
      ? Math.min((performance.now() - startedAt) / 1000, durationSeconds)
      : durationSeconds;
    const final = scores(elapsed);
    timeLeft.textContent = reason === "complete" ? String(Math.max(0, Math.ceil(durationSeconds - elapsed))) : "0";
    liveWpm.textContent = String(Math.round(final.gross));
    liveAccuracy.textContent = String(Math.round(final.accuracy));
    status.textContent = reason === "complete" ? "Tekst voltooid" : "60 seconden voltooid";
    result.hidden = false;
    result.innerHTML =
      `<strong>Je resultaat: ${Math.round(final.net)} netto WPM</strong><br>` +
      `${Math.round(final.gross)} bruto WPM · ${final.accuracy.toFixed(1)}% nauwkeurig · ${final.characters} tekens. ` +
      "Dit resultaat blijft alleen in deze pagina.";
    startButton.textContent = "Nog een keer";
  };

  const tick = () => {
    if (phase !== "running") return;
    const elapsed = (performance.now() - startedAt) / 1000;
    renderLive();
    if (elapsed >= durationSeconds) finish("time");
  };

  const begin = () => {
    phase = "ready";
    startedAt = 0;
    input.value = "";
    input.disabled = false;
    result.hidden = true;
    status.textContent = "Begin met typen";
    timeLeft.textContent = String(durationSeconds);
    liveWpm.textContent = "0";
    liveAccuracy.textContent = "100";
    startButton.textContent = "Test actief";
    input.focus();
  };

  const reset = () => {
    window.clearInterval(timer);
    timer = null;
    phase = "idle";
    startedAt = 0;
    input.value = "";
    input.disabled = true;
    result.hidden = true;
    status.textContent = "Klaar om te starten";
    timeLeft.textContent = String(durationSeconds);
    liveWpm.textContent = "0";
    liveAccuracy.textContent = "100";
    startButton.textContent = "Start test";
  };

  startButton.addEventListener("click", () => {
    if (phase === "idle" || phase === "done") begin();
    else input.focus();
  });

  resetButton.addEventListener("click", reset);

  input.addEventListener("paste", (event) => {
    event.preventDefault();
    status.textContent = "Plakken is uitgeschakeld";
  });

  input.addEventListener("input", () => {
    if (phase === "ready" && input.value.length > 0) {
      phase = "running";
      startedAt = performance.now();
      status.textContent = "Test loopt";
      timer = window.setInterval(tick, 100);
    }
    renderLive();
    if (input.value === promptText) finish("complete");
  });
})();
