const ethers = require("ethers");
const fs = require("fs-extra");


async function main() {
    const provider = new ethers.JsonRpcProvider(
      "http://127.0.0.1:7545"
    );

    const wallet = new ethers.Wallet(
      "#",
      provider
    );

    const abi = fs.readFileSync("./output-directory/_Donation_sol_Donation.abi", "utf8"); 
    const binary = fs.readFileSync("./output-directory/_Donation_sol_Donation.bin", "utf8"); 
 // Example duration in hours

    const contractFactory = new ethers.ContractFactory(abi, binary, wallet);
    console.log("Contract is deploying...");

    const contract = await contractFactory.deploy();
    const addr1 = await contract.getAddress();
    console.log("Contract deployed at ", addr1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });