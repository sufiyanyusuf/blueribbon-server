"use strict";
// take period, frequency vectors and resolve to a scalar quantity
//weekly, for 3 months = 12 - (1,3,4)
exports.__esModule = true;
var Defaults_1 = require("./Defaults");
var TimeFrequencyMapping = function (t, f) {
    if (f == Defaults_1.Units.frequency.perDay) {
        if (t == Defaults_1.Units.time.day) {
            return 1;
        }
        if (t == Defaults_1.Units.time.week) {
            return 7;
        }
        if (t == Defaults_1.Units.time.month) {
            return 30;
        }
        if (t == Defaults_1.Units.time.year) {
            return 365;
        }
    }
    if (f == Defaults_1.Units.frequency.perWeek) {
        if (t == Defaults_1.Units.time.week) {
            return 1;
        }
        if (t == Defaults_1.Units.time.month) {
            return 4;
        }
        if (t == Defaults_1.Units.time.year) {
            return 52;
        }
    }
    if (f == Defaults_1.Units.frequency.perMonth) {
        if (t == Defaults_1.Units.time.month) {
            return 1;
        }
        if (t == Defaults_1.Units.time.year) {
            return 12;
        }
    }
    if (f == Defaults_1.Units.frequency.perYear) {
        if (t == Defaults_1.Units.time.year) {
            return 1;
        }
    }
    return null;
};
var getIntervals = function (t, f) {
    if (t && f) {
        if (t.value == 0) {
            return f.value;
        }
        return (t.value * f.value * TimeFrequencyMapping(t.unit, f.unit));
    }
    else {
        return 0;
    }
};
exports.resolve = function (t, f) {
    return getIntervals(t, f);
};
// [{"Product":{"size":"Small"}},{"Frequency":{"unit":"per month","value":1}},{"Quantity":6},{"Length":{"unit":"Month","value":1}}]
