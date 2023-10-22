// pages/circle/[id]/index.tsx
'use client';
import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import NavBar from '../../../components/NavBar';
import { useAccount, useContractRead, useNetwork, useContractWrite } from 'wagmi';
import { useState, useEffect } from 'react';
import { ValidChains, PeriodType } from '../../../helpers/types';
import { Address } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { Config } from '../../../helpers/config';
import { utils } from 'ethers';
import { useContractWriteResult } from '../../../helpers/types'
import ParticipantsTable from '../../../components/ParticipantsTable';
import { MyChains } from '../../../helpers/types';
import { myChains } from '../../../helpers/config';


const User = () => {
    const router = useRouter();

    const { chain, chains } = useNetwork();
    const [creditReport, setCreditReport] = useState<any>(null)

    const { address } = router.query;
    console.log("address: ", address)

    //user's address
    const { address: connectedAddress } = useAccount();
    // console.log("Connected address: ", connectedAddress)

    //state variables ----------------------------------------------------------
    const [currentChain, setCurrentChain] = useState('scrollSepolia' as ValidChains)


    let client: any;

    // useEffects---------------------------------------------------------------
    function isValidChain(chainName: string): chainName is ValidChains {
        return chainName === "scrollSepolia" || chainName === "mantleTestnet";
    }
    useEffect(() => {

        if (chain && isValidChain(chain.network)) {
            setCurrentChain(chain.network);
        }

        if (chain) {
            client = createPublicClient({
                chain: chain,
                transport: http()
            })

            console.log("Chain network:")
            console.log(chain?.network)


            console.log(Config)
            const fetchData = async () => {

                if (address) {
                    const data1: any = await client.readContract({
                        address: Config[currentChain].contractAddress as Address,
                        abi: Config[currentChain].abi,
                        functionName: 'getUserCircleStats',
                        args: [address]
                    })
                    // console.log("user credit report: ", data1)
                    const cleanData = {
                        totalCirclesCompleted: data1[0].toString(),
                        totalEligibleValue: utils.formatEther(data1[1]),
                        totalDebtorValue: utils.formatEther(data1[2]),
                    }
                    setCreditReport(cleanData)
                    console.log(cleanData)
                }
            }
            fetchData()


        }
    }, [currentChain])

    useEffect(() => {
        if (chain && isValidChain(chain.network)) {
            setCurrentChain(chain.network);
        }
        console.log("current chain :", currentChain)

    }, [chain])


    return (
        <div>
            <NavBar />

            <div className='body-area p-4'>

                <h1>User Details</h1>
                <h2>Address: {address}</h2>
                <div className="grid grid-cols-3 gap-4">
                    <a href={`https://web3.bio/${address}`}
                        target="_blank" rel="noopener noreferrer">
                        <button className="btn">
                            Web3.bio Profile
                        </button>
                    </a>

                    <a href={`https://opensea.io/${address}`}
                        target="_blank" rel="noopener noreferrer">
                        <button className="btn">
                            OpenSea Profile
                        </button>
                    </a>
                </div>
                <br></br>
                <h2>Credit Report</h2>

                {creditReport ? (
                    <div>
                        <p className="text-4xl text-center font-semibold text-blue-600 leading-relaxed mt-4 mb-4"
                        >Total Circles Completed: {creditReport.totalCirclesCompleted}</p>

                        <p className="text-4xl text-center font-semibold text-blue-600 leading-relaxed mt-4 mb-4"
                        >Total Debtor Value: {creditReport.totalDebtorValue} ETH</p>
                    </div>
                ) : (
                    <p>Loading...</p>
                )}


            </div>
        </div >


    );
};

export default User;
