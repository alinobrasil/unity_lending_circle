import { ethers } from "ethers";
import { Config } from "../helpers/config";

export const getCircleCount = async (): Promise<number> => {
    const provider = new ethers.providers.JsonRpcProvider(Config.scrollSepolia.rpcUrl);
    const contractAddress = Config.scrollSepolia.contractAddress;

    const contract = new ethers.Contract(contractAddress, Config.scrollSepolia.abi, provider);

    const count = await contract.circleCount();
    console.log("count: ", count.toString());
    return count.toNumber();
}