const relativeTime = new RelativeTime("en");

const base_currency = "EUR";
var rates = {
  [base_currency]: 1,
};

const update_rates = () =>
  fetch(
    "https://freecurrencyapi.net/api/v2/latest?apikey=2cefa430-5ffb-11ec-903b-796c33e59667&base_currency=" +
      base_currency
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
      localStorage.setItem("rates", JSON.stringify(data));
      rates = data.data;

      set_select_data();
    });

const get_convertion_rate = (from, to) => rates[to] / rates[from];
const get_currencies = () => Object.keys(rates).sort();

function get_rates() {
  if (localStorage.getItem("rates")) {
    let data = JSON.parse(localStorage.getItem("rates"));
    rates = data.data;

    if (new Date() - data.query.timestamp * 1000 < relativeTime.UNITS.day)
      return; // skip update if less than 24h old
  }

  update_rates();
}

function set_select_data() {
  let data = get_currencies().map((currency) => ({ text: currency }));

  select_from.setData(data);
  select_to.setData(data);

  select_from.set(base_currency);
  select_to.set(base_currency);
}

get_rates();

const select_from = new SlimSelect({ select: "#select_from" });
const select_to = new SlimSelect({ select: "#select_to" });

set_select_data();
