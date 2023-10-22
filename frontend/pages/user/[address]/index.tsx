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

    const { address } = router.query;
    console.log(address)

    //user's address
    const { address: connectedAddress } = useAccount();
    // console.log("Connected address: ", connectedAddress)


    //state variables ----------------------------------------------------------
    const [currentChain, setCurrentChain] = useState('scrollSepolia' as ValidChains)

    // useEffects---------------------------------------------------------------

    useEffect(() => {
        function isValidChain(chainName: string): chainName is ValidChains {
            return chainName === "scrollSepolia" || chainName === "mantleTestnet";
        }
        if (chain && isValidChain(chain.network)) {
            setCurrentChain(chain.network);
        }

        console.log("Chain network:")
        console.log(chain?.network)

        const client = createPublicClient({
            chain: myChains[chain?.network as keyof typeof myChains],
            transport: http()
        })

    }, [chain])

    useEffect(() => {
        console.log(currentChain)
    }, [chain])



    // if (!routeAddress) return <p>Loading...</p>;

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

                <h2>Credit Report</h2>

            </div>
        </div >


    );
};

export default User;
