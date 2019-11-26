// take frequency vector and return offset in days

import {Units,Types} from './Defaults'

const FrequencyTimeMapping = (f:Units.frequency):number => {

        if (f == Units.frequency.perDay) {
            return 1
        }
        if (f == Units.frequency.perWeek) {
            return 7
        }
        if (f == Units.frequency.perMonth) {
            return 30
        }
        if (f == Units.frequency.perYear) {
            return 365
        }
    

    return null
}

const getFrequencyOffset = (f: Types.frequency): number => {
    if (f) {
        return (Math.trunc(FrequencyTimeMapping(f.unit)/f.value))
    } else {
        return 0
    }
}

export const resolveOffset = (f: Types.frequency): number => {
    console.log(getFrequencyOffset(f))
    return getFrequencyOffset(f)
}

// [{"Product":{"size":"Small"}},{"Frequency":{"unit":"per month","value":1}},{"Quantity":6},{"Length":{"unit":"Month","value":1}}]

