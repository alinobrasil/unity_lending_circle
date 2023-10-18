require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" })



/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    mumbai: {
      url: process.env.POLYGON_MUMBAI,
      accounts: [process.env.PRIVATE_KEY_0]
    },

    scrollSepolia: {
      url: "https://sepolia-rpc.scroll.io/",
      accounts: [process.env.PRIVATE_KEY_0]
    },

    mantleTest: {
      url: "https://rpc.testnet.mantle.xyz", // testnet
      accounts: [process.env.PRIVATE_KEY_0]
    }

  }
};
