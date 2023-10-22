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
import { useContractWriteResult, UseContractReadResult } from '../../helpers/types'
import ParticipantsTable from '../../components/ParticipantsTable';
import LendingCircleArtifact from '../../helpers/LendingCircle.json'
import PayoutTable from '../../components/PayoutTable';

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

    const [circleStatus, setCircleStatus] = useState<string>("")
    const [userType, setUserType] = useState<any>("") //admin, participant, neither

    const [debtorsList, setDebtorsList] = useState<Address[]>([])
    const [eligibleList, setEligibleList] = useState<Address[]>([])
    const [pendingList, setPendingList] = useState<Address[]>([])
    const [payoutHistory, setPayoutHistory] = useState<Address[]>([])
    const [adminList, setAdminList] = useState<any>([])



    // smart contract WRITE functions -----------------------------------------------
    const { data: dataContribute, isLoading: isLoadingContribute, isSuccess: isSuccessContribute, write: writeContribute } = useContractWrite({
        address: Config[currentChain].contractAddress as Address,
        abi: Config[currentChain].abi,
        functionName: 'contribute',
    }) as useContractWriteResult

    const { data: dataLatePayment, isLoading: isLoadingLatePayment, isSuccess: isSuccessLatePayment, write: writeLatePayment } = useContractWrite({
        address: Config[currentChain].contractAddress as Address,
        abi: Config[currentChain].abi,
        functionName: 'latePayment',
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

    const { data: dataDistribute, isLoading: isLoadingDistribute, isSuccess: isSuccessDistribute, write: writeDistribute } = useContractWrite({
        address: Config[currentChain].contractAddress as Address,
        abi: Config[currentChain].abi,
        functionName: 'triggerDistribution',
    }) as useContractWriteResult

    const { data: datacheckEveryonePaid, isLoading: isLoadingcheckEveryonePaid, isSuccess: isSuccesscheckEveryonePaid, write: writecheckEveryonePaid } = useContractWrite({
        address: Config[currentChain].contractAddress as Address,
        abi: Config[currentChain].abi,
        functionName: 'checkEveryonePaid',
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


    // read circle details and arrays
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
                setAdminList([data0])
            } else {
                console.log("admins not string")
            }

            //get PENDING list
            const data1: any = await client.readContract({
                address: Config[currentChain].contractAddress as Address,
                abi: Config[currentChain].abi,
                functionName: 'getJoinQueue',
                args: [id]
            })
            // console.log("JoinQueue:")
            // console.log(data1)
            setPendingList(data1)

            //get ELIGIBLE list
            const data2: any = await client.readContract({
                address: Config[currentChain].contractAddress as Address,
                abi: Config[currentChain].abi,
                functionName: 'getEligibleRecipients',
                args: [id]
            })
            // console.log("EligibleRecipients:")
            // console.log(data2)
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

            if (circle?.currentPeriodNumber > 1) {

                // get PAYOUT history
                const data4: any = await client.readContract({
                    address: Config[currentChain].contractAddress as Address,
                    abi: Config[currentChain].abi,
                    functionName: 'getDistributions',
                    args: [id]
                })
                console.log("Payout history:")
                console.log(data4)
                setPayoutHistory(data4)
            }

        }

        if (client && id !== undefined) {
            getCircleDetails().then((result) => {
                setCircle(result)
                // console.log(result)
            })

            getArrays()

        }
    }, [client, id, isSuccessRequestJoin, isSuccessApprove, isSuccessDistribute])




    //determine user type
    useEffect(() => {
        determineUserType()
    }, [debtorsList, eligibleList, pendingList, adminList])

    useEffect(() => {
        if (circle) {
            console.log("Circle status: ", getStatus(circle))
            setCircleStatus(getStatus(circle))
        }
        const getPayoutHistory = async () => {
            if (circle.currentPeriodNumber > 1) {

                // get PAYOUT history
                const data4: any = await client.readContract({
                    address: Config[currentChain].contractAddress as Address,
                    abi: Config[currentChain].abi,
                    functionName: 'getDistributions',
                    args: [id]
                })
                // console.log("Payout history:")
                // console.log(data4)
                setPayoutHistory(data4)
            }
        }
        getPayoutHistory
    }, [circle, userType])


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

    const latePayment = async () => {
        console.log("Late payment amount due:")
        // obtain outstanding amount due

        const lateAmountDue: any = await client.readContract({
            address: Config[currentChain].contractAddress as Address,
            abi: Config[currentChain].abi,
            functionName: 'getLatePaymentDue',
            args: [id, address]
        })
        console.log(lateAmountDue)
        console.log(utils.formatEther(lateAmountDue.toString()))

        if (parseFloat(utils.formatEther(lateAmountDue.toString())) > 0) {
            writeLatePayment({
                args: [id],
                from: address,
                value: lateAmountDue.toString()
            })
        }
        else {
            console.log("nothing due")
        }



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


    const checkEveryonePaid = () => {

        writecheckEveryonePaid({
            args: [
                id
            ],
            from: address,
        })
    }

    const approveJoin = (applicantAddress: any) => {
        // admin gets to approve a person to join a circle


        console.log(applicantAddress)
        writeApprove({
            args: [
                id,
                applicantAddress
            ],
            from: address,
        })
    }

    const triggerDistribution = () => {
        // admin gets to trigger a distribution
        writeDistribute({
            args: [
                id?.toString(),
                circle?.currentPeriodNumber.toString()
            ],
            from: address,
        })
    }

    function determineUserType() {
        if (adminList.includes(address)) {
            setUserType("admin")
        } else if (pendingList.includes(address as Address)) {
            setUserType("pending")
        } else if (eligibleList.includes(address as Address)) {
            setUserType("eligible")
        } else if (debtorsList.includes(address as Address)) {
            setUserType("debtor")
        } else {
            setUserType("none")
        }
        console.log("userType: ", userType)
    }

    if (!id) return <p>Loading...</p>;

    return (
        <div>
            <NavBar />

            <div className='body-area'>

                <h1>Circle ID: {id}</h1>

                <h2>Circle Name: {circle ? circle.name : ''} </h2>

                <h3>Status: {circle ? getStatus(circle) : ''}</h3>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* basic text properties */}
                    <div>
                        <p>Contribution Amount: {circle ? circle.contributionAmount + " ETH" : ''} </p>
                        <p>Number of periods: {circle ? circle.numberOfPeriods : ''}</p>
                        <p>Period Type: {circle ? PeriodType[circle.periodType] : ''}</p>
                        <p>Payout Value: {circle ? getPayoutValue() + " ETH" : ''}</p>
                        <p>Current Period Number: {circle?.currentPeriodNumber}</p>
                        <p>Next Due Time: {circle?.nextDueTime}</p>
                        <p>Contributors This Period: {circle?.contributorsThisPeriod}</p>
                    </div>


                    {/* Button area */}
                    <div className='grid grid-cols-3 gap-4 my-5'>

                        {circleStatus === "Pending" && userType === 'none' ?
                            (
                                <div>
                                    <button className="btn btn-primary"
                                        onClick={() => requestJoin()} >  Request to Join
                                    </button>
                                    <p>isLoading: {String(isLoadingRequestJoin)}</p>
                                    <p>isSuccess: {String(isSuccessRequestJoin)}</p>
                                </div>
                            ) : null}

                        {circleStatus === "Active" && ['debtor', 'eligible'].includes(userType) ?
                            (
                                <div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => { contribute() }}>Contribute
                                    </button>
                                    <p>isLoading: {String(isLoadingContribute)}</p>
                                    <p>isSuccess: {String(isSuccessContribute)}</p>
                                </div>
                            ) : null}

                        {circleStatus === "Active" && userType === 'debtor' ?
                            (
                                <div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => { latePayment() }}>Contribute Late
                                    </button>
                                    <p>isLoading: {String(isLoadingLatePayment)}</p>
                                    <p>isSuccess: {String(isSuccessLatePayment)}</p>
                                </div>
                            ) : null}

                        {circleStatus === "Active" && ['admin', 'debtor', 'eligible'].includes(userType) ?
                            (
                                <div>
                                    <button className="btn btn-primary"
                                        onClick={() => triggerDistribution()}
                                    >
                                        Distribute Funds
                                    </button>
                                    <p>isLoading: {String(isLoadingDistribute)}</p>
                                    <p>isSuccess: {String(isSuccessDistribute)}</p>
                                </div>
                            ) : null}


                        {/* <div>
                            <button className="btn btn-primary"
                                onClick={() => checkEveryonePaid()}
                            >
                                check EveryonePaid
                            </button>
                            <p>isLoading: {String(isLoadingcheckEveryonePaid)}</p>
                            <p>isSuccess: {String(isSuccesscheckEveryonePaid)}</p>
                        </div> */}

                        {/* {userType === "admin" ? (
                            <div>
                                <br /><br />
                                <input type="text"
                                    onChange={(e) => setTempAddressInput(e.target.value)}
                                    placeholder="Enter address to approve"
                                    className='border rounded p-2'
                                />
                                <button
                                    onClick={() => { approveJoin(tempAddressInput) }}
                                    className="btn btn-primary">Approve Applicant
                                </button>
                                <p>isLoading: {String(isLoadingApprove)}</p>
                                <p>isSuccess: {String(isSuccessApprove)}</p>

                            </div>
                        ) : null} */}
                    </div>




                </div>

                {/* Table area*/}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                    {/* TODO: pending list */}
                    {/* If admin, extra "approve" button */}

                    {/* show pending table only if circle status is pending */}
                    {circleStatus === "Pending" ? (
                        <div className='min-w-600'>
                            <h3>Pending Applicants</h3>
                            <p>Admins need to approve applicants. When enough participants join (equal to number of periods), this lending circle will start the 1st period. </p>
                            <ParticipantsTable
                                rows={pendingList}
                                showCondition={userType === "admin"}
                                handleClick={approveJoin}
                            />
                        </div>
                    ) : null}

                    <div>
                        <h3>Approved (Eligible) Participants</h3>
                        <p>These are approved participants eligible to receive a payout. If they miss a contribution, they'll be removed from the list until they catch up on payments.</p>
                        <ParticipantsTable rows={eligibleList} />
                    </div>

                    {/* Show debtors list only if not pending */}
                    {circleStatus !== "Pending" ? (
                        <div>
                            <h3>Debtors</h3>
                            <p>These participants missed a payment. They need to catch up on late payments to be eligible to receive a payout.</p>
                            <ParticipantsTable rows={debtorsList} />
                        </div>
                    ) : null}

                    {/* TODO: late payment button */}

                    {/* TODO: Payout history */}
                    {/* If user is participant, show when they got paid */}
                    {/* TODO: Distribute funds (if admin or participant) */}

                    {circleStatus !== "Pending" ? (
                        <div>
                            <h3>Payout History</h3>
                            <p>These participants have received their payout. </p>
                            <PayoutTable data={payoutHistory}
                                currentPeriod={circle ? circle.currentPeriodNumber : 0}
                            />
                        </div>
                    ) : null}
                </div>


            </div>


        </div>


    );
};

export default Circle;
