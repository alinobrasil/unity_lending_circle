const { expect } = require("chai");
const { ethers, network } = require("hardhat");
// const { time } = require("@nomiclabs/hardhat-waffle");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

// const { helpers } = require('@nomicfoundation/hardhat-network-helpers');
// const helpers = require('@nomicfoundation/hardhat-network-helpers');
// const { time } = require('@nomiclabs/hardhat-ethers');


let accounts;
let lendingCircle;
let admin;
 
before(async function() {
    accounts = await ethers.getSigners(); 
    admin = accounts[0];
    
    const LendingCircle = await ethers.getContractFactory("LendingCircle");
    lendingCircle = await LendingCircle.deploy([admin.address]);
    expect(await lendingCircle.admins(0)).to.equal(admin.address);

    //set up circle -----------------------------
    const tx = await lendingCircle.connect(admin).createCircle(
      "Test Circle",   //name
      ethers.utils.parseEther("1"), // 1 ETH //contribution Amount
      3, //number of periods
      5, // 5%
      0 // Period type (0 = 5min, 1 = hour, 2 = day, 3 = week)
    );

    await expect(tx)
      .to.emit(lendingCircle, "CircleCreated")
      .withArgs(
        0, //first circle should have id 0
        "Test Circle", 
        admin.address,
        ethers.utils.parseEther("1"),
        0,
        3,
        5);   
    

    //users join circle
    const joinTx = await lendingCircle
    .connect(accounts[1])
    .requestToJoin(0, {value: ethers.utils.parseEther("1.05")}); 

    await expect(joinTx)
      .to.emit(lendingCircle, "RequestedToJoin")
      .withArgs(0, accounts[1].address);

      const approveTx = await lendingCircle
      .connect(admin)
      .approveJoinRequest(0, accounts[1].address);
    
    
    await expect(approveTx)
      .to.emit(lendingCircle, "ApprovedJoinRequest")
      .withArgs(0, accounts[1].address);
    
    //approve all 3 to start circle
    const eligibleList = await lendingCircle.getEligibleRecipients(0);
    const joinQueue = await lendingCircle.getJoinQueue(0);
    expect(eligibleList[0]).to.equal(accounts[1].address);
    expect(joinQueue.length).to.equal(0);

    const join2 = await lendingCircle
    .connect(accounts[2])
    .requestToJoin(0, {value: ethers.utils.parseEther("1.05")}); 

    // const myCircles = await lendingCircle.getUserCircleIds(accounts[1].address);
    // console.log(myCircles);

    const join3 = await lendingCircle
    .connect(accounts[3])
    .requestToJoin(0, {value: ethers.utils.parseEther("1.05")}); 

    const approve2 = await lendingCircle.connect(admin).approveJoinRequest(0, accounts[2].address);
    const approve3 = await lendingCircle.connect(admin).approveJoinRequest(0, accounts[3].address);

    await expect(approve3).to.emit(lendingCircle, "CircleStarted")
    .withArgs(0);

  });
  
  
describe("LendingCircle", function () {

  //funds are initally already loaded for period 1
  it("should distribute funds to a winner after period 1", async function () {

    // // //move time forward. at least 5 minutes
    const timetravel = (await time.latest()) + 301;
    time.increaseTo(timetravel);
    // console.log("Newest time is now..", await time.latest())

    //show eligible list
    const eligible = await lendingCircle.getEligibleRecipients(0);
    console.log("eligible list:")
    console.log(eligible)


    const distributeTx = await lendingCircle
      .connect(accounts[2])
      .triggerDistribution(0, 1);
    
    receipt = await distributeTx.wait();
    
    //should show an event, representing successful distribution
    await expect(distributeTx).to
      .emit(lendingCircle, "DistributedFunds")
      // .withArgs(0, 1, winner, ethers.parseEther("1"));

    const event = receipt.events?.find(e => e.event === "DistributedFunds")
    console.log("winner: ",event.args.recipient);
});  

it("should enable users to contribute to circle", async function () {
  //user 1 and user 2 both contribute
  const contributeTx = await lendingCircle
    .connect(accounts[1])
    .contribute(
      0, 
      {value: ethers.utils.parseEther("1.05")}
    );
 
  
  await expect(contributeTx)
    .to.emit(lendingCircle, "Contributed")
    .withArgs(
      0,
      accounts[1].address,
      ethers.utils.parseEther("1"),
      ethers.utils.parseEther("0.05")
    );
  

    const contribute2 = await lendingCircle
    .connect(accounts[2])
    .contribute(
      0, 
      {value: ethers.utils.parseEther("1.05")}
    );
 
  
  await expect(contribute2)
    .to.emit(lendingCircle, "Contributed")
    .withArgs(
      0,
      accounts[2].address,
      ethers.utils.parseEther("1"),
      ethers.utils.parseEther("0.05")
    );


  
    
});

  it("Distribute when 2 of 3 have paid. Should work, but eligible list should not include user3.", async function () {
    //only account 1 has paid

    //show eligible list
    const eligible = await lendingCircle.getEligibleRecipients(0);
    console.log("eligible list:")
    console.log(eligible)

    //0x90F79bf6EB2c4f870365E785982E1f101E93b906 should not be on the list

    // get some money ready in contract
    await accounts[0].sendTransaction({
      to: lendingCircle.address,
      value: ethers.utils.parseEther("1"),
    });
    // contract now has 3.25ETH
    
    // let circleInfo = await lendingCircle.getCircleDetails(0);
    // console.log("contributionsThisPeriod: ",  circleInfo[9].toString())

    // // //move time forward. at least 5 minutes
    const timetravel = (await time.latest()) + 301;
    time.increaseTo(timetravel);

    const distributeTx = await lendingCircle
      .connect(accounts[2])
      .triggerDistribution(0, 2);
    
    await expect(distributeTx).to.emit(lendingCircle, "DistributedFunds")



    receipt = await distributeTx.wait();
    
    //should show an event, representing successful distribution
    await expect(distributeTx).to
      .emit(lendingCircle, "DistributedFunds")
      // .withArgs(0, 1, winner, ethers.parseEther("1"));

    const event = receipt.events?.find(e => e.event === "DistributedFunds")
    console.log("winner: ",event.args.recipient);


  });

  // it("should distribute to last person", async function () {

  //   //just loading up with money. if there's money, then everyone getes paid

  //   await accounts[0].sendTransaction({
  //     to: lendingCircle.address,
  //     value: ethers.utils.parseEther("3"),
  //   });

  //   const timetravel = (await time.latest()) + 301;
  //   time.increaseTo(timetravel);

  //   //show eligible list
  //   const eligible = await lendingCircle.getEligibleRecipients(0);
  //   console.log("eligible list:")
  //   console.log(eligible)
    

  //   const distributeTx = await lendingCircle
  //     .connect(accounts[0])
  //     .triggerDistribution(0, 3);
    
  //   await expect(distributeTx).to.emit(lendingCircle, "DistributedFunds")



  //   receipt = await distributeTx.wait();
    
  //   //should show an event, representing successful distribution
  //   await expect(distributeTx).to
  //     .emit(lendingCircle, "DistributedFunds")
  //     // .withArgs(0, 1, winner, ethers.parseEther("1"));

  //   const event = receipt.events?.find(e => e.event === "DistributedFunds")
  //   console.log("winner: ",event.args.recipient);

  //   const circleInfo = await lendingCircle.getCircleDetails(0);
  //   const periodNumber =  circleInfo[7].toString();

  //   expect(periodNumber).to.equal("4");


  // });


});