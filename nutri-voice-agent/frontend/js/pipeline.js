const STAGES = [
  { key: "mfcc", label: "Extracting MFCC features..." },
  { key: "cnn", label: "CNN: learning local patterns..." },
  { key: "bilstm", label: "BiLSTM: capturing context..." },
  { key: "attention", label: "Attention: focusing on signals..." },
  { key: "output", label: "Scoring emotion classes..." },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function setStageActive(key) {
  document.querySelectorAll(".stage-chip").forEach((el) => {
    el.classList.toggle("active", el.dataset.stage === key);
  });
}

export function initBars() {
  const host = document.getElementById("mfccBars");
  if (!host) return;
  host.innerHTML = "";
  for (let i = 0; i < 24; i++) {
    const b = document.createElement("div");
    b.className = "bar";
    b.style.height = `${10 + Math.random() * 50}%`;
    host.appendChild(b);
  }
}

export async function runPipelineAnimation() {
  const stageText = document.getElementById("stageText");
  const host = document.getElementById("mfccBars");
  if (!stageText || !host) return;

  const start = performance.now();
  const duration = 1500;
  const tick = (t) => {
    const p = Math.min(1, (t - start) / duration);
    host.querySelectorAll(".bar").forEach((b, i) => {
      const w = 0.2 + 0.8 * Math.sin(t / 140 + i * 0.35) * 0.5 + 0.5;
      b.style.height = `${10 + 60 * w * (0.35 + 0.65 * p)}%`;
    });
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  for (const s of STAGES) {
    setStageActive(s.key);
    stageText.textContent = s.label;
    await sleep(350);
  }

  setStageActive("output");
  stageText.textContent = "Done.";
  await sleep(250);
  setStageActive("");
  stageText.textContent = "Idle";
}

