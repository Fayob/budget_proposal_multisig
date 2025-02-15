import hre from "hardhat";

async function main() {
  const [deployer, ...boardMembers] = await ethers.getSigners();
  console.log(boardMembers.length);
  

    // if (boardMembers.length < 20) {
    //     throw new Error("You need at least 20 board members for deployment.");
    // }

    console.log("Deploying contract with deployer:", deployer.address);

    const boardMemberAddresses = boardMembers.slice(0, 20).map((member: { address: any; }) => member.address);
    boardMemberAddresses.push(deployer.address)
  const airdropContract = await hre.ethers.getContractFactory("BudgetMultiSig");
  const airdrop = await airdropContract.deploy(boardMemberAddresses)
  await airdrop.waitForDeployment()

  const deployedAddress = await airdrop.getAddress()

  console.log(`Deployed contract to: ${deployedAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
})