'use client';
import React, { useState, useEffect } from 'react'
import NavBar from './components/NavBar'
import { useContractRead, useAccount, useContractWrite, useNetwork } from 'wagmi'
import { Config } from './helpers/config'
import { Address } from 'wagmi'
import { ethers } from 'ethers'
import dynamic from 'next/dynamic';
import { LoadingModal, SuccessModal } from './components/Modals'
import { useContractWriteResult, UseContractReadResult, ValidChains } from './helpers/types'
import LendingCircleArtifact from './helpers/LendingCircle.json'

function CreateCircle() {

    const [circleName, setCircleName] = useState('')
    const [contributionAmount, setContributionAmount] = useState('')
    const [numberOfPeriods, setNumberOfPeriods] = useState('0')
    const [periodType, setPeriodType] = useState('0')
    const [adminFeePercentage, setAdminFeePercentage] = useState('0')


    //get current chain
    const [currentChain, setCurrentChain] = useState('scrollSepolia' as ValidChains)
    const { chain, chains } = useNetwork();

    useEffect(() => {
        if (chain && isValidChain(chain.network)) {
            setCurrentChain(chain.network);
        }

        function isValidChain(chainName: string): chainName is ValidChains {
            return chainName === "scrollSepolia" || chainName === "mantleTestnet";
        }
    }, [chain])

    useEffect(() => {
        console.log("current chain: ", currentChain)
    }, [currentChain])


    const { address } = useAccount();
    // console.log("user address: ", address)
    // console.log("contract address:", Config.scrollSepolia.contractAddress)


    //fetch # of circles
    const [cirleCount, setCircleCount] = useState(0)

    const { data: dataCircleCount, isError, isLoading } = useContractRead({
        address: Config[currentChain].contractAddress as Address,
        abi: LendingCircleArtifact.abi,
        functionName: 'circleCount',
    }) as UseContractReadResult

    useEffect(() => {
        if (dataCircleCount) {
            setCircleCount(parseInt(dataCircleCount.toString()))
        }

    }, [dataCircleCount])

    useEffect(() => {
        console.log("circle count: ", cirleCount)
    }, [cirleCount])

    const { data, isLoading: isLoadingWrite, isSuccess: isSuccessWrite, write: writeCreateCircle } = useContractWrite({
        address: Config[currentChain].contractAddress as Address,
        abi: Config[currentChain].abi,
        functionName: 'createCircle',
    }) as useContractWriteResult


    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Prevents page refresh

        // force integer on these fields
        setNumberOfPeriods(parseInt(numberOfPeriods).toString())
        setPeriodType(parseInt(periodType).toString())
        setAdminFeePercentage(parseInt(adminFeePercentage).toString())

        const formData = {
            circleName,
            contributionAmount,
            numberOfPeriods,     // int
            periodType,          // int
            adminFeePercentage
        };

        // Log or handle the data as necessary. In a real application, this might involve
        // sending the data to a backend service, updating some local state, etc.
        console.log(formData);

        // Optionally reset form fields after submission, if required
        // setCircleName('');
        // setContributionAmount(0);
        // setNumberOfPeriods(0);
        // setFrequency('Every 5-minutes');
        // setAdminFeePercentage(0);


        writeCreateCircle({
            args: [
                circleName,
                ethers.utils.parseEther(contributionAmount).toString(),
                numberOfPeriods,
                adminFeePercentage,
                periodType
            ],
            from: address,
        })

    };

    return (
        <>
            <NavBar />

            <div className='body-area'>

                <p className='title'>Create New Lending Circle</p>

                <p>
                    Enter the details of the lending circle you would like to create.
                </p>

                <br />

                <div className="mx-auto px-4 max-w-xl">

                    <form onSubmit={handleSubmit}>
                        <label className="block mb-4">
                            Circle Name:
                            <input
                                type="text"
                                value={circleName}
                                onChange={(e) => setCircleName(e.target.value)}
                                className="mt-1 p-2 border rounded w-full"
                            />
                        </label>

                        <label className="block mb-4">
                            Contribution Amount (ETH):
                            <input
                                type="number"
                                value={contributionAmount}
                                onChange={(e) => setContributionAmount(e.target.value)}
                                className="mt-1 p-2 border rounded w-full"
                            />
                        </label>

                        <label className="block mb-4">
                            Period Type (Payment Frequency):
                            <select
                                value={periodType}
                                onChange={(e) => setPeriodType(e.target.value)}
                                className="mt-1 p-2 border rounded w-full"
                            >
                                <option value="0">Every 5-minutes</option>
                                <option value="1">Hourly</option>
                                <option value="2">Daily</option>
                                <option value="3">Weekly</option>
                            </select>
                        </label>

                        <label className="block mb-4">
                            Number of Periods (Integer):
                            <input
                                type="number"
                                value={numberOfPeriods}
                                onChange={(e) => setNumberOfPeriods(e.target.value)}
                                className="mt-1 p-2 border rounded w-full"
                            />
                        </label>



                        <label className="block mb-4">
                            Admin Fee Percentage (Integer):
                            <input
                                type="number"
                                value={adminFeePercentage}
                                onChange={(e) => setAdminFeePercentage(e.target.value)}
                                className="mt-1 p-2 border rounded w-full"
                            />
                        </label>


                        <button type='submit'
                            value='Submit'
                            className="p-2 bg-blue-500 text-white rounded"
                        >Submit</button>


                    </form>
                    {isLoadingWrite && <LoadingModal />}

                    {isSuccessWrite && <SuccessModal />}
                </div>
            </div>


        </>
    )
}


export default dynamic(() => Promise.resolve(CreateCircle), { ssr: false })
