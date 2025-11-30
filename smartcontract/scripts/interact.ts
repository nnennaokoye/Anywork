import { ethers } from "hardhat";

async function main() {
  // Connect to the deployed contract
  const contractAddress = "0xF154f7B8685d4EE64BfaA13CEa28f06ba30c6123";
  const marketplace = await ethers.getContractAt("AnyworkMarketplace", contractAddress);
  
  // Get signers
  const [defaultAccount] = await ethers.getSigners();
  const owner = defaultAccount;  // Contract owner
  const client = defaultAccount; // Client is the same as owner for now
  
  // Check owner balance
  const ownerBalance = await ethers.provider.getBalance(owner.address);
  console.log("Owner balance:", ethers.formatEther(ownerBalance), "ETH");
  
  if (ownerBalance < ethers.parseEther("0.2")) {
    console.error("\n❌ Error: Owner account needs at least 0.2 ETH for testing");
    console.log("\nPlease fund this address with test ETH:");
    console.log(owner.address);
    console.log("\nYou can get test ETH from a Base Sepolia faucet.");
    process.exit(1);
  }
  
  // Create a wallet for the artisan using a known private key
  const privateKey = process.env.ARTISAN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Please set the ARTISAN_PRIVATE_KEY in your .env file");
  }
  const artisan = new ethers.Wallet(privateKey, ethers.provider);
  
  // Fund the artisan wallet if needed
  const balance = await ethers.provider.getBalance(artisan.address);
  if (balance < ethers.parseEther("0.01")) {
    console.log("\nFunding artisan wallet...");
    const fundTx = await owner.sendTransaction({
      to: artisan.address,
      value: ethers.parseEther("0.1")
    });
    await fundTx.wait();
  }
  
  console.log("Interacting with AnyworkMarketplace at:", contractAddress);
  console.log("Owner:", owner.address);
  console.log("Client:", client.address);
  console.log("Artisan:", artisan.address);
  
  // 1. Register an artisan
  console.log("\n1. Registering artisan...");
  await marketplace.connect(artisan).registerArtisan("ipfs://artisan-metadata");
  console.log("Artisan registered");
  
  // 2. Check verification status
  console.log("\n2. Checking verification status...");
  const initialStatus = await marketplace.artisans(artisan.address);
  console.log("Initial verification status:", initialStatus.verified ? "✅ Verified" : "❌ Not verified");
  
  // 3. Artisan verifies themselves
  console.log("\n3. Artisan verifying identity...");
  await marketplace.connect(artisan).verifyIdentity();
  console.log("✅ Verification submitted");
  
  // 4. Check updated verification status
  console.log("\n4. Verifying updated status...");
  const updatedStatus = await marketplace.artisans(artisan.address);
  console.log("Updated verification status:", updatedStatus.verified ? "✅ Verified" : "❌ Not verified");
  
  // 5. Create a job (as client)
  console.log("\n5. Creating a job...");
  const jobAmount = ethers.parseEther("0.01"); // 0.01 ETH for test
  try {
    const tx = await marketplace.connect(client).createJob(
      artisan.address,
      "Fix my sink",
      { value: jobAmount }
    );
    await tx.wait();
    console.log("✅ Job created successfully!");
    
    // Get job details
    const job = await marketplace.jobs(0);
    console.log("\nJob details:", {
      client: job.client,
      artisan: job.artisan,
      amount: ethers.formatEther(job.amount) + " ETH",
      status: job.status, // 0 = Active, 1 = Completed, etc.
      description: job.description
    });

    // 6. Complete the job (as client)
    console.log("\n6. Completing the job...");
    await marketplace.connect(client).completeJob(0);
    console.log("✅ Job marked as completed");
    
    // 7. Withdraw payment (as artisan)
    console.log("\n7. Withdrawing payment...");
    const balanceBefore = await ethers.provider.getBalance(artisan.address);
    const withdrawTx = await marketplace.connect(artisan).withdrawJobPayment(0);
    await withdrawTx.wait();
    const balanceAfter = await ethers.provider.getBalance(artisan.address);
    
    console.log("Artisan balance before:", ethers.formatEther(balanceBefore), "ETH");
    console.log("Artisan balance after: ", ethers.formatEther(balanceAfter), "ETH");
    
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Error:", error.message);
    } else {
      console.error("❌ An unknown error occurred:", error);
    }
  }
  
  console.log("\n✅ Interaction completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ ", error instanceof Error ? error.message : 'Unknown error occurred');
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
