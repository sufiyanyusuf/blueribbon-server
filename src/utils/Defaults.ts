
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


export namespace StateMachine{

    export enum States{
        ineligible='ineligible',
        initiated='initiated',
        shipped='shipped',
        failure='failure',
        successful='successful',
        inactive='inactive',
        active='active',
        paused='paused',

    }
    export enum events{
        endCycle = 'END_CYCLE',
        resetCycle = 'RESET_CYCLE',
        activate = 'ACTIVATE',
        pause = 'PAUSE',
        resume = 'RESUME',
        expired = 'EXPIRED',
        initiated = 'INITIATED',
        shipped = 'SHIPPED',
        success = 'SUCCESS',
        failure = 'FAILURE',
        paymentSuccess = 'PAYMENT_SUCCESS',
        paymentDeclined = 'PAYMENT_DECLINED',

    }
}




