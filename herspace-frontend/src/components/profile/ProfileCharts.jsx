import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const font = { family: "'Nunito', 'DM Sans', sans-serif", size: 11 };
const gridColor = "rgba(90,130,200,0.12)";
const textColor = "#2a3a5a";

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: textColor, font },
    },
  },
};

export function RiskScoreLineChart({ labels, scores }) {
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "PCOD risk score",
          data: scores,
          borderColor: "rgba(90,130,220,0.95)",
          backgroundColor: "rgba(90,130,220,0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2,
        },
      ],
    }),
    [labels, scores]
  );

  const options = useMemo(
    () => ({
      ...commonOptions,
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font },
        },
        y: {
          min: 0,
          suggestedMax: 120,
          grid: { color: gridColor },
          ticks: { color: textColor, font },
        },
      },
    }),
    []
  );

  if (!labels?.length || !scores?.length) return null;

  return (
    <div style={{ height: "240px", position: "relative" }}>
      <Line data={data} options={options} />
    </div>
  );
}

export function WellnessDoughnutChart({ components }) {
  const { zoneScore = 0, cycleScore = 0, consistencyScore = 0, skinScore = 0 } = components || {};
  const data = useMemo(
    () => ({
      labels: ["Zone", "Cycle", "Habits", "Skin"],
      datasets: [
        {
          data: [zoneScore, cycleScore, consistencyScore, skinScore],
          backgroundColor: [
            "rgba(90,130,220,0.75)",
            "rgba(196,94,138,0.75)",
            "rgba(102,126,234,0.75)",
            "rgba(181,101,167,0.75)",
          ],
          borderColor: "rgba(255,255,255,0.9)",
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    }),
    [zoneScore, cycleScore, consistencyScore, skinScore]
  );

  const sum = zoneScore + cycleScore + consistencyScore + skinScore;
  if (sum === 0) return null;

  return (
    <div style={{ height: "220px", position: "relative", maxWidth: "280px", margin: "0 auto" }}>
      <Doughnut
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: textColor, font, padding: 12 } },
          },
        }}
      />
    </div>
  );
}

export function FeatureCompletionBarChart({ aboutDone, zonesDone, periodDone, skinDone }) {
  const data = useMemo(
    () => ({
      labels: ["About You", "Zones", "Period", "Skin"],
      datasets: [
        {
          label: "Completed",
          data: [
            aboutDone ? 100 : 0,
            zonesDone ? 100 : 0,
            periodDone ? 100 : 0,
            skinDone ? 100 : 0,
          ],
          backgroundColor: [
            "rgba(60,150,100,0.75)",
            "rgba(90,130,220,0.75)",
            "rgba(196,94,138,0.75)",
            "rgba(181,101,167,0.75)",
          ],
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }),
    [aboutDone, zonesDone, periodDone, skinDone]
  );

  const options = useMemo(
    () => ({
      ...commonOptions,
      indexAxis: "y",
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: { color: gridColor },
          ticks: { color: textColor, font, callback: (v) => `${v}%` },
        },
        y: {
          grid: { display: false },
          ticks: { color: textColor, font },
        },
      },
    }),
    []
  );

  return (
    <div style={{ height: "200px", position: "relative" }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export function ZoneIndexLineChart({ labels, zoneIndices }) {
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Zone level (0 healthy → 3 high)",
          data: zoneIndices,
          borderColor: "rgba(196,94,138,0.95)",
          backgroundColor: "rgba(196,94,138,0.1)",
          fill: true,
          tension: 0.3,
          stepped: false,
          pointRadius: 4,
          borderWidth: 2,
        },
      ],
    }),
    [labels, zoneIndices]
  );

  const options = useMemo(
    () => ({
      ...commonOptions,
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font },
        },
        y: {
          min: 0,
          max: 3,
          ticks: {
            color: textColor,
            font,
            stepSize: 1,
            callback: (v) => ["Healthy", "Mild", "Moderate", "High"][v] ?? v,
          },
          grid: { color: gridColor },
        },
      },
    }),
    []
  );

  if (!labels?.length) return null;

  return (
    <div style={{ height: "220px", position: "relative" }}>
      <Line data={data} options={options} />
    </div>
  );
}
