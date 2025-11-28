import { expect } from "chai";
import { ethers } from "hardhat";
import { AnyworkMarketplace } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AnyworkMarketplace", function () {
  let marketplace: AnyworkMarketplace;
  let owner: SignerWithAddress;
  let client: SignerWithAddress;
  let artisan: SignerWithAddress;
  let artisan2: SignerWithAddress;

  beforeEach(async function () {
    [owner, client, artisan, artisan2] = await ethers.getSigners();

    const AnyworkMarketplace = await ethers.getContractFactory("AnyworkMarketplace");
    marketplace = await AnyworkMarketplace.deploy();
    await marketplace.waitForDeployment();
  });

  // --- Artisan Registration Tests ---
  describe("Artisan Registration", function () {
    it("Should register an artisan", async function () {
      await marketplace.connect(artisan).registerArtisan("ipfs://metadata");
      const a = await marketplace.artisans(artisan.address);
      expect(a.registered).to.be.true;
      expect(a.metadataURI).to.equal("ipfs://metadata");
    });

    it("Should update artisan metadata", async function () {
      await marketplace.connect(artisan).registerArtisan("ipfs://old");
      await marketplace.connect(artisan).registerArtisan("ipfs://new");
      const a = await marketplace.artisans(artisan.address);
      expect(a.metadataURI).to.equal("ipfs://new");
    });

    it("Should verify an artisan (owner only)", async function () {
      await marketplace.connect(artisan).registerArtisan("ipfs://metadata");
      await marketplace.connect(owner).setArtisanVerified(artisan.address, true);
      const a = await marketplace.artisans(artisan.address);
      expect(a.verified).to.be.true;
    });

    it("Should prevent non-owner from verifying", async function () {
      await marketplace.connect(artisan).registerArtisan("ipfs://metadata");
      await expect(
        marketplace.connect(client).setArtisanVerified(artisan.address, true)
      ).to.be.revertedWith("Not owner");
    });

    it("Should prevent verifying unregistered artisan", async function () {
      await expect(
        marketplace.connect(owner).setArtisanVerified(artisan.address, true)
      ).to.be.revertedWith("Artisan not registered");
    });
  });

  // --- Job Creation Tests ---
  describe("Job Creation", function () {
    beforeEach(async function () {
      await marketplace.connect(artisan).registerArtisan("ipfs://metadata");
      await marketplace.connect(owner).setArtisanVerified(artisan.address, true);
    });

    it("Should create a job", async function () {
      const amount = ethers.parseEther("1.0");
      await marketplace
        .connect(client)
        .createJob(artisan.address, "Fix my sink", { value: amount });

      const job = await marketplace.jobs(0);
      expect(job.client).to.equal(client.address);
      expect(job.artisan).to.equal(artisan.address);
      expect(job.amount).to.equal(amount);
      expect(job.description).to.equal("Fix my sink");
    });

    it("Should reject job with no funds", async function () {
      await expect(
        marketplace.connect(client).createJob(artisan.address, "Fix my sink")
      ).to.be.revertedWith("No funds sent");
    });

    it("Should reject job for unverified artisan", async function () {
      await marketplace.connect(artisan2).registerArtisan("ipfs://metadata");
      const amount = ethers.parseEther("1.0");
      await expect(
        marketplace
          .connect(client)
          .createJob(artisan2.address, "Fix my sink", { value: amount })
      ).to.be.revertedWith("Artisan not verified");
    });

    it("Should prevent self-hiring", async function () {
      const amount = ethers.parseEther("1.0");
      await expect(
        marketplace
          .connect(artisan)
          .createJob(artisan.address, "Fix my sink", { value: amount })
      ).to.be.revertedWith("Cannot hire yourself");
    });
  });

  // --- Job Completion & Normal Payment Flow ---
  describe("Job Completion & Payment", function () {
    beforeEach(async function () {
      await marketplace.connect(artisan).registerArtisan("ipfs://metadata");
      await marketplace.connect(owner).setArtisanVerified(artisan.address, true);

      const amount = ethers.parseEther("1.0");
      await marketplace
        .connect(client)
        .createJob(artisan.address, "Fix my sink", { value: amount });
    });

    it("Should complete a job", async function () {
      await marketplace.connect(client).completeJob(0);
      const job = await marketplace.jobs(0);
      expect(job.status).to.equal(1); // JobStatus.Completed
    });

    it("Should prevent non-client from completing", async function () {
      await expect(marketplace.connect(artisan).completeJob(0)).to.be.revertedWith(
        "Not job client"
      );
    });

    it("Should allow artisan withdrawal after completion", async function () {
      const amount = ethers.parseEther("1.0");
      await marketplace.connect(client).completeJob(0);

      const artisanBalanceBefore = await ethers.provider.getBalance(artisan.address);
      const tx = await marketplace.connect(artisan).withdrawJobPayment(0);
      const receipt = await tx?.wait();
      const gasSpent = (receipt?.gasUsed ?? 0n) * (receipt?.gasPrice ?? 0n);

      const artisanBalanceAfter = await ethers.provider.getBalance(artisan.address);
      const expectedAmount = (amount * 95n) / 100n; // 5% fee
      expect(artisanBalanceAfter).to.equal(artisanBalanceBefore + expectedAmount - gasSpent);
    });

    it("Should deduct platform fee on withdrawal", async function () {
      await marketplace.connect(client).completeJob(0);

      await marketplace.connect(artisan).withdrawJobPayment(0);

      const job = await marketplace.jobs(0);
      expect(job.status).to.equal(2); // JobStatus.Withdrawn
      expect(job.amount).to.equal(0);
    });

    it("Should prevent withdrawal if not completed", async function () {
      await expect(marketplace.connect(artisan).withdrawJobPayment(0)).to.be.revertedWith(
        "Job not completed"
      );
    });

    it("Should prevent double withdrawal", async function () {
      await marketplace.connect(client).completeJob(0);
      await marketplace.connect(artisan).withdrawJobPayment(0);
      await expect(marketplace.connect(artisan).withdrawJobPayment(0)).to.be.revertedWith(
        "Job not completed"
      );
    });
  });

  // --- Job Cancellation Tests ---
  describe("Job Cancellation", function () {
    beforeEach(async function () {
      await marketplace.connect(artisan).registerArtisan("ipfs://metadata");
      await marketplace.connect(owner).setArtisanVerified(artisan.address, true);

      const amount = ethers.parseEther("1.0");
      await marketplace
        .connect(client)
        .createJob(artisan.address, "Fix my sink", { value: amount });
    });

    it("Should allow client to cancel anytime", async function () {
      const clientBalanceBefore = await ethers.provider.getBalance(client.address);
      const amount = ethers.parseEther("1.0");

      const tx = await marketplace.connect(client).cancelJob(0);
      const receipt = await tx.wait();
      const gasSpent = (receipt?.gasUsed ?? 0n) * (receipt?.gasPrice ?? 0n);

      const clientBalanceAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalanceAfter).to.equal(clientBalanceBefore + amount - gasSpent);

      const job = await marketplace.jobs(0);
      expect(job.status).to.equal(5); // JobStatus.Cancelled
    });

    it("Should prevent artisan from cancelling before timeout", async function () {
      await expect(marketplace.connect(artisan).cancelJob(0)).to.be.revertedWith(
        "Cannot cancel this job"
      );
    });

    it("Should allow artisan to cancel after timeout", async function () {
      const jobTimeoutDays = await marketplace.jobTimeoutDays();
      const secondsToIncrease = BigInt(jobTimeoutDays) * 24n * 60n * 60n;
      await ethers.provider.send("evm_increaseTime", ["0x" + secondsToIncrease.toString(16)]);
      await ethers.provider.send("evm_mine", []);

      const clientBalanceBefore = await ethers.provider.getBalance(client.address);
      await marketplace.connect(artisan).cancelJob(0);

      const clientBalanceAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalanceAfter).to.be.gt(clientBalanceBefore);

      const job = await marketplace.jobs(0);
      expect(job.status).to.equal(5); // JobStatus.Cancelled
    });
  });

  // --- Timeout & Dispute Flow Tests ---
  describe("Timeout & Dispute Flow", function () {
    beforeEach(async function () {
      await marketplace.connect(artisan).registerArtisan("ipfs://metadata");
      await marketplace.connect(owner).setArtisanVerified(artisan.address, true);

      const amount = ethers.parseEther("1.0");
      await marketplace
        .connect(client)
        .createJob(artisan.address, "Fix my sink", { value: amount });
    });

    it("Should allow artisan to claim after timeout", async function () {
      const jobTimeoutDays = await marketplace.jobTimeoutDays();
      const secondsToIncrease = BigInt(jobTimeoutDays) * 24n * 60n * 60n;
      await ethers.provider.send("evm_increaseTime", ["0x" + secondsToIncrease.toString(16)]);
      await ethers.provider.send("evm_mine", []);

      await marketplace.connect(artisan).claimJobAfterTimeout(0);
      const job = await marketplace.jobs(0);
      expect(job.status).to.equal(3); // JobStatus.ClaimedByArtisan
      expect(job.claimedAt).to.be.gt(0);
    });

    it("Should prevent claiming before timeout", async function () {
      await expect(marketplace.connect(artisan).claimJobAfterTimeout(0)).to.be.revertedWith(
        "Timeout not reached"
      );
    });

    it("Should allow client to dispute within dispute window", async function () {
      const jobTimeoutDays = await marketplace.jobTimeoutDays();
      const secondsToIncreaseTimeout = BigInt(jobTimeoutDays) * 24n * 60n * 60n;
      await ethers.provider.send("evm_increaseTime", ["0x" + secondsToIncreaseTimeout.toString(16)]);
      await ethers.provider.send("evm_mine", []);

      await marketplace.connect(artisan).claimJobAfterTimeout(0);

      const clientBalanceBefore = await ethers.provider.getBalance(client.address);
      const tx = await marketplace.connect(client).disputeClaimedJob(0);
      const receipt = await tx.wait();
      const gasSpent = (receipt?.gasUsed ?? 0n) * (receipt?.gasPrice ?? 0n);

      const clientBalanceAfter = await ethers.provider.getBalance(client.address);
      const amount = ethers.parseEther("1.0");
      expect(clientBalanceAfter).to.equal(clientBalanceBefore + amount - gasSpent);

      const job = await marketplace.jobs(0);
      expect(job.status).to.equal(4); // JobStatus.Disputed
    });

    it("Should prevent dispute after dispute window closes", async function () {
      const jobTimeoutDays = await marketplace.jobTimeoutDays();
      const disputeWindowDays = await marketplace.disputeWindowDays();

      const secondsToIncreaseTimeout = BigInt(jobTimeoutDays) * 24n * 60n * 60n;
      await ethers.provider.send("evm_increaseTime", ["0x" + secondsToIncreaseTimeout.toString(16)]);
      await ethers.provider.send("evm_mine", []);

      await marketplace.connect(artisan).claimJobAfterTimeout(0);

      const secondsToIncreaseDispute = BigInt(disputeWindowDays) * 24n * 60n * 60n;
      await ethers.provider.send("evm_increaseTime", ["0x" + secondsToIncreaseDispute.toString(16)]);
      await ethers.provider.send("evm_mine", []);

      await expect(marketplace.connect(client).disputeClaimedJob(0)).to.be.revertedWith(
        "Dispute window closed"
      );
    });

    it("Should allow artisan to finalize after dispute window", async function () {
      const jobTimeoutDays = await marketplace.jobTimeoutDays();
      const disputeWindowDays = await marketplace.disputeWindowDays();

      const secondsToIncreaseTimeout = BigInt(jobTimeoutDays) * 24n * 60n * 60n;
      await ethers.provider.send("evm_increaseTime", ["0x" + secondsToIncreaseTimeout.toString(16)]);
      await ethers.provider.send("evm_mine", []);

      await marketplace.connect(artisan).claimJobAfterTimeout(0);

      const secondsToIncreaseDispute = BigInt(disputeWindowDays) * 24n * 60n * 60n;
      await ethers.provider.send("evm_increaseTime", ["0x" + secondsToIncreaseDispute.toString(16)]);
      await ethers.provider.send("evm_mine", []);

      const artisanBalanceBefore = await ethers.provider.getBalance(artisan.address);
      const tx = await marketplace.connect(artisan).finalizeClaimedJob(0);
      const receipt = await tx.wait();
      const gasSpent = (receipt?.gasUsed ?? 0n) * (receipt?.gasPrice ?? 0n);

      const artisanBalanceAfter = await ethers.provider.getBalance(artisan.address);
      const amount = ethers.parseEther("1.0");
      const expectedAmount = (amount * 95n) / 100n; // 5% fee
      expect(artisanBalanceAfter).to.equal(artisanBalanceBefore + expectedAmount - gasSpent);

      const job = await marketplace.jobs(0);
      expect(job.status).to.equal(2); // JobStatus.Withdrawn
    });

    it("Should prevent finalize before dispute window", async function () {
      const jobTimeoutDays = await marketplace.jobTimeoutDays();
      const secondsToIncreaseTimeout = BigInt(jobTimeoutDays) * 24n * 60n * 60n;
      await ethers.provider.send("evm_increaseTime", ["0x" + secondsToIncreaseTimeout.toString(16)]);
      await ethers.provider.send("evm_mine", []);

      await marketplace.connect(artisan).claimJobAfterTimeout(0);

      await expect(marketplace.connect(artisan).finalizeClaimedJob(0)).to.be.revertedWith(
        "Dispute window still open"
      );
    });
  });

  // --- Admin Tests ---
  describe("Admin Functions", function () {
    it("Should allow owner to set platform fee", async function () {
      await marketplace.connect(owner).setPlatformFee(10);
      expect(await marketplace.platformFeePercent()).to.equal(10);
    });

    it("Should prevent fee over 50%", async function () {
      await expect(marketplace.connect(owner).setPlatformFee(60)).to.be.revertedWith(
        "Fee too high"
      );
    });

    it("Should allow owner to set job timeout", async function () {
      await marketplace.connect(owner).setJobTimeout(14);
      expect(await marketplace.jobTimeoutDays()).to.equal(14);
    });

    it("Should allow owner to set dispute window", async function () {
      await marketplace.connect(owner).setDisputeWindow(3);
      expect(await marketplace.disputeWindowDays()).to.equal(3);
    });
  });
});