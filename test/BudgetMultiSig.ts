import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import {ethers} from "hardhat";

describe("CompanyFundManager", function () {
    async function deployBudgetMultiSig() {
      const [owner, ...boardMembers] = await ethers.getSigners();
      const nonBoardMember = boardMembers.pop(); // Remove one to use as a non-board member

      const boardAddresses = boardMembers.map(member => member.address);
  
      const contractFactory = await ethers.getContractFactory("BudgetMultiSig")
      const deployedContract = await contractFactory.deploy(boardAddresses)
  
      return { deployedContract, owner, boardAddresses, nonBoardMember, boardMembers }
    }

    describe("Deployment", () => {
      it("should test the deployer", async () => {
        const {deployedContract, owner} = await loadFixture(deployBudgetMultiSig)
  
        const deployer = deployedContract.runner
  
        expect(deployer).to.equal(owner)
      })

      it("Should deploy with 20 board members", async function () {
        const {deployedContract, owner} = await loadFixture(deployBudgetMultiSig)

          expect(await deployedContract.totalBoardMembers()).to.equal(20);
      });
      
    })

    describe("Propose", () => {

      it("Only owner can propose a budget", async function () {
        const {deployedContract, owner, boardMembers} = await loadFixture(deployBudgetMultiSig)

          await expect(deployedContract.connect(boardMembers[0]).proposeBudget(1000))
              .to.be.revertedWith("Only owner can perform this action");
  
          await expect(deployedContract.connect(owner).proposeBudget(1000)).to.emit
      });
  
      it("Should not allow budget proposal twice before approval", async function () {
        const {deployedContract, owner, boardMembers} = await loadFixture(deployBudgetMultiSig)

          await deployedContract.connect(owner).proposeBudget(5000);
          await expect(deployedContract.connect(owner).proposeBudget(3000)).to.be.reverted;
      });
    })


    describe("Sign Proposal", () => {
      it("Only board members can sign the budget", async function () {
        const {deployedContract, owner, boardMembers, nonBoardMember} = await loadFixture(deployBudgetMultiSig)

          await deployedContract.connect(owner).proposeBudget(2000);
          await expect(deployedContract.connect(nonBoardMember).signBudget())
              .to.be.revertedWith("Only board members can sign");
  
          await expect(deployedContract.connect(boardMembers[0]).signBudget())
              .to.emit(deployedContract, "BudgetApproved")
              .withArgs(1, boardMembers[0].address);
      });
  
      it("Board members cannot sign more than once", async function () {
        const {deployedContract, owner, boardMembers} = await loadFixture(deployBudgetMultiSig)

          await deployedContract.connect(owner).proposeBudget(3000);
          await deployedContract.connect(boardMembers[0]).signBudget();
  
          await expect(deployedContract.connect(boardMembers[0]).signBudget()).to.be.reverted;
      });
  
      it("Funds should not be released until all board members sign", async function () {
        const {deployedContract, owner, boardMembers} = await loadFixture(deployBudgetMultiSig)

          await deployedContract.connect(owner).proposeBudget(10000);
  
          for (let i = 0; i < 19; i++) {
              await deployedContract.connect(boardMembers[i]).signBudget();
              expect(await deployedContract.fundsReleased()).to.equal(false);
          }
  
          // Last board member signs and funds should now be released
          await expect(deployedContract.connect(boardMembers[19]).signBudget())
              .to.emit(deployedContract, "FundsReleased")
              .withArgs(1, 10000);
  
          expect(await deployedContract.fundsReleased()).to.equal(true);
      });

    })

    describe("Deposit", () => {
      it("Owner should be able to deposit funds", async function () {
        const {deployedContract, owner, boardMembers} = await loadFixture(deployBudgetMultiSig)

          await expect(deployedContract.connect(owner).depositFunds({ value: ethers.parseEther("10") }))
              .to.changeEtherBalances([deployedContract], [ethers.parseEther("10")]);
      });

    })
});
