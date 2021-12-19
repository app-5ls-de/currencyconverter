// (modified) From: https://github.com/yairEO/relative-time

(function (root, factory) {
  root.RelativeTime = factory();
})(this, function () {
  // in miliseconds
  const UNITS = {
    year: 24 * 60 * 60 * 1000 * 365,
    month: (24 * 60 * 60 * 1000 * 365) / 12,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000,
  };

  const DEFAULTS = {
    locale: "en",
    options: { numeric: "auto" },
  };

  function RelativeTime(locale = DEFAULTS.locale, options) {
    const opts = { ...DEFAULTS.options, ...options };
    const rtf = new Intl.RelativeTimeFormat(locale, opts);

    function from(d1, d2 = new Date()) {
      const elapsed = d1 - d2;

      // "Math.abs" accounts for both "past" & "future" scenarios
      for (const u in UNITS)
        if (Math.abs(elapsed) > UNITS[u] || u == "second")
          return rtf.format(Math.round(elapsed / UNITS[u]), u);
    }
    from.UNITS = UNITS;

    return from;
  }

  return RelativeTime;
});
