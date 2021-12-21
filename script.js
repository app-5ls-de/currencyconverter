const relativeTime = new RelativeTime("en");

const el_select_from = document.getElementById("select_from");
const el_select_to = document.getElementById("select_to");
const el_input_from = document.getElementById("input_from");
const el_input_to = document.getElementById("input_to");
const div_updated_at = document.getElementById("updated_at");

const base_currency = "EUR";
var rates = {
  [base_currency]: 1,
};

const update_rates = () =>
  fetch(
    "https://freecurrencyapi.net/api/v2/latest?apikey=2cefa430-5ffb-11ec-903b-796c33e59667"
  )
    .then((response) => {
      if (response.ok) {
        return Promise.resolve(response);
      } else {
        return Promise.reject(new Error(response.statusText));
      }
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.data && data.data.length && data.query.timestamp) {
        return Promise.resolve(data);
      } else {
        return Promise.reject(new Error("empty data"));
      }
    })
    .then((data) => {
      localStorage.setItem("rates", JSON.stringify(data));
      rates = data.data;

      show_updated_at(data.query.timestamp * 1000);
      set_select_data();
    });

const get_convertion_rate = (from, to) => rates[to] / rates[from];
const get_currencies = () => Object.keys(rates).sort();

function get_rates() {
  if (localStorage.getItem("rates")) {
    let data = JSON.parse(localStorage.getItem("rates"));
    rates = data.data;
    show_updated_at(data.query.timestamp * 1000);

    if (new Date() - data.query.timestamp * 1000 < relativeTime.UNITS.day)
      return; // skip update if less than 24h old
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
  localStorage.setItem("from", select_from.selected());
  if (el_input_from.value)
    el_input_to.value = (
      get_convertion_rate(select_from.selected(), select_to.selected()) *
      el_input_from.value
    ).toFixed(2);
}

function update_backward() {
  localStorage.setItem("to", select_to.selected());
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
