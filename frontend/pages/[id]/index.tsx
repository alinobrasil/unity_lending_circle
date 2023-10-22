// pages/circle/[id]/index.tsx
'use client';
import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import NavBar from '../../components/NavBar';
import { useAccount, useContractRead, useNetwork, useContractWrite } from 'wagmi';
import { useState, useEffect } from 'react';
import { ValidChains, PeriodType } from '../helpers/types';
import { Address } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { Config } from '../helpers/config';
import { utils } from 'ethers';
import { useContractWriteResult } from '../helpers/types'
import ParticipantsTable from '../../components/ParticipantsTable';

const Circle = () => {
    const router = useRouter();
    const { id } = router.query;

    //user's address
    const { address } = useAccount();


    //state variables ----------------------------------------------------------
    const [currentChain, setCurrentChain] = useState('scrollSepolia' as ValidChains)
    const { chain, chains } = useNetwork();
    const [client, setClient] = useState<any>(null)
    const [circle, setCircle] = useState<any>(null)
    const [tempAddressInput, setTempAddressInput] = useState<string>("")

    const [userType, setUserType] = useState<any>("") //admin, participant, neither

    const [debtorsList, setDebtorsList] = useState<Address[]>([])
    const [eligibleList, setEligibleList] = useState<Address[]>([])
    const [pendingList, setPendingList] = useState<Address[]>([])

    // smart contract WRITE functions -----------------------------------------------
    const { data: dataContribute, isLoading: isLoadingContribute, isSuccess: isSuccessContribute, write: writeContribute } = useContractWrite({
        address: Config[currentChain].contractAddress as Address,
        abi: Config[currentChain].abi,
        functionName: 'contribute',
    }) as useContractWriteResult

    const { data: dataRequestJoin, isLoading: isLoadingRequestJoin, isSuccess: isSuccessRequestJoin, write: writeRequestJoin } = useContractWrite({
        address: Config[currentChain].contractAddress as Address,
        abi: Config[currentChain].abi,
        functionName: 'requestToJoin',
    }) as useContractWriteResult

    const { data: dataApprove, isLoading: isLoadingApprove, isSuccess: isSuccessApprove, write: writeApprove } = useContractWrite({
        address: Config[currentChain].contractAddress as Address,
        abi: Config[currentChain].abi,
        functionName: 'approveJoinRequest',
    }) as useContractWriteResult


    // useEffects---------------------------------------------------------------

    //look up admin list, then participant/debtor lists
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

        //get details of Circle
        const getCircleDetails = async () => {

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

        const getArrays = async () => {

            //get PENDING list
            const data1: any = await client.readContract({
                address: Config[currentChain].contractAddress as Address,
                abi: Config[currentChain].abi,
                functionName: 'getJoinQueue',
                args: [id]
            })
            console.log("JoinQueue:")
            console.log(data1)
            setPendingList(data1)

            //get ELIGIBLE list
            const data2: any = await client.readContract({
                address: Config[currentChain].contractAddress as Address,
                abi: Config[currentChain].abi,
                functionName: 'getEligibleRecipients',
                args: [id]
            })
            console.log("EligibleRecipients:")
            console.log(data2)
            setEligibleList(data2)


            // get DEBTORS list
            const data3: any = await client.readContract({
                address: Config[currentChain].contractAddress as Address,
                abi: Config[currentChain].abi,
                functionName: 'getDebtors',
                args: [id]
            })
            console.log("Debtors:")
            console.log(data3)
            setDebtorsList(data3)

        }

        if (client && id !== undefined) {
            getCircleDetails().then((result) => {
                setCircle(result)
                console.log(result)
            })

            getArrays()

        }
    }, [client, id, isSuccessRequestJoin, isSuccessApprove])







    //handler functions --------------------------------------------------------
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

    const contribute = () => {
        console.log("contribute")
        // totalAmount = (circle.contributionAmount *
        //     (100 + circle.adminFeePercentage)) / 100;

        const amountDue = parseFloat(circle.contributionAmount) * (100 + circle.adminFeePercentage) / 100
        console.log("amount due: ", amountDue)

        writeContribute({
            args: [
                id
            ],
            from: address,
            value: utils.parseEther(amountDue.toString())
        })
    }

    const requestJoin = () => {
        // person gets to request to join a circle
        const amountDue = parseFloat(circle.contributionAmount) * (100 + circle.adminFeePercentage) / 100
        console.log("amount due: ", amountDue)

        writeRequestJoin({
            args: [
                id
            ],
            from: address,
            value: utils.parseEther(amountDue.toString())
        })
    }

    const approveJoin = () => {
        // admin gets to approve a person to join a circle

        console.log(tempAddressInput)
        writeApprove({
            args: [
                id,
                tempAddressInput
            ],
            from: address,
        })
    }

    if (!id) return <p>Loading...</p>;

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
                {/* If admin, extra "approve" button */}
                <br /><br />
                <h2>Pending Participants</h2>
                <ParticipantsTable rows={pendingList} />


                {/* TODO: approved list */}
                <br /><br />
                <h2>Approved (Eligible) Participants</h2>
                <ParticipantsTable rows={eligibleList} />


                {/* TODO: debtors list (if circle has started) */}
                <br /><br />
                <h2>Debtors</h2>
                <ParticipantsTable rows={debtorsList} />

            </div>


            <div>
                {/* Test area */}
                <br /><br /><br /><br />
                <button className="btn btn-primary"
                    onClick={() => requestJoin()} >  Request to Join
                </button>
                <p>isLoading: {String(isLoadingRequestJoin)}</p>
                <p>isSuccess: {String(isSuccessRequestJoin)}</p>

                <br /><br />
                <button
                    className="btn btn-primary"
                    onClick={() => { contribute() }}>Contribute
                </button>

                <p>isLoading: {String(isLoadingContribute)}</p>
                <p>isSuccess: {String(isSuccessContribute)}</p>

                <br /><br />
                <input type="text"
                    onChange={(e) => setTempAddressInput(e.target.value)}
                    placeholder="Enter address to approve" />
                <button
                    onClick={() => { approveJoin() }}
                    className="btn btn-primary">Approve Applicant
                </button>
                <p>isLoading: {String(isLoadingApprove)}</p>
                <p>isSuccess: {String(isSuccessApprove)}</p>


            </div>
        </div>


    );
};

export default Circle;
