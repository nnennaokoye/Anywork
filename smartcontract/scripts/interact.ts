import { ethers } from "hardhat";

async function main() {
  // Connect to the deployed contract
  const contractAddress = "0x..."; // Replace with your deployed contract address
  const marketplace = await ethers.getContractAt("AnyworkMarketplace", contractAddress);
  
  // Get signers
  const [owner, client, artisan] = await ethers.getSigners();
  
  console.log("Interacting with AnyworkMarketplace at:", contractAddress);
  console.log("Owner:", await owner.getAddress());
  console.log("Client:", await client.getAddress());
  console.log("Artisan:", await artisan.getAddress());
  
  // Example: Register an artisan
  console.log("\n1. Registering artisan...");
  await marketplace.connect(artisan).registerArtisan("ipfs://artisan-metadata");
  console.log("Artisan registered");
  
  // Verify the artisan (as owner)
  console.log("\n2. Verifying artisan...");
  await marketplace.connect(owner).setArtisanVerified(artisan.address, true);
  console.log("Artisan verified");
  
  // Create a job (as client)
  console.log("\n3. Creating a job...");
  const jobAmount = ethers.parseEther("0.1");
  const tx = await marketplace.connect(client).createJob(
    artisan.address,
    "Fix my sink",
    { value: jobAmount }
  );
  await tx.wait();
  console.log(`Job created with ID: 0`);
  
  // Get job details
  const job = await marketplace.jobs(0);
  console.log("\nJob details:", {
    client: job.client,
    artisan: job.artisan,
    amount: ethers.formatEther(job.amount) + " ETH",
    status: job.status, // 0 = Active, 1 = Completed, etc.
    description: job.description
  });
  
  // Example: Complete the job (as client)
  console.log("\n4. Completing the job...");
  await marketplace.connect(client).completeJob(0);
  console.log("Job marked as completed");
  
  // Withdraw payment (as artisan)
  console.log("\n5. Withdrawing payment...");
  const balanceBefore = await ethers.provider.getBalance(artisan.address);
  await marketplace.connect(artisan).withdrawJobPayment(0);
  const balanceAfter = await ethers.provider.getBalance(artisan.address);
  
  console.log("Artisan balance before:", ethers.formatEther(balanceBefore), "ETH");
  console.log("Artisan balance after: ", ethers.formatEther(balanceAfter), "ETH");
  
  console.log("\nInteraction completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
