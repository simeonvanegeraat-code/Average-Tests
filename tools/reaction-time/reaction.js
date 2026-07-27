(() => {
  const totalTrials = 5;
  const zone = document.querySelector("#reaction-zone");
  if (!zone) return;

  const title = document.querySelector("#reaction-title");
  const instruction = document.querySelector("#reaction-instruction");
  const icon = document.querySelector("#reaction-icon");
  const count = document.querySelector("#trial-count");
  const announcement = document.querySelector("#reaction-announcement");
  const resultsPanel = document.querySelector("#tool-results");
  const latestResult = document.querySelector("#latest-result");
  const medianResult = document.querySelector("#median-result");
  const rangeResult = document.querySelector("#range-result");
  const chart = document.querySelector("#trial-chart");
  const summary = document.querySelector("#result-summary");
  const resetButton = document.querySelector("#reset-test");

  let state = "idle";
  let timerId = null;
  let startedAt = 0;
  let measurements = [];

  const setState = (nextState, nextTitle, nextInstruction, nextIcon) => {
    state = nextState;
    zone.dataset.state = nextState;
    title.textContent = nextTitle;
    instruction.textContent = nextInstruction;
    icon.textContent = nextIcon;
  };

  const announce = (message) => {
    announcement.textContent = "";
    window.setTimeout(() => {
      announcement.textContent = message;
    }, 20);
  };

  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  };

  const interpret = (value) => {
    if (value < 200) return "Een zeer snelle browsertestscore. Herhaal de test om te controleren of dit stabiel is.";
    if (value < 250) return "Een snelle score voor een eenvoudige visuele browsertest.";
    if (value < 300) return "Een veelvoorkomende orde van grootte bij eenvoudige visuele computertaken.";
    if (value < 400) return "Iets langzamer dan veel eenvoudige computertaken. Vermoeidheid en apparatuur kunnen meespelen.";
    return "Een relatief langzame meting. Probeer opnieuw in een rustige omgeving en op hetzelfde apparaat.";
  };

  const updateResults = () => {
    resultsPanel.classList.add("visible");
    latestResult.textContent = `${measurements.at(-1)} ms`;
    count.textContent = `${measurements.length} van ${totalTrials} geldige metingen`;

    const currentMedian = median(measurements);
    medianResult.textContent = `${currentMedian} ms`;

    const minimum = Math.min(...measurements);
    const maximum = Math.max(...measurements);
    rangeResult.textContent = measurements.length > 1 ? `${maximum - minimum} ms` : "—";

    chart.replaceChildren();
    const chartMax = Math.max(...measurements, 350);
    measurements.forEach((value, index) => {
      const bar = document.createElement("div");
      bar.className = "trial-bar";
      bar.style.height = `${Math.max(18, Math.round((value / chartMax) * 70))}px`;
      bar.title = `Meting ${index + 1}: ${value} ms`;
      const accessibleText = document.createElement("span");
      accessibleText.textContent = `Meting ${index + 1}: ${value} milliseconden`;
      bar.append(accessibleText);
      chart.append(bar);
    });

    if (measurements.length === totalTrials) {
      summary.innerHTML = `<strong>Je mediaan is ${currentMedian} ms.</strong><br>${interpret(currentMedian)} Dit is geen bevolkingspercentiel of diagnose.`;
    } else {
      const remaining = totalTrials - measurements.length;
      summary.textContent = `Nog ${remaining} geldige ${remaining === 1 ? "meting" : "metingen"} te gaan. Klik op het testvlak voor de volgende ronde.`;
    }
  };

  const armTrial = () => {
    window.clearTimeout(timerId);
    setState("waiting", "Wacht op groen…", "Nog niet klikken. Een te vroege reactie telt niet mee.", "…");
    announce("Wacht tot het vlak groen wordt.");
    const delay = 1600 + Math.random() * 2400;
    timerId = window.setTimeout(() => {
      state = "arming";
      zone.dataset.state = "ready";
      title.textContent = "Klik nu";
      instruction.textContent = "Klik of druk op de spatiebalk.";
      icon.textContent = "!";
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          startedAt = performance.now();
          state = "ready";
          announce("Klik nu.");
        });
      });
    }, delay);
  };

  const handleAction = () => {
    if (state === "idle" || state === "result") {
      if (measurements.length >= totalTrials) {
        reset();
      }
      armTrial();
      return;
    }

    if (state === "waiting" || state === "arming") {
      window.clearTimeout(timerId);
      setState("false-start", "Te vroeg", "Deze poging telt niet mee. Klik om opnieuw te proberen.", "×");
      announce("Te vroeg. Deze poging telt niet mee.");
      state = "result";
      return;
    }

    if (state === "ready") {
      const elapsed = Math.max(1, Math.round(performance.now() - startedAt));
      measurements.push(elapsed);
      updateResults();

      if (measurements.length === totalTrials) {
        setState("result", `${median(measurements)} ms mediaan`, "Klaar. Bekijk je vijf metingen onder het testvlak.", "✓");
        announce(`Test voltooid. Je mediaan is ${median(measurements)} milliseconden.`);
      } else {
        setState("result", `${elapsed} ms`, "Klik voor de volgende geldige meting.", "→");
        announce(`${elapsed} milliseconden. Klik voor de volgende meting.`);
      }
    }
  };

  const reset = () => {
    window.clearTimeout(timerId);
    measurements = [];
    count.textContent = `0 van ${totalTrials} geldige metingen`;
    resultsPanel.classList.remove("visible");
    latestResult.textContent = "—";
    medianResult.textContent = "—";
    rangeResult.textContent = "—";
    chart.replaceChildren();
    summary.textContent = "Je ziet hier straks je vijf metingen. De mediaan is minder gevoelig voor één uitschieter dan het gemiddelde.";
    setState("idle", "Start wanneer je klaar bent", "Klik hier of druk op de spatiebalk. Daarna: wacht op groen.", "→");
    announce("De test is opnieuw ingesteld.");
  };

  zone.addEventListener("click", handleAction);
  resetButton.addEventListener("click", reset);

  window.addEventListener("keydown", (event) => {
    if (event.code !== "Space") return;
    const activeTag = document.activeElement?.tagName;
    if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
    event.preventDefault();
    handleAction();
  });
})();
