export type UseContractReadResult = {
    data: any;
    isError: boolean;
    isLoading: boolean;
};

export type useContractWriteResult = {
    data: any,
    isLoading: boolean,
    isSuccess: boolean,
    write: any
}

export type ValidChains = "scrollSepolia" | "mantleTestnet";
// set current chain


export type CircleInfo = {
    id: number;
    name: string;
    contributionAmount: string;
    periodType: string;
    periodDuration: PeriodType,
    numberOfPeriods: number,
    adminFeePercentage: number,
    currentPeriodNumber: number,
    nextDueTime: number,
    contributorsThisPeriod: number
}

export enum PeriodType {
    Every5Minutes,
    Hourly,
    Daily,
    Weekly
}