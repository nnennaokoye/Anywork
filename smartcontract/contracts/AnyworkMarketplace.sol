// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title AnyworkMarketplace - Minimal artisan registry and job payment contract
/// @notice This contract is intentionally simple: no disputes, no ratings, just
///         basic registration, verification, and a paid job flow.
contract AnyworkMarketplace {
    // --- Ownership ---

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // --- Artisans ---

    struct Artisan {
        bool registered;
        bool verified;
        string metadataURI; // optional off-chain profile data (IPFS/URL)
    }

    mapping(address => Artisan) public artisans;

    event ArtisanRegistered(address indexed artisan, string metadataURI);
    event ArtisanUpdated(address indexed artisan, string metadataURI);
    event ArtisanVerificationUpdated(address indexed artisan, bool verified);

    /// @notice Register the caller as an artisan.
    /// @param metadataURI A URI pointing to off-chain profile data (can be empty).
    function registerArtisan(string calldata metadataURI) external {
        Artisan storage a = artisans[msg.sender];

        if (!a.registered) {
            a.registered = true;
            a.metadataURI = metadataURI;
            emit ArtisanRegistered(msg.sender, metadataURI);
        } else {
            a.metadataURI = metadataURI;
            emit ArtisanUpdated(msg.sender, metadataURI);
        }
    }

    /// @notice Set or unset the verification flag for an artisan.
    /// @dev Only the contract owner (platform admin) can call this.
    function setArtisanVerified(address artisan, bool verified) external onlyOwner {
        require(artisans[artisan].registered, "Artisan not registered");

        artisans[artisan].verified = verified;
        emit ArtisanVerificationUpdated(artisan, verified);
    }

    // --- Jobs ---

    struct Job {
        address client;
        address artisan;
        uint256 amount; // total amount of ETH locked for this job
        bool completed; // set by client when job is done
        bool withdrawn; // set when artisan withdraws funds
    }

    uint256 public nextJobId;
    mapping(uint256 => Job) public jobs;

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed artisan, uint256 amount);
    event JobCompleted(uint256 indexed jobId);
    event JobWithdrawn(uint256 indexed jobId, address indexed artisan, uint256 amount);

    /// @notice Create and fund a job for an artisan in a single step.
    /// @dev The sent ETH (msg.value) becomes the job's amount.
    /// @param artisan The artisan who will perform the job.
    /// @return jobId The id of the newly created job.
    function createJob(address artisan) external payable returns (uint256 jobId) {
        require(msg.value > 0, "No funds sent");
        require(artisans[artisan].registered, "Artisan not registered");

        jobId = nextJobId;
        nextJobId += 1;

        jobs[jobId] = Job({
            client: msg.sender,
            artisan: artisan,
            amount: msg.value,
            completed: false,
            withdrawn: false
        });

        emit JobCreated(jobId, msg.sender, artisan, msg.value);
    }

    /// @notice Mark a job as completed.
    /// @dev Only the client who created the job can mark it completed.
    function completeJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.client != address(0), "Job does not exist");
        require(msg.sender == job.client, "Not job client");
        require(!job.completed, "Already completed");

        job.completed = true;
        emit JobCompleted(jobId);
    }

    /// @notice Artisan withdraws funds for a completed job.
    /// @dev Can only be called once per job, after completion.
    function withdrawJobPayment(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.client != address(0), "Job does not exist");
        require(msg.sender == job.artisan, "Not job artisan");
        require(job.completed, "Job not completed");
        require(!job.withdrawn, "Already withdrawn");
        require(job.amount > 0, "No funds");

        job.withdrawn = true;
        uint256 amount = job.amount;
        job.amount = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");

        emit JobWithdrawn(jobId, msg.sender, amount);
    }
}
