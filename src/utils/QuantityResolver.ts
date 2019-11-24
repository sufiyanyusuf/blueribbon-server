// take period, frequency vectors and resolve to a scalar quantity
//weekly, for 3 months = 12 - (1,3,4)

import {Units,Types} from './Defaults'

const TimeFrequencyMapping = (t:Units.time,f:Units.frequency):number => {
    if (f == Units.frequency.perDay) {
        if (t == Units.time.day) {
            return 1
        }
        if (t == Units.time.week) {
            return 7
        }
        if (t == Units.time.month) {
            return 30
        }
        if (t == Units.time.year) {
            return 365
        }
    }
    if (f == Units.frequency.perWeek) {
        if (t == Units.time.week) {
            return 1
        }
        if (t == Units.time.month) {
            return 4
        }
        if (t == Units.time.year) {
            return 52
        }
    }
    if (f == Units.frequency.perMonth) {
        if (t == Units.time.month) {
            return 1
        }
        if (t == Units.time.year) {
            return 12
        }
    }
    if (f == Units.frequency.perYear) {
        if (t == Units.time.year) {
            return 1
        }
    }
    return null
}

const get = (t: Types.time, f: Types.frequency): number => {
    if (t && f) {
        return (t.value*f.value*TimeFrequencyMapping(t.unit,f.unit))
    } else {
        return 0
    }
}

export const resolve = (t: Types.time, f: Types.frequency) => {
    console.log(get(t,f))
}

// [{"Product":{"size":"Small"}},{"Frequency":{"unit":"per month","value":1}},{"Quantity":6},{"Length":{"unit":"Month","value":1}}]

