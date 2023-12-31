'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';

import { useAccount, useContractRead, useNetwork } from 'wagmi';
import LendingCircleArtifact from '../helpers/LendingCircle.json'
import NavBar from '../components/NavBar';
import { Config } from '../helpers/config';
import { Address } from 'wagmi'

import dynamic from 'next/dynamic';
import BasicTable from '../components/BasicTable';

import { UseContractReadResult, ValidChains, CircleInfo, MyChains } from '../helpers/types'

import { ethers } from 'ethers';
import { createPublicClient, http } from 'viem';
import Link from 'next/link';
import { myChains } from '../helpers/config';

const Home: NextPage = () => {
  // view all lending circles, split into active, pending & completed circles
  // admin gets option to create new circle
  // active participants get to see circles they're currently involved in

  const [circles, setCircles] = useState<any>([])
  const [circleCount, setCircleCount] = useState(0)
  const [currentChain, setCurrentChain] = useState('scrollSepolia' as ValidChains)
  const { chain, chains } = useNetwork();
  const [adminList, setAdminList] = useState<Address[]>([])
  const [userType, setUserType] = useState("user")

  // let client: any;

  // console.log(chain)

  // Set currentChain and circleCount, whenever chain changes
  useEffect(() => {
    function isValidChain(chainName: string): chainName is ValidChains {
      return chainName === "scrollSepolia" || chainName === "mantleTestnet";
    }

    if (address) {
      const client = createPublicClient({
        chain: myChains[chain?.network as keyof typeof myChains],
        transport: http()
      })



      const getCircleCount = async (): Promise<number> => {
        try {
          const data: any = await client.readContract({
            address: Config[currentChain].contractAddress as Address,
            abi: Config[currentChain].abi,
            functionName: 'circleCount',
          })

          const result = parseInt(data.toString())
          // console.log("viem got circle count: ", result)

          return result
        } catch (error) {
          console.error("There was an error fetching the data:", error);
          return 0
        }
      };

      if (chain && isValidChain(chain.network)) {

        setCurrentChain(chain.network);

        getCircleCount().then((result) => {
          setCircleCount(result)
        })
      }

      const getArrays = async () => {

        //get Admin  list
        const data0: any = await client.readContract({
          address: Config[currentChain].contractAddress as Address,
          abi: Config[currentChain].abi,
          functionName: 'admins',
          args: ['']
        })
        // console.log("admins:")
        // console.log(data0)
        if (typeof data0 === 'string') {
          setAdminList([data0 as Address])
        } else {
          console.log("admins not string")
        }
      }
      getArrays()
    }

  }, [chain])

  //user's address
  const { address } = useAccount();

  useEffect(() => {
    if (circleCount > 0 && address) {
      viewCircles()
    }
  }, [circleCount])

  useEffect(() => {
    if (address) {

      if (adminList.includes(address as Address)) {
        setUserType("admin")
      } else {
        setUserType("user")
      }
    }
  }, [adminList])

  useEffect(() => {
    if (address) {
      console.log("userType: ", userType)
    }
  }, [userType])


  //display welcome message if user is not connected
  const welcomePage = () => {
    return (
      <div className="body-area">

        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Unity Lending Circles
        </h1>

        <p>Get started by connecting your wallet </p>

        <ConnectButton />
      </div>
    )

  }

  const viewCircles = async () => {
    if (address) {
      const client = createPublicClient({
        chain: myChains[chain?.network as keyof typeof myChains],
        transport: http()
      })
      //get all circles
      let circle: CircleInfo;
      console.log("total# of circles: ", circleCount)

      let circleArray = []

      for (let i = 0; i < circleCount; i++) {
        const data: any = await client.readContract({
          address: Config[currentChain].contractAddress as Address,
          abi: Config[currentChain].abi,
          functionName: 'getCircleDetails',
          args: [i.toString()]
        })

        // console.log(data)
        const id = data[0].toString();
        const name = data[1]
        const numberOfPeriods = parseInt(data[5].toString())
        const currentPeriodNumber = parseInt(data[7].toString())


        // console.log("id: ", id)
        // console.log("name: ", name)
        // console.log("numberOfPeriods: ", numberOfPeriods)
        // console.log("currentPeriodNumber: ", currentPeriodNumber)

        circleArray[i] = { id, name, numberOfPeriods, currentPeriodNumber }

      }
      setCircles(circleArray)
    }
  }

  return (
    <div >
      <Head>
        <title>Lending Circle - Ali Kim</title>
        <meta
          content="Generated by @rainbow-me/create-rainbowkit"
          name="Eth Global Online 2023"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <NavBar />

      {address ?
        (
          <div className="body-area">



            <h1 className="text-4xl font-semibold text-gray-800 leading-tight mb-4">
              Circles On Chain {currentChain}
            </h1>

            {/* only admin can create circle */}
            {userType === "admin" ?
              (

                <Link href='/CreateCircle'>
                  <button className='btn btn-primary'>
                    Create New Circle
                  </button>
                  <br />
                </Link>

              ) : null}

            <br />


            <BasicTable rows={circles} />


          </div>
        ) : (
          <div>
            {welcomePage()}
          </div>
        )}

      <div className='text-center fixed bottom-0 w-full'>
        <a href="https://twitter.com/alik_im" rel="noopener noreferrer" target="_blank">
          Made with ❤️ by Ali Kim
        </a>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Home), { ssr: false })

