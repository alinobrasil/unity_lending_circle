// pages/circle/[id]/index.tsx
'use client';
import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import NavBar from '../../components/NavBar';
import { useAccount, useContractRead, useNetwork, useContractWrite } from 'wagmi';
import { useState, useEffect } from 'react';
import { ValidChains, PeriodType } from '../../helpers/types';
import { Address } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { Config } from '../../helpers/config';
import { utils } from 'ethers';
import { useContractWriteResult } from '../../helpers/types'
import ParticipantsTable from '../../components/ParticipantsTable';

const User = () => {
    const router = useRouter();
    const { address } = router.query;
    console.log(address)

    //user's address
    const { address: connectedAddress } = useAccount();
    // console.log("Connected address: ", connectedAddress)


    //state variables ----------------------------------------------------------
    const [currentChain, setCurrentChain] = useState('scrollSepolia' as ValidChains)
    const { chain, chains } = useNetwork();
    const [client, setClient] = useState<any>(null)


    // useEffects---------------------------------------------------------------


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



    // if (!routeAddress) return <p>Loading...</p>;

    return (
        <div>
            <NavBar />


            <div className='body-area'>

                <h1>User Details</h1>
                <h2>Address: {address}</h2>

            </div>
        </div>


    );
};

export default User;
