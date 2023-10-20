import LendingCircleArtifact from './LendingCircle.json'

export const Config = {
    scrollSepolia: {
        contractAddress: "0x4E829149DDA3542947D87EcA89206097ab2066C0",
        abi: LendingCircleArtifact.abi,
        rpcUrl: "https://sepolia-rpc.scroll.io",

    },
    mantleTestnet: {
        contractAddress: "0x43A41211E308a25741074465Abc3D8ECe661Ba09",
        abi: LendingCircleArtifact.abi,
        rpcUrl: "https://mantle-testnet.scroll.io",


    }
}