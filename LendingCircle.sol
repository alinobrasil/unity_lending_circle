// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LendingCircle {
    enum PeriodType {
        FIVEMIN,
        HOUR,
        DAY,
        WEEK
    }

    struct JoinRequest {
        address payable participant;
        uint256 depositTimestamp;
    }

    struct Circle {
        // terms of the lending circle
        uint256 id; //uid for a lending circle
        uint256 contributionAmount;
        PeriodType periodType;
        uint256 periodDuration; // in seconds
        uint256 numberOfPeriods; // this is also equal to the number of participants
        uint256 adminFeePercentage;
        // ----------------------------------------
        // state of the lending circle
        uint256 currentPeriodNumber; // <-- Added this field
        uint256 nextDueTime; //timestamp of next period due datetime
        // ----------------------------------------
        // state of applicants requesting to join circle
        mapping(address => bool) hasRequestedToJoin;
        JoinRequest[] joinQueue; //list of applicants. only admins can approve which can move into participants list
        // ----------------------------------------
        //state of participants
        mapping(address => bool) isParticipant; // approved participant, regardless of eligibilty to receive payout
        mapping(address => uint256) periodsPaid;
        // mapping(address => uint256) totalContributions; //unneessary field
        address payable[] eligibleRecipients; // eligible to receive funds.
        address payable[] debtors; // list of participants that are late on payments. not eligible for payout until debts cleared.
        mapping(uint256 => address) distributions;
    }

    uint256 public totalReserve;
    mapping(uint256 => Circle) public circles;
    uint256 public circleCount = 0;

    address[] public admins;

    modifier isParticipant(uint256 circleId) {
        require(
            circles[circleId].isParticipant[msg.sender],
            "Not a participant"
        );
        _;
    }
    modifier onlyAdmin() {
        bool admin_status = false;
        for (uint i = 0; i < admins.length; i++) {
            if (msg.sender == admins[i]) {
                admin_status = true;
                break;
            }
        }
        require(admin_status, "Not an admin");
        _;
    }

    // events ----------------------------------------

    event DidntPayAfterReceivingPayout(
        address indexed participant,
        uint256 payoutValue,
        uint256 totalContributionSoFar,
        uint256 contributionAmount,
        uint256 numberOfPeriods,
        PeriodType periodType
    );

    event LateOnContribution(
        uint256 circleId,
        address indexed participant,
        uint256 totalContributionSoFar,
        uint256 currentPeriodNumber,
        uint256 contributionAmount
    );

    event CircleCreated(
        uint256 indexed circleId,
        address creator,
        uint256 contributionAmount,
        PeriodType periodType,
        uint256 numberOfPeriods,
        uint256 adminFeePercentage
    );

    event RequestedToJoin(
        uint256 indexed circleId,
        address indexed requestor,
        uint256 depositTimestamp
    );

    event ApprovedJoinRequest(
        uint256 indexed circleId,
        address indexed participant
    );

    event WithdrawnJoinRequestDeposit(
        uint256 indexed circleId,
        address indexed participant,
        uint256 amount
    );

    event Contributed(
        uint256 indexed circleId,
        address indexed participant,
        uint256 contributionAmount,
        uint256 adminFee
    );

    event ContributedLate(
        uint256 indexed circleId,
        address indexed participant,
        uint256 contributionAmount,
        uint256 adminLateFee
    );

    event DistributedFunds(
        uint256 indexed circleId,
        uint256 indexed periodNumber,
        address recipient,
        uint256 amount
    );

    event CircleEnded(
        uint256 indexed circleId,
        uint256 contributionAmount,
        uint256 numberOfPeriods,
        uint256 adminFee
    );

    // Constructor. Set a list of admin addresses. deployer will be added by default.
    constructor(address[] memory _admins) {
        admins = _admins;

        // Add msg.sender to the list if it's not in _admins
        bool isSenderInAdmins = false;
        for (uint i = 0; i < _admins.length; i++) {
            if (_admins[i] == msg.sender) {
                isSenderInAdmins = true;
                break;
            }
        }

        if (!isSenderInAdmins) {
            admins.push(msg.sender);
        }
    }

    // creates a new circle and returns the circle id
    // admin sets the rules for the circle
    // (eg. contribution amount, number of periods, admin fee percentage, participants count)
    function createCircle(
        uint256 contributionAmount,
        uint256 numberOfPeriods,
        uint256 adminFeePercentage,
        PeriodType periodType
    ) external onlyAdmin returns (uint256) {
        circleCount++;

        Circle storage newCircle = circles[circleCount];

        newCircle.currentPeriodNumber = 0;

        newCircle.contributionAmount = contributionAmount;
        newCircle.numberOfPeriods = numberOfPeriods;

        newCircle.adminFeePercentage = adminFeePercentage;
        newCircle.periodType = periodType;

        if (periodType == PeriodType.FIVEMIN) {
            newCircle.periodDuration = 5 minutes;
        } else if (periodType == PeriodType.HOUR) {
            newCircle.periodDuration = 1 hours;
        } else if (periodType == PeriodType.DAY) {
            newCircle.periodDuration = 1 days;
        } else if (periodType == PeriodType.WEEK) {
            newCircle.periodDuration = 1 weeks;
        }

        emit CircleCreated(
            circleCount,
            msg.sender,
            contributionAmount,
            periodType,
            numberOfPeriods,
            adminFeePercentage
        );

        return circleCount;
    }

    // A person specifies the circle they want to join and pays the deposit
    function requestToJoin(uint256 circleId) external payable {
        Circle storage circle = circles[circleId];

        require(!circle.isParticipant[msg.sender], "Already a participant");
        require(
            !circle.hasRequestedToJoin[msg.sender],
            "Already requested to join"
        );

        uint256 totalAmount = circle.contributionAmount *
            (1 + circle.adminFeePercentage / 100);

        require(msg.value == totalAmount, "Incorrect deposit amount");

        circle.joinQueue.push(
            JoinRequest({
                participant: payable(msg.sender),
                depositTimestamp: block.timestamp
            })
        );
        circle.hasRequestedToJoin[msg.sender] = true;

        emit RequestedToJoin(circleId, msg.sender, block.timestamp);
    }

    function approveJoinRequest(
        uint256 circleId,
        address participantAddress
    ) external onlyAdmin {
        Circle storage circle = circles[circleId];
        // Ensure that the number of approved users is less than the number of periods.
        require(
            circle.eligibleRecipients.length < circle.numberOfPeriods,
            "Maximum number of participants reached"
        );

        //make sure the person has requested to join, implying they've paid the deposit
        require(
            circle.hasRequestedToJoin[participantAddress],
            "No join request from this address"
        );

        circle.eligibleRecipients.push(payable(participantAddress));
        circle.isParticipant[participantAddress] = true;
        removeJoinRequest(circleId, participantAddress);

        // If the number of approved participants matches the number of periods, start the circle.
        if (circle.eligibleRecipients.length == circle.numberOfPeriods) {
            _startCircle(circleId);
        }

        emit ApprovedJoinRequest(circleId, participantAddress);
    }

    function removeJoinRequest(
        uint256 circleId,
        address participantAddress
    ) private {
        Circle storage circle = circles[circleId];

        for (uint i = 0; i < circle.joinQueue.length; i++) {
            if (circle.joinQueue[i].participant == participantAddress) {
                circle.joinQueue[i] = circle.joinQueue[
                    circle.joinQueue.length - 1
                ];
                circle.joinQueue.pop();
                circle.hasRequestedToJoin[participantAddress] = false;
                break;
            }
        }
    }

    //let people withdraw deposit if even after a week they are not approved
    function withdrawJoinRequestDeposit(uint256 circleId) external {
        Circle storage circle = circles[circleId];

        require(
            circle.hasRequestedToJoin[msg.sender],
            "No join request from this address"
        );

        // Ensure that the address is not an approved participant
        require(
            !circle.isParticipant[msg.sender],
            "Address is already a participant"
        );

        uint256 depositTimestamp;
        for (uint i = 0; i < circle.joinQueue.length; i++) {
            if (circle.joinQueue[i].participant == msg.sender) {
                depositTimestamp = circle.joinQueue[i].depositTimestamp;
                break;
            }
        }

        require(
            block.timestamp >= depositTimestamp + 1 weeks,
            "Withdraw not allowed yet"
        );

        removeJoinRequest(circleId, msg.sender);

        //refund deposit (+ fee) for unapproved applicants
        uint256 totalAmount = circle.contributionAmount *
            (1 + circle.adminFeePercentage / 100);
        payable(msg.sender).transfer(totalAmount);

        emit WithdrawnJoinRequestDeposit(
            circleId,
            msg.sender,
            circle.contributionAmount
        );
    }

    // set to internal since the circle will only start when circle is full (reaches number of periods)
    function _startCircle(uint256 circleId) internal onlyAdmin {
        Circle storage circle = circles[circleId];
        circle.currentPeriodNumber = 1;

        //set due date of first period
        circle.nextDueTime = block.timestamp + circle.periodDuration;

        // Return deposits to unapproved participants:
        while (circle.joinQueue.length > 0) {
            address participant = circle.joinQueue[0].participant;
            payable(participant).transfer(circle.contributionAmount);
            removeJoinRequest(circleId, participant);
        }
    }

    function contribute(
        uint256 circleId
    ) external payable isParticipant(circleId) {
        Circle storage circle = circles[circleId];

        require(
            block.timestamp <= circle.nextDueTime,
            "Payment due time passed"
        );
        require(
            circle.periodsPaid[msg.sender] < circle.numberOfPeriods,
            "Already paid all contributions"
        );

        uint256 totalAmount = circle.contributionAmount *
            (1 + circle.adminFeePercentage / 100);
        require(msg.value == totalAmount, "Incorrect amount sent");

        circle.periodsPaid[msg.sender]++;
        // circle.totalContributions[msg.sender] += circle.contributionAmount;

        // admin fee goes towards reserve
        totalReserve +=
            (circle.contributionAmount * circle.adminFeePercentage) /
            100;

        emit Contributed(
            circleId,
            msg.sender,
            circle.contributionAmount,
            (circle.contributionAmount * circle.adminFeePercentage) / 100
        );
    }

    // let participants be able to trigger distribute funds
    // (eg. 1st distribution)
    // needs refinement. should check that all payments have been made.. or handle non payments
    function triggerDistribution(
        uint256 circleId,
        uint256 periodNumber
    ) external isParticipant(circleId) {
        require(
            block.timestamp >= circles[circleId].nextDueTime,
            "Current period has not ended yet"
        );
        _distributeFunds(circleId, periodNumber);
    }

    // the actual function that distribute funds
    // In most cases, periodNumber should be currentPeriodNumber - 1
    function _distributeFunds(uint256 circleId, uint256 periodNumber) private {
        Circle storage circle = circles[circleId];

        require(
            circle.eligibleRecipients.length > 0,
            "All participants have received funds!"
        );

        // funds must not have been distributed yet for the target period
        // and the target period is currentPeriod - 1 (since funds are distributed after the end of a period)
        require(
            circle.distributions[periodNumber] == address(0),
            "Funds have already been distributed for this period!"
        );

        //placeholder for random number. will need to find VRF for each chain
        uint256 randomIndex = uint256(
            keccak256(abi.encodePacked(block.difficulty, block.timestamp))
        ) % circle.eligibleRecipients.length;

        address payable recipient = circle.eligibleRecipients[randomIndex];

        // Remove the selected recipient from the outstanding recipients list
        circle.eligibleRecipients[randomIndex] = circle.eligibleRecipients[
            circle.eligibleRecipients.length - 1
        ];
        circle.eligibleRecipients.pop();

        // Send funds to the recipient
        uint256 amount = circle.contributionAmount * circle.numberOfPeriods;
        recipient.transfer(amount);

        //since funds are distributed after the end of a period, use currentPeriodNumber -1
        circle.distributions[circle.currentPeriodNumber - 1] = recipient;

        // Resetting for next period
        circle.currentPeriodNumber++;

        // set the end of the next period
        // in the rare case that the nextDueTime is in the past, let the next due time be 1 period from current block's timestamp to avoid deadlock
        if (circle.nextDueTime + circle.periodDuration < block.timestamp) {
            circle.nextDueTime = block.timestamp + circle.periodDuration;
        } else {
            circle.nextDueTime += circle.periodDuration;
        }

        if (circle.currentPeriodNumber > circle.numberOfPeriods) {
            emit CircleEnded(
                circleId,
                circle.contributionAmount,
                circle.numberOfPeriods,
                circle.adminFeePercentage
            );
        }

        emit DistributedFunds(circleId, periodNumber, recipient, amount);
    }

    //deal with late/non payments
    // severe case: emit event DidntPayAfterReceivingPayout
    // mild case: possibly late on payments. move to debtors list. no longer eligible to receive payout. emit event LateOncontribution
    function handleNonPayments(uint256 circleId) external {
        Circle storage circle = circles[circleId];
        for (uint i = 0; i < circle.eligibleRecipients.length; i++) {
            address payable participant = circle.eligibleRecipients[i];

            // Check if they haven't paid for the current period.
            if (circle.periodsPaid[participant] < circle.numberOfPeriods) {
                // If they have not yet received their payout
                if (isEligibleRecipient(circleId, participant)) {
                    // Move them to debtors
                    circle.debtors.push(participant);
                    removeDebtorFromEligibleRecipients(circleId, participant);

                    emit LateOnContribution(
                        circleId,
                        participant,
                        circle.periodsPaid[participant] *
                            circle.contributionAmount, //this shows how much was paid so far
                        circle.currentPeriodNumber,
                        circle.contributionAmount
                    );
                } else {
                    // If they already received their payout but didn't pay
                    uint256 totalPayout = circle.contributionAmount *
                        circle.numberOfPeriods;
                    uint256 totalContributionSoFar = circle.contributionAmount *
                        (circle.numberOfPeriods - 1); // Assuming they paid for all other periods

                    emit DidntPayAfterReceivingPayout(
                        participant,
                        totalPayout,
                        totalContributionSoFar,
                        circles[circleId].contributionAmount,
                        circles[circleId].numberOfPeriods,
                        circles[circleId].periodType
                    );
                }
            }
        }
    }

    // removes participant from Eligible list when they don't pay contribution on time
    function removeDebtorFromEligibleRecipients(
        uint256 circleId,
        address payable participant
    ) private {
        Circle storage circle = circles[circleId];
        uint256 length = circle.eligibleRecipients.length;

        // Iterate over the eligibleRecipients
        for (uint i = 0; i < length; i++) {
            // If the participant is found
            if (circle.eligibleRecipients[i] == participant) {
                // Move the last participant to the position of the found participant
                circle.eligibleRecipients[i] = circle.eligibleRecipients[
                    length - 1
                ];
                // Remove the last participant
                circle.eligibleRecipients.pop();
                break; // Exit the loop once found and removed
            }
        }
    }

    function isEligibleRecipient(
        uint256 circleId,
        address payable participant
    ) private view returns (bool) {
        Circle storage circle = circles[circleId];
        for (uint i = 0; i < circle.eligibleRecipients.length; i++) {
            if (circle.eligibleRecipients[i] == participant) {
                return true;
            }
        }
        return false;
    }

    // Late payment function for debtors to settle their dues and get back to the eligibleRecipients list
    function latePayment(uint256 circleId) external payable {
        Circle storage circle = circles[circleId];

        require(isDebtor(circleId, msg.sender), "Not a debtor");

        uint256 outstandingPrincipal = circle.contributionAmount *
            (circle.currentPeriodNumber - 1 - circle.periodsPaid[msg.sender]);

        uint256 fees = (outstandingPrincipal *
            circle.adminFeePercentage *
            125) / 100; // pay extra 25% of the admin fee

        uint256 totalDue = outstandingPrincipal + fees;

        require(
            msg.value == totalDue,
            "Amount sent is less than the total due"
        );

        // if payment#3 was missed, this will only be verified when currentPeriod# is 4
        // which is the previous period Number
        circle.periodsPaid[msg.sender] = circle.currentPeriodNumber - 1;
        // circle.totalContributions[msg.sender] +=
        //     circle.periodsPaid[msg.sender] *
        //     circle.contributionAmount;

        // Add participant back to eligibleRecipients
        circle.eligibleRecipients.push(payable(msg.sender));

        // Remove from debtors list
        for (uint256 i = 0; i < circle.debtors.length; i++) {
            if (circle.debtors[i] == msg.sender) {
                circle.debtors[i] = circle.debtors[circle.debtors.length - 1];
                circle.debtors.pop();
                break;
            }
        }

        emit ContributedLate(circleId, msg.sender, outstandingPrincipal, fees);
    }

    // View function to check outstanding payments
    function getOutstandingPayments(
        uint256 circleId,
        address participantAddress
    ) external view returns (uint256) {
        Circle storage circle = circles[circleId];

        if (!isDebtor(circleId, participantAddress)) {
            return 0;
        }

        uint256 outstanding = circle.contributionAmount *
            circle.numberOfPeriods -
            circle.periodsPaid[participantAddress] *
            circle.contributionAmount;

        uint256 latePaymentFee = (circle.contributionAmount *
            circle.adminFeePercentage *
            125) / 100; // pay extra 25% of the admin fee

        return outstanding + latePaymentFee;
    }

    // Helper function to check if an address is a debtor
    function isDebtor(
        uint256 circleId,
        address participant
    ) private view returns (bool) {
        Circle storage circle = circles[circleId];
        for (uint i = 0; i < circle.debtors.length; i++) {
            if (circle.debtors[i] == participant) {
                return true;
            }
        }
        return false;
    }
}