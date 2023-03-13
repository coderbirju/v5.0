import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber, Contract, Signer } from "ethers";

describe("HuskyCoin", function() {
  let HuskyCoin;
  let huskyCoin: Contract;
  let owner: Signer;
  let recipient: Signer;
  const INITIAL_SUPPLY = 1000;

  beforeEach(async function() {
    HuskyCoin = await ethers.getContractFactory("HuskyCoin");
    huskyCoin = await HuskyCoin.deploy(INITIAL_SUPPLY);
    [owner, recipient] = await ethers.getSigners();
  });

  describe("Deployment", function() {
    it("should set the correct name and symbol", async function() {
      expect(await huskyCoin.name()).to.equal("HuskyCoin");
      expect(await huskyCoin.symbol()).to.equal("HUSKY");
    });

    it("should set the correct initial supply", async function() {
        let totalSup = await huskyCoin.totalSupply();
        let expectedSup = BigInt(INITIAL_SUPPLY * 10 ** 18);
        expect(totalSup).to.equal(expectedSup);
        expect(await huskyCoin.balanceOf(owner.getAddress())).to.equal(BigInt(INITIAL_SUPPLY * 10 ** 18));
    });
  });

  describe("Transfers", function() {
    it("should transfer tokens correctly", async function() {
      await huskyCoin.transfer(recipient.getAddress(), BigInt(100 * 10 ** 18));
      expect(await huskyCoin.balanceOf(recipient.getAddress())).to.equal(BigInt(100 * 10 ** 18));
      expect(await huskyCoin.balanceOf(owner.getAddress())).to.equal(BigInt((INITIAL_SUPPLY - 100) * 10 ** 18));
    });

    it("should not allow transfer of more tokens than balance", async function() {
      await expect(huskyCoin.transfer(recipient.getAddress(), BigInt((INITIAL_SUPPLY + 1) * 10 ** 18))).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("should not allow transfer to the zero address", async function() {
        await expect(huskyCoin.transfer("0x0000000000000000000000000000000000000000", BigInt(100 * 10 ** 18))).to.be.rejectedWith("ERC20: transfer to the zero address");
    });
  });
});
