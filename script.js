const relativeTime = new RelativeTime("en");

var rates;
const base_currency = "EUR";

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

      return data;
    });

const get_convertion_rate = (from, to) => rates[to] / rates[from];
const get_currencies = () => Object.keys(rates).sort();

function get_rates() {
  if (localStorage.getItem("rates")) {
    let data = JSON.parse(localStorage.getItem("rates"));
    rates = data.data;

    if (new Date() - data.query.timestamp * 1000 > relativeTime.UNITS.day)
      update_rates();
  } else {
    update_rates();

    rates = {
      [base_currency]: 1,
    };
  }
}

get_rates();
