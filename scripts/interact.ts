require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with actual address
    const abi = [
        "function proposeBudget(uint256 _amount) external",
        "function signBudget() external",
        "function depositFunds() external payable",
        "function getBudgetStatus() external view returns (uint256, uint256, bool)",
        "function fundsReleased() external view returns (bool)"
    ];

    const contract = new ethers.Contract(contractAddress, abi, signer);

    console.log("Connected to contract at:", contractAddress);

    // 1. Propose a budget
    const budgetAmount = ethers.parseUnits("10000", "wei"); // Adjust amount as needed
    console.log("Proposing budget:", budgetAmount.toString());
    let tx = await contract.proposeBudget(budgetAmount);
    await tx.wait();
    console.log("Budget proposed!");

    // 2. Sign the budget (Simulating multiple signers)
    const signers = await ethers.getSigners();
    for (let i = 0; i < 20; i++) {
        const boardMemberContract = contract.connect(signers[i]);
        tx = await boardMemberContract.signBudget();
        await tx.wait();
        console.log(`Board member ${i + 1} signed`);
    }

    // 3. Check if funds are released
    const released = await contract.fundsReleased();
    console.log("Funds released:", released);

    // 4. Deposit funds
    tx = await contract.depositFunds({ value: ethers.parseEther("0.1") });
    await tx.wait();
    console.log("1 ETH deposited to the contract!");

    // 5. Get budget status
    const [amount, approvals, releasedStatus] = await contract.getBudgetStatus();
    console.log(`Budget Amount: ${amount.toString()}, Approvals: ${approvals}, Funds Released: ${releasedStatus}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
