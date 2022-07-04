// (modified) From: https://github.com/yairEO/relative-time
function RelativeTime(locale = "en", minimal_unit = "second", options = {}) {
  options.numeric = options.numeric || "auto";
  const rtf = new Intl.RelativeTimeFormat(locale, options);

  // in miliseconds
  const UNITS = {
    year: 1000 * 60 * 60 * 24 * 365,
    month: (1000 * 60 * 60 * 24 * 365) / 12,
    day: 1000 * 60 * 60 * 24,
    hour: 1000 * 60 * 60,
    minute: 1000 * 60,
    second: 1000,
  };

  function from(d1, d2 = new Date()) {
    const elapsed = d1 - d2;

    if (Math.round(elapsed / UNITS[minimal_unit]) == 0)
      return rtf.format(0, "second");

    // "Math.abs" accounts for both "past" & "future" scenarios
    for (const u in UNITS)
      if (Math.abs(elapsed) > UNITS[u] || u == minimal_unit)
        return rtf.format(Math.round(elapsed / UNITS[u]), u);
  }
  from.UNITS = UNITS;

  return from;
}

const relativeTime = new RelativeTime("en", "minute");

const el_select_from = document.getElementById("select_from");
const el_select_to = document.getElementById("select_to");
const el_input_from = document.getElementById("input_from");
const el_input_to = document.getElementById("input_to");
const div_updated_at = document.getElementById("updated_at");

const select_from = new SlimSelect({ select: el_select_from });
const select_to = new SlimSelect({ select: el_select_to });

const base_currency = "EUR";
var rates = {
  [base_currency]: 1,
};

async function update_rates() {
  const response = await fetch(
    "https://freecurrencyapi.net/api/v2/latest?apikey=2cefa430-5ffb-11ec-903b-796c33e59667&base_currency=" +
      base_currency
  );
  if (!response.ok) throw new Error(response.statusText);
  const data_raw = await response.json();

  if (!data_raw?.data?.[base_currency])
    throw new Error("Failed to fetch rates");

  let data = {
    timestamp: data_raw.query.timestamp,
    rates: data_raw.data,
  };

  localStorage.setItem("rates", JSON.stringify(data));
  rates = data.rates;

  show_updated_at(data.timestamp * 1000);
  set_select_data();
}

async function show_history() {
  const from = select_from.selected() || base_currency;
  const to = select_to.selected() || base_currency;
  if (from == to) {
    return;
  }

  var history = JSON.parse(localStorage.getItem("history"));

  // skip update if valid and less than a week old
  if (
    !(
      history?.data?.[Object.keys(history.data)[0]]?.[base_currency] &&
      history?.query?.timestamp &&
      new Date() - history.query.timestamp * 1000 < relativeTime.UNITS.day * 7
    )
  ) {
    const date_to = new Date().toISOString().split("T")[0];
    const date_from = new Date(new Date() - 3 * relativeTime.UNITS.month)
      .toISOString()
      .split("T")[0];

    const response = await fetch(
      "https://freecurrencyapi.net/api/v2/historical?apikey=2cefa430-5ffb-11ec-903b-796c33e59667&base_currency=" +
        base_currency +
        "&date_from=" +
        date_from +
        "&date_to=" +
        date_to
    );
    if (!response.ok) throw new Error(response.statusText);
    const data_raw = await response.json();

    if (!data_raw?.data?.[date_from]?.[base_currency])
      throw new Error("Failed to fetch rates");

    history = data_raw;
    localStorage.setItem("history", JSON.stringify(history));
  }

  if (!history) return;

  var data = Object.values(history.data).map((entry) =>
    get_convertion_rate(from, to, entry)
  );
  console.log(data);

  const labels = Object.keys(history.data);

  const myChart = new Chart(document.getElementById("myChart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "My First dataset",
          backgroundColor: "rgb(255, 99, 132)",
          borderColor: "rgb(255, 99, 132)",
          data,
        },
      ],
    },
    options: {
      elements: {
        line: {
          tension: 0.4,
        },
      },
    },
  });
}

const get_convertion_rate = (from, to, r = rates) => r[to] / r[from];

function get_rates() {
  let data = JSON.parse(localStorage.getItem("rates"));
  if (data?.rates?.[base_currency]) {
    rates = data.rates;
    show_updated_at(data.timestamp * 1000);

    if (new Date() - data.timestamp * 1000 < relativeTime.UNITS.day) return; // skip update if less than a day old
  }

  update_rates();
}

function show_updated_at(timestamp) {
  div_updated_at.innerText = "Updated " + relativeTime(timestamp);
}

function set_select_data() {
  let data = Object.keys(rates)
    .sort()
    .map((currency) => ({ text: currency }));

  select_from.setData(data);
  select_to.setData(data);

  select_from.set(localStorage.getItem("from") || base_currency);
  select_to.set(localStorage.getItem("to") || base_currency);
}

function update_forward() {
  const from = select_from.selected() || base_currency;
  const to = select_to.selected() || base_currency;

  localStorage.setItem("from", from);
  if (el_input_from.value) {
    el_input_to.value = (
      get_convertion_rate(from, to) * el_input_from.value
    ).toFixed(2);
  } else el_input_to.value = "";
}

function update_backward() {
  const from = select_from.selected() || base_currency;
  const to = select_to.selected() || base_currency;

  localStorage.setItem("to", to);
  if (el_input_to.value) {
    el_input_from.value = (
      get_convertion_rate(from, to) * el_input_to.value
    ).toFixed(2);
  } else el_input_from.value = "";
}

get_rates();
set_select_data();
show_history();

el_input_from.addEventListener("input", update_forward);
el_select_from.addEventListener("change", () => {
  update_forward();
  show_history();
});

el_input_to.addEventListener("input", update_backward);
el_select_to.addEventListener("change", () => {
  update_backward();
  show_history();
});
