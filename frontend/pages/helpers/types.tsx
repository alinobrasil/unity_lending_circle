import { Chain } from "@rainbow-me/rainbowkit";

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

export type MyChains = {
    scrollSepolia: Chain;
    mantleTestnet: Chain;
    [key: string]: Chain; // This is the index signature
};