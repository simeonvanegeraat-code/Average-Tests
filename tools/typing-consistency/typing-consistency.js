(() => {
  const durationSeconds = 20;
  const prompts = [
    "In de vroege ochtend ligt het plein nog stil. Een bezorger zet zijn fiets tegen de muur, terwijl binnen de eerste lampen aangaan. Even later opent de bakker de deur en ruikt de straat naar vers brood.",
    "Een goede meting begint met dezelfde afspraak voor iedereen. Daarom telt een typetest meestal vijf tekens als één woord en blijven hoofdletters, spaties en leestekens onderdeel van de opdracht.",
    "Snel werken is prettig, maar alleen wanneer het resultaat bruikbaar blijft. Wie een fout rustig herstelt, kan uiteindelijk meer bereiken dan iemand die zonder controle zoveel mogelijk toetsen aanslaat."
  ];

  const prompt = document.querySelector("#consistency-prompt");
  const input = document.querySelector("#consistency-input");
  const startButton = document.querySelector("#start-consistency");
  const resetButton = document.querySelector("#reset-consistency");
  const status = document.querySelector("#consistency-status");
  const timeLeft = document.querySelector("#consistency-time");
  const liveWpm = document.querySelector("#consistency-wpm");
  const liveAccuracy = document.querySelector("#consistency-accuracy");
  const roundResults = document.querySelector("#round-results");
  const result = document.querySelector("#consistency-result");

  if (!prompt || !input || !startButton || !resetButton || !status || !roundResults || !result) return;

  let phase = "idle";
  let roundIndex = 0;
  let startedAt = 0;
  let timer = null;
  let results = [];

  const activePrompt = () => prompts[roundIndex];

  const compare = (value) => {
    let correct = 0;
    for (let index = 0; index < value.length; index += 1) {
      if (value[index] === activePrompt()[index]) correct += 1;
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

  const elapsedSeconds = () =>
    startedAt ? Math.min((performance.now() - startedAt) / 1000, durationSeconds) : 0;

  const renderLive = () => {
    const elapsed = elapsedSeconds();
    const current = scores(elapsed || 1);
    timeLeft.textContent = String(Math.max(0, Math.ceil(durationSeconds - elapsed)));
    liveWpm.textContent = String(Math.round(current.gross));
    liveAccuracy.textContent = String(Math.round(current.accuracy));
  };

  const renderRounds = () => {
    roundResults.hidden = results.length === 0;
    roundResults.innerHTML = results
      .map(
        (round, index) =>
          `<div class="round-result"><span>Ronde ${index + 1}</span><strong>${Math.round(round.net)} netto WPM</strong><small>${round.accuracy.toFixed(1)}% nauwkeurig</small></div>`
      )
      .join("");
  };

  const showFinal = () => {
    phase = "done";
    input.disabled = true;
    const netValues = results.map((round) => round.net);
    const averageNet = netValues.reduce((total, value) => total + value, 0) / netValues.length;
    const averageAccuracy =
      results.reduce((total, round) => total + round.accuracy, 0) / results.length;
    const range = Math.max(...netValues) - Math.min(...netValues);
    status.textContent = "Drie rondes voltooid";
    startButton.textContent = "Nog een keer";
    result.hidden = false;
    result.innerHTML =
      `<strong>Gemiddeld ${Math.round(averageNet)} netto WPM</strong><br>` +
      `${averageAccuracy.toFixed(1)}% gemiddelde nauwkeurigheid · ` +
      `${Math.round(range)} WPM verschil tussen je snelste en langzaamste ronde. ` +
      "De spreiding beschrijft alleen deze drie korte teksten.";
  };

  const finishRound = (reason = "time") => {
    if (phase !== "running") return;
    phase = "between";
    window.clearInterval(timer);
    timer = null;
    input.disabled = true;
    const elapsed = Math.max(elapsedSeconds(), 1);
    const final = scores(elapsed);
    results.push(final);
    timeLeft.textContent =
      reason === "complete" ? String(Math.max(0, Math.ceil(durationSeconds - elapsed))) : "0";
    liveWpm.textContent = String(Math.round(final.gross));
    liveAccuracy.textContent = String(Math.round(final.accuracy));
    renderRounds();

    if (roundIndex >= prompts.length - 1) {
      showFinal();
      return;
    }

    status.textContent = `Ronde ${roundIndex + 1} voltooid`;
    startButton.textContent = `Start ronde ${roundIndex + 2}`;
    result.hidden = false;
    result.innerHTML =
      `<strong>Ronde ${roundIndex + 1}: ${Math.round(final.net)} netto WPM.</strong><br>` +
      `Nauwkeurigheid: ${final.accuracy.toFixed(1)}%. Neem kort pauze en start daarna de volgende tekst.`;
  };

  const tick = () => {
    if (phase !== "running") return;
    renderLive();
    if (elapsedSeconds() >= durationSeconds) finishRound("time");
  };

  const prepareRound = () => {
    phase = "ready";
    startedAt = 0;
    input.value = "";
    input.disabled = false;
    input.maxLength = activePrompt().length;
    prompt.textContent = activePrompt();
    result.hidden = true;
    status.textContent = `Ronde ${roundIndex + 1} van ${prompts.length} · begin met typen`;
    timeLeft.textContent = String(durationSeconds);
    liveWpm.textContent = "0";
    liveAccuracy.textContent = "100";
    startButton.textContent = "Ronde actief";
    input.focus();
  };

  const reset = () => {
    window.clearInterval(timer);
    timer = null;
    phase = "idle";
    roundIndex = 0;
    startedAt = 0;
    results = [];
    input.value = "";
    input.disabled = true;
    prompt.textContent = prompts[0];
    result.hidden = true;
    roundResults.hidden = true;
    roundResults.innerHTML = "";
    status.textContent = "Klaar voor ronde 1 van 3";
    timeLeft.textContent = String(durationSeconds);
    liveWpm.textContent = "0";
    liveAccuracy.textContent = "100";
    startButton.textContent = "Start ronde 1";
  };

  startButton.addEventListener("click", () => {
    if (phase === "done") {
      reset();
      prepareRound();
      return;
    }
    if (phase === "idle") {
      prepareRound();
      return;
    }
    if (phase === "between") {
      roundIndex += 1;
      prepareRound();
      return;
    }
    input.focus();
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
      status.textContent = `Ronde ${roundIndex + 1} loopt`;
      timer = window.setInterval(tick, 100);
    }
    renderLive();
    if (phase === "running" && input.value === activePrompt()) finishRound("complete");
  });

  reset();
})();
