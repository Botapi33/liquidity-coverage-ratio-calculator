const level1AssetsInput = document.getElementById("level1Assets");
const level2aAssetsInput = document.getElementById("level2aAssets");
const level2bAssetsInput = document.getElementById("level2bAssets");
const additionalBufferInput = document.getElementById("additionalBuffer");

const retailOutflowsInput = document.getElementById("retailOutflows");
const wholesaleOutflowsInput = document.getElementById("wholesaleOutflows");
const derivativeOutflowsInput = document.getElementById("derivativeOutflows");
const otherOutflowsInput = document.getElementById("otherOutflows");

const securedInflowsInput = document.getElementById("securedInflows");
const unsecuredInflowsInput = document.getElementById("unsecuredInflows");
const otherInflowsInput = document.getElementById("otherInflows");
const currencyLabelInput = document.getElementById("currencyLabel");

const calculateBtn = document.getElementById("calculateBtn");
const resetBtn = document.getElementById("resetBtn");

const lcrValueEl = document.getElementById("lcrValue");
const lcrStatusEl = document.getElementById("lcrStatus");
const hqlaValueEl = document.getElementById("hqlaValue");
const ncoValueEl = document.getElementById("ncoValue");

const totalHqlaDisplayEl = document.getElementById("totalHqlaDisplay");
const totalOutflowsDisplayEl = document.getElementById("totalOutflowsDisplay");
const totalInflowsDisplayEl = document.getElementById("totalInflowsDisplay");
const inflowCapDisplayEl = document.getElementById("inflowCapDisplay");
const recognizedInflowsDisplayEl = document.getElementById("recognizedInflowsDisplay");
const netOutflowsDisplayEl = document.getElementById("netOutflowsDisplay");
const interpretationTextEl = document.getElementById("interpretationText");
const scenarioTableBodyEl = document.getElementById("scenarioTableBody");

function formatNumber(value) {
  return value.toFixed(1);
}

function formatPercent(value) {
  return `${value.toFixed(0)}%`;
}

function getInputs() {
  return {
    level1: Number(level1AssetsInput.value) || 0,
    level2a: Number(level2aAssetsInput.value) || 0,
    level2b: Number(level2bAssetsInput.value) || 0,
    buffer: Number(additionalBufferInput.value) || 0,

    retailOut: Number(retailOutflowsInput.value) || 0,
    wholesaleOut: Number(wholesaleOutflowsInput.value) || 0,
    derivativeOut: Number(derivativeOutflowsInput.value) || 0,
    otherOut: Number(otherOutflowsInput.value) || 0,

    securedIn: Number(securedInflowsInput.value) || 0,
    unsecuredIn: Number(unsecuredInflowsInput.value) || 0,
    otherIn: Number(otherInflowsInput.value) || 0,

    label: currencyLabelInput.value.trim()
  };
}

function calculateLcrMetrics(data) {
  const totalHqla = data.level1 + data.level2a + data.level2b + data.buffer;

  const totalOutflows =
    data.retailOut +
    data.wholesaleOut +
    data.derivativeOut +
    data.otherOut;

  const totalInflows =
    data.securedIn +
    data.unsecuredIn +
    data.otherIn;

  const inflowCap = totalOutflows * 0.75;
  const recognizedInflows = Math.min(totalInflows, inflowCap);
  const netCashOutflows = Math.max(totalOutflows - recognizedInflows, 0.0001);
  const lcr = (totalHqla / netCashOutflows) * 100;

  return {
    totalHqla,
    totalOutflows,
    totalInflows,
    inflowCap,
    recognizedInflows,
    netCashOutflows,
    lcr
  };
}

function getLcrStatus(lcr) {
  if (lcr >= 100) {
    return {
      label: "Above 100%",
      className: "status-pass",
      badgeClass: "badge-good"
    };
  }

  if (lcr >= 90) {
    return {
      label: "Close to 100%",
      className: "status-watch",
      badgeClass: "badge-warn"
    };
  }

  return {
    label: "Below 100%",
    className: "status-fail",
    badgeClass: "badge-bad"
  };
}

function buildInterpretation(metrics, label) {
  const status = getLcrStatus(metrics.lcr).label;
  const entity = label ? ` for ${label}` : "";

  if (status === "Above 100%") {
    return `The calculated LCR${entity} is above 100%, indicating that the entered stock of liquid assets exceeds estimated net stressed 30-day outflows under this simplified Basel-style framework.`;
  }

  if (status === "Close to 100%") {
    return `The calculated LCR${entity} is close to the 100% threshold. This suggests a relatively narrow margin above or near the minimum benchmark and may warrant closer liquidity monitoring.`;
  }

  return `The calculated LCR${entity} is below 100%, indicating that the entered stock of liquid assets is lower than estimated net stressed 30-day outflows in this simplified Basel-style scenario.`;
}

function updateSummary(metrics, label) {
  const status = getLcrStatus(metrics.lcr);

  lcrValueEl.textContent = formatPercent(metrics.lcr);
  lcrStatusEl.textContent = status.label;
  lcrStatusEl.className = `summary-value ${status.className}`;

  hqlaValueEl.textContent = formatNumber(metrics.totalHqla);
  ncoValueEl.textContent = formatNumber(metrics.netCashOutflows);

  totalHqlaDisplayEl.textContent = formatNumber(metrics.totalHqla);
  totalOutflowsDisplayEl.textContent = formatNumber(metrics.totalOutflows);
  totalInflowsDisplayEl.textContent = formatNumber(metrics.totalInflows);
  inflowCapDisplayEl.textContent = formatNumber(metrics.inflowCap);
  recognizedInflowsDisplayEl.textContent = formatNumber(metrics.recognizedInflows);
  netOutflowsDisplayEl.textContent = formatNumber(metrics.netCashOutflows);

  interpretationTextEl.textContent = buildInterpretation(metrics, label);
}

function buildScenarioTable(baseData) {
  const scenarios = [
    {
      name: "Base Case",
      hqlaMultiplier: 1.0,
      outflowMultiplier: 1.0
    },
    {
      name: "Outflows +10%",
      hqlaMultiplier: 1.0,
      outflowMultiplier: 1.1
    },
    {
      name: "Outflows +20%",
      hqlaMultiplier: 1.0,
      outflowMultiplier: 1.2
    },
    {
      name: "HQLA -10%",
      hqlaMultiplier: 0.9,
      outflowMultiplier: 1.0
    },
    {
      name: "HQLA -15% / Outflows +15%",
      hqlaMultiplier: 0.85,
      outflowMultiplier: 1.15
    }
  ];

  scenarioTableBodyEl.innerHTML = "";

  scenarios.forEach((scenario) => {
    const scenarioData = {
      ...baseData,
      level1: baseData.level1 * scenario.hqlaMultiplier,
      level2a: baseData.level2a * scenario.hqlaMultiplier,
      level2b: baseData.level2b * scenario.hqlaMultiplier,
      buffer: baseData.buffer * scenario.hqlaMultiplier,
      retailOut: baseData.retailOut * scenario.outflowMultiplier,
      wholesaleOut: baseData.wholesaleOut * scenario.outflowMultiplier,
      derivativeOut: baseData.derivativeOut * scenario.outflowMultiplier,
      otherOut: baseData.otherOut * scenario.outflowMultiplier
    };

    const metrics = calculateLcrMetrics(scenarioData);
    const status = getLcrStatus(metrics.lcr);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${scenario.name}</td>
      <td>${formatNumber(metrics.totalHqla)}</td>
      <td>${formatNumber(metrics.netCashOutflows)}</td>
      <td>${formatPercent(metrics.lcr)}</td>
      <td><span class="badge ${status.badgeClass}">${status.label}</span></td>
    `;
    scenarioTableBodyEl.appendChild(row);
  });
}

function updateCalculator() {
  const inputs = getInputs();
  const metrics = calculateLcrMetrics(inputs);

  updateSummary(metrics, inputs.label);
  buildScenarioTable(inputs);
}

function resetCalculator() {
  level1AssetsInput.value = "180";
  level2aAssetsInput.value = "40";
  level2bAssetsInput.value = "20";
  additionalBufferInput.value = "10";

  retailOutflowsInput.value = "90";
  wholesaleOutflowsInput.value = "70";
  derivativeOutflowsInput.value = "25";
  otherOutflowsInput.value = "15";

  securedInflowsInput.value = "30";
  unsecuredInflowsInput.value = "40";
  otherInflowsInput.value = "20";

  currencyLabelInput.value = "";

  updateCalculator();
}

[
  level1AssetsInput,
  level2aAssetsInput,
  level2bAssetsInput,
  additionalBufferInput,
  retailOutflowsInput,
  wholesaleOutflowsInput,
  derivativeOutflowsInput,
  otherOutflowsInput,
  securedInflowsInput,
  unsecuredInflowsInput,
  otherInflowsInput,
  currencyLabelInput
].forEach((input) => {
  input.addEventListener("input", updateCalculator);
});

calculateBtn.addEventListener("click", updateCalculator);
resetBtn.addEventListener("click", resetCalculator);

document.addEventListener("DOMContentLoaded", updateCalculator);
