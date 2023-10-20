// pages/circle/[id]/index.tsx
'use client';
import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import NavBar from '../../components/NavBar';
import { useAccount, useContractRead, useNetwork } from 'wagmi';
import { useState, useEffect } from 'react';
import { ValidChains, PeriodType } from '../../helpers/types';
import { Address } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { Config } from '../../helpers/config';
import { utils } from 'ethers';

const Circle = () => {
    const router = useRouter();
    const { id } = router.query; // Destructure the 'id' from the query object

    const [currentChain, setCurrentChain] = useState('scrollSepolia' as ValidChains)
    const { chain, chains } = useNetwork();
    const [client, setClient] = useState<any>(null)
    const [circle, setCircle] = useState<any>(null)




    useEffect(() => {
        function isValidChain(chainName: string): chainName is ValidChains {
            return chainName === "scrollSepolia" || chainName === "mantleTestnet";
        }
        if (chain && isValidChain(chain.network)) {
            setCurrentChain(chain.network);
        }

        setClient(createPublicClient({
            chain: chain,
            transport: http()
        }))

    }, [chain])

    useEffect(() => {
        console.log(currentChain)
    }, [chain])


    useEffect(() => {

        const getCircleDetails = async () => {
            //get all circles

            const data: any = await client.readContract({
                address: Config[currentChain].contractAddress as Address,
                abi: Config[currentChain].abi,
                functionName: 'getCircleDetails',
                args: [id]
            })

            // console.log(data)
            const circleId = data[0].toString();
            const name = data[1]
            const contributionAmount = utils.formatEther(data[2].toString())
            const periodType = data[3].toString()
            const periodDuration = parseInt(data[4].toString())
            const numberOfPeriods = parseInt(data[5].toString())
            const adminFeePercentage = parseInt(data[6].toString())
            const currentPeriodNumber = parseInt(data[7].toString())
            const nextDueTime = parseInt(data[8].toString())
            const contributorsThisPeriod = parseInt(data[9].toString())

            const result = {
                id: circleId, name, contributionAmount, periodType, periodDuration,
                numberOfPeriods, adminFeePercentage, currentPeriodNumber, nextDueTime, contributorsThisPeriod
            }

            return result

        }

        if (client && id !== undefined) {
            getCircleDetails().then((result) => {
                setCircle(result)
                console.log(result)
            })

        }

    }, [client, id])

    //user's address
    const { address } = useAccount();

    if (!id) return <p>Loading...</p>;

    function getStatus(row: any): string {
        const currentPeriodNumber = row.currentPeriodNumber
        if (currentPeriodNumber == 0) {
            return "Pending"
        } else if (currentPeriodNumber <= row.numberOfPeriods) {
            return "Active"
        } else {
            return "Completed"
        }
    }

    function getPayoutValue() {

        return (circle.numberOfPeriods * parseFloat(circle.contributionAmount)).toString()
    }

    return (
        <div>
            <NavBar />

            <div className='body-area'>

                <h1>Circle Details</h1>
                <p>ID: {id}</p>

                <p>Circle ID: {circle ? circle.id : ''}</p>
                <p>Circle Name: {circle ? circle.name : ''} </p>

                <h1>Status: {circle ? getStatus(circle) : ''}</h1>

                <p>Contribution Amount: {circle ? circle.contributionAmount + " ETH" : ''} </p>
                <p>Number of periods: {circle ? circle.numberOfPeriods : ''}</p>
                <p>Period Type: {circle ? PeriodType[circle.periodType] : ''}</p>
                <p>Payout Value: {circle ? getPayoutValue() + " ETH" : ''}</p>

                {/* TODO:If not admin/participant, show "REUEST TO JOIN" */}

                {/* TODO: Payout history */}
                {/* If user is participant, show when they got paid */}

                {/* TODO: pending list */}

                {/* TODO: approved list */}

            </div>
        </div>


    );
};

export default Circle;
