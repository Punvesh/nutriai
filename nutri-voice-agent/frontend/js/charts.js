const EMOTIONS = ["happy", "sad", "angry", "fear", "disgust", "surprise", "neutral"];
const stressMap = { low: 1, medium: 2, high: 3 };

let stressChart = null;
let emotionChart = null;

function labelForTs(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function initCharts() {
  if (!window.Chart) return;

  const ctxStress = document.getElementById("chartStress");
  const ctxEmotions = document.getElementById("chartEmotions");
  if (!ctxStress || !ctxEmotions) return;

  stressChart = new window.Chart(ctxStress, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Stress (low=1..high=3)",
          data: [],
          borderColor: "rgba(245, 194, 107, 0.9)",
          backgroundColor: "rgba(245, 194, 107, 0.15)",
          tension: 0.35,
          fill: true,
        },
        {
          label: "Confidence (%)",
          data: [],
          borderColor: "rgba(110, 168, 254, 0.9)",
          backgroundColor: "rgba(110, 168, 254, 0.08)",
          tension: 0.35,
          fill: true,
          yAxisID: "y2",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 0, max: 3, ticks: { stepSize: 1 } },
        y2: { position: "right", min: 0, max: 100, grid: { drawOnChartArea: false } },
      },
      plugins: { legend: { labels: { color: "#a9b6d6" } } },
    },
  });

  emotionChart = new window.Chart(ctxEmotions, {
    type: "bar",
    data: {
      labels: EMOTIONS,
      datasets: [
        {
          label: "Emotion counts",
          data: EMOTIONS.map(() => 0),
          backgroundColor: [
            "rgba(69, 212, 131, 0.55)",
            "rgba(110, 168, 254, 0.55)",
            "rgba(255, 107, 107, 0.55)",
            "rgba(155, 123, 255, 0.55)",
            "rgba(245, 194, 107, 0.55)",
            "rgba(255, 107, 214, 0.55)",
            "rgba(255, 255, 255, 0.15)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#a9b6d6" } } },
      scales: {
        x: { ticks: { color: "#a9b6d6" } },
        y: { ticks: { color: "#a9b6d6" }, beginAtZero: true, precision: 0 },
      },
    },
  });
}

export function updateCharts(sessionLog) {
  if (!stressChart || !emotionChart) return;

  const labels = sessionLog.map((x) => labelForTs(x.ts));
  const stress = sessionLog.map((x) => stressMap[x.stress_level] || 1);
  const conf = sessionLog.map((x) => Number(x.confidence || 0));

  stressChart.data.labels = labels;
  stressChart.data.datasets[0].data = stress;
  stressChart.data.datasets[1].data = conf;
  stressChart.update();

  const counts = Object.fromEntries(EMOTIONS.map((e) => [e, 0]));
  for (const e of sessionLog.map((x) => String(x.emotion || "neutral"))) {
    if (counts[e] !== undefined) counts[e] += 1;
  }
  emotionChart.data.datasets[0].data = EMOTIONS.map((e) => counts[e]);
  emotionChart.update();
}

