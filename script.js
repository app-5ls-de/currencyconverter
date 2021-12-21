const relativeTime = new RelativeTime("en", "minute");

const el_select_from = document.getElementById("select_from");
const el_select_to = document.getElementById("select_to");
const el_input_from = document.getElementById("input_from");
const el_input_to = document.getElementById("input_to");
const div_updated_at = document.getElementById("updated_at");

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

  if (!(data_raw.data && data_raw.data[base_currency]))
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

const get_convertion_rate = (from, to) => rates[to] / rates[from];
const get_currencies = () => Object.keys(rates).sort();

function get_rates() {
  if (localStorage.getItem("rates")) {
    let data = JSON.parse(localStorage.getItem("rates"));
    rates = data.rates;
    show_updated_at(data.timestamp * 1000);

    if (new Date() - data.timestamp * 1000 < relativeTime.UNITS.hour) return; // skip update if less than an hour old
  }

  update_rates();
}

function show_updated_at(timestamp) {
  div_updated_at.innerText = "Updated " + relativeTime(timestamp);
}

function set_select_data() {
  let data = get_currencies().map((currency) => ({ text: currency }));

  select_from.setData(data);
  select_to.setData(data);

  select_from.set(localStorage.getItem("from") || base_currency);
  select_to.set(localStorage.getItem("to") || base_currency);
}

function update_forward() {
  localStorage.setItem("from", select_from.selected() || base_currency);
  if (el_input_from.value)
    el_input_to.value = (
      get_convertion_rate(select_from.selected(), select_to.selected()) *
      el_input_from.value
    ).toFixed(2);
}

function update_backward() {
  localStorage.setItem("to", select_to.selected() || base_currency);
  if (el_input_to.value)
    el_input_from.value = (
      get_convertion_rate(select_to.selected(), select_from.selected()) *
      el_input_to.value
    ).toFixed(2);
}

get_rates();
const select_from = new SlimSelect({ select: el_select_from });
const select_to = new SlimSelect({ select: el_select_to });

set_select_data();

el_input_from.addEventListener("input", update_forward);
el_select_from.addEventListener("change", update_forward);

el_input_to.addEventListener("input", update_backward);
el_select_to.addEventListener("change", update_backward);
