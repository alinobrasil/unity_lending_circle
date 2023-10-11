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
        uint256 id;
        uint256 contributionAmount;
        PeriodType periodType;
        uint256 periodDuration; // in seconds
        uint256 numberOfPeriods;
        uint256 participantsCount; //capacity of circle (must fill to start circle)
        uint256 adminFeePercentage;
        address payable admin;
        uint256 nextDuePeriod;
        address payable[] participants;
        address payable[] outstandingRecipients;
        mapping(address => bool) isParticipant;
        mapping(address => uint256) contributionsPaid;
        JoinRequest[] joinQueue;
        mapping(address => bool) hasRequestedToJoin;
    }

    uint256 public totalReserve;
    mapping(uint256 => Circle) public circles;
    uint256 public circleCount = 0;

    address[] public admins;

    modifier isAdmin(uint256 circleId) {
        require(msg.sender == circles[circleId].admin, "Not an admin");
        _;
    }

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

    constructor(address[] memory _admins) {
        admins = _admins;
    }

    // creates a new circle and returns the circle id
    // admin sets the rules for the circle
    // (eg. contribution amount, number of periods, admin fee percentage, participants count)
    function createCircle(
        uint256 contributionAmount,
        uint256 numberOfPeriods,
        uint256 adminFeePercentage,
        uint256 participantsCount,
        PeriodType periodType
    ) external onlyAdmin returns (uint256) {
        circleCount++;

        circles[circleCount].contributionAmount = contributionAmount;
        circles[circleCount].numberOfPeriods = numberOfPeriods;
        circles[circleCount].participantsCount = participantsCount;
        circles[circleCount].adminFeePercentage = adminFeePercentage;
        circles[circleCount].admin = payable(msg.sender);
        circles[circleCount].periodType = periodType;

        if (periodType == PeriodType.FIVEMIN) {
            circles[circleCount].periodDuration = 5 minutes;
        } else if (periodType == PeriodType.HOUR) {
            circles[circleCount].periodDuration = 1 hours;
        } else if (periodType == PeriodType.DAY) {
            circles[circleCount].periodDuration = 1 days;
        } else if (periodType == PeriodType.WEEK) {
            circles[circleCount].periodDuration = 1 weeks;
        }

        return circleCount;
    }

    function requestToJoin(uint256 circleId) external payable {
        require(
            !circles[circleId].isParticipant[msg.sender],
            "Already a participant"
        );
        require(
            !circles[circleId].hasRequestedToJoin[msg.sender],
            "Already requested to join"
        );
        require(
            msg.value == circles[circleId].contributionAmount,
            "Incorrect deposit amount"
        );

        circles[circleId].joinQueue.push(
            JoinRequest({
                participant: payable(msg.sender),
                depositTimestamp: block.timestamp
            })
        );
        circles[circleId].hasRequestedToJoin[msg.sender] = true;
    }

    function approveJoinRequest(
        uint256 circleId,
        address participantAddress
    ) external isAdmin(circleId) {
        require(
            circles[circleId].hasRequestedToJoin[participantAddress],
            "No join request from this address"
        );

        circles[circleId].participants.push(payable(participantAddress));
        circles[circleId].isParticipant[participantAddress] = true;
        removeJoinRequest(circleId, participantAddress);
    }

    function removeJoinRequest(
        uint256 circleId,
        address participantAddress
    ) private {
        for (uint i = 0; i < circles[circleId].joinQueue.length; i++) {
            if (
                circles[circleId].joinQueue[i].participant == participantAddress
            ) {
                circles[circleId].joinQueue[i] = circles[circleId].joinQueue[
                    circles[circleId].joinQueue.length - 1
                ];
                circles[circleId].joinQueue.pop();
                circles[circleId].hasRequestedToJoin[
                    participantAddress
                ] = false;
                break;
            }
        }
    }

    function withdrawJoinRequestDeposit(uint256 circleId) external {
        require(
            circles[circleId].hasRequestedToJoin[msg.sender],
            "No join request from this address"
        );

        uint256 depositTimestamp;
        for (uint i = 0; i < circles[circleId].joinQueue.length; i++) {
            if (circles[circleId].joinQueue[i].participant == msg.sender) {
                depositTimestamp = circles[circleId]
                    .joinQueue[i]
                    .depositTimestamp;
                break;
            }
        }

        require(
            block.timestamp >= depositTimestamp + 1 weeks,
            "Withdraw not allowed yet"
        );

        removeJoinRequest(circleId, msg.sender);
        payable(msg.sender).transfer(circles[circleId].contributionAmount);
    }

    function joinCircle(uint256 circleId) external {
        require(
            circles[circleId].participants.length <
                circles[circleId].participantsCount,
            "Circle full"
        );
        circles[circleId].participants.push(payable(msg.sender));
        circles[circleId].isParticipant[msg.sender] = true;
    }

    function startCircle(uint256 circleId) external isAdmin(circleId) {
        //set due date of first period
        circles[circleId].nextDuePeriod =
            block.timestamp +
            circles[circleId].periodDuration;

        // Return deposits to unapproved participants:
        while (circles[circleId].joinQueue.length > 0) {
            address participant = circles[circleId].joinQueue[0].participant;
            payable(participant).transfer(circles[circleId].contributionAmount);
            removeJoinRequest(circleId, participant);
        }
    }

    function contribute(
        uint256 circleId
    ) external payable isParticipant(circleId) {
        require(
            block.timestamp <= circles[circleId].nextDuePeriod,
            "Payment due time passed"
        );
        require(
            circles[circleId].contributionsPaid[msg.sender] <
                circles[circleId].numberOfPeriods,
            "Already paid"
        );
        uint256 totalAmount = circles[circleId].contributionAmount +
            ((circles[circleId].contributionAmount *
                circles[circleId].adminFeePercentage) / 100);
        require(msg.value == totalAmount, "Incorrect amount sent");

        circles[circleId].contributionsPaid[msg.sender]++;
        totalReserve +=
            (circles[circleId].contributionAmount *
                circles[circleId].adminFeePercentage) /
            100;

        if (allContributionsReceivedForPeriod(circleId)) {
            distributeFunds(circleId);
        }
    }

    function allContributionsReceivedForPeriod(
        uint256 circleId
    ) private view returns (bool) {
        for (uint256 i = 0; i < circles[circleId].participants.length; i++) {
            if (
                circles[circleId].contributionsPaid[
                    circles[circleId].participants[i]
                ] < circles[circleId].numberOfPeriods
            ) {
                return false;
            }
        }
        return true;
    }

    // let participants be able to trigger distribute funds
    // (eg. 1st distribution)
    function triggerDistribution(
        uint256 circleId
    ) external isParticipant(circleId) {
        require(
            block.timestamp >= circles[circleId].nextDuePeriod,
            "Current period has not ended yet"
        );
        distributeFunds(circleId);
    }

    //the actual function that distribute funds
    function distributeFunds(uint256 circleId) private {
        require(
            circles[circleId].outstandingRecipients.length > 0,
            "All participants have received funds!"
        );

        uint256 randomIndex = uint256(
            keccak256(abi.encodePacked(block.difficulty, block.timestamp))
        ) % circles[circleId].outstandingRecipients.length;

        address payable recipient = circles[circleId].outstandingRecipients[
            randomIndex
        ];

        // Remove the selected recipient from the outstanding recipients list
        circles[circleId].outstandingRecipients[randomIndex] = circles[circleId]
            .outstandingRecipients[
                circles[circleId].outstandingRecipients.length - 1
            ];
        circles[circleId].outstandingRecipients.pop();

        uint256 amount = circles[circleId].contributionAmount *
            circles[circleId].participantsCount;
        recipient.transfer(amount);

        // Resetting for next period
        circles[circleId].nextDuePeriod += circles[circleId].periodDuration;

        // Reset contribution counters
        for (uint256 i = 0; i < circles[circleId].participants.length; i++) {
            circles[circleId].contributionsPaid[
                circles[circleId].participants[i]
            ] = 0;
        }
    }
}
