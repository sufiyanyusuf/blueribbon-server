"use strict";
// take frequency vector and return offset in days
exports.__esModule = true;
var Defaults_1 = require("./Defaults");
var FrequencyTimeMapping = function (f) {
    if (f == Defaults_1.Units.frequency.perDay) {
        return 1;
    }
    if (f == Defaults_1.Units.frequency.perWeek) {
        return 7;
    }
    if (f == Defaults_1.Units.frequency.perMonth) {
        return 30;
    }
    if (f == Defaults_1.Units.frequency.perYear) {
        return 365;
    }
    return null;
};
var getFrequencyOffset = function (f) {
    if (f) {
        return (Math.trunc(FrequencyTimeMapping(f.unit) / f.value));
    }
    else {
        return 0;
    }
};
exports.resolveOffset = function (f) {
    console.log(getFrequencyOffset(f));
    return getFrequencyOffset(f);
};
// [{"Product":{"size":"Small"}},{"Frequency":{"unit":"per month","value":1}},{"Quantity":6},{"Length":{"unit":"Month","value":1}}]
