import { ethers, run } from "hardhat";

async function main() {
  console.log("Deploying AnyworkMarketplace...");
  
  // Get the contract factory
  const AnyworkMarketplace = await ethers.getContractFactory("AnyworkMarketplace");
  
  // Deploy the contract
  const marketplace = await AnyworkMarketplace.deploy();
  await marketplace.waitForDeployment();
  
  console.log(`AnyworkMarketplace deployed to: ${await marketplace.getAddress()}`);
  
  // Verify the contract (optional, requires ETHERSCAN_API_KEY in .env)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await marketplace.deploymentTransaction()?.wait(6);
    
    console.log("Verifying contract on Etherscan...");
    await run("verify:verify", {
      address: await marketplace.getAddress(),
      constructorArguments: [],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
