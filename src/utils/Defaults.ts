
export namespace Units{

    export enum time {
        day="Day",
        week="Week",
        month="Month",
        year="Year",
    }

    export enum frequency {
        perDay="per Day",
        perWeek="per Week",
        perMonth="per Month",
        perYear="per Year" 
    }
    
}

export namespace Types {

    export interface time {
        unit: Units.time,
        value: number 
    }
    
    export interface frequency {
        unit: Units.frequency,
        value: number 
    } 
    
}





