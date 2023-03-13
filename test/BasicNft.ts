// import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BasicNft } from '../typechain-types';
// import { Contract, Signer, utils } from 'ethers';

describe('Test the Nft Token Contract', function () {


    let basicNft: BasicNft;

    beforeEach(async function () {
        const [owner] = await ethers.getSigners();

        const BasicNftFactory = await ethers.getContractFactory('BasicNft');
        basicNft = (await BasicNftFactory.connect(owner).deploy('Basic NFT', 'BNFT')) as BasicNft;
        await basicNft.deployed();

        // Transfer ownership to the first signer
        // await basicNft.connect(owner).setApprovalForAll(owner.address, true);
    });

    it('should deploy correctly', async function () {
        expect(await basicNft.name()).to.equal('Basic NFT');
        expect(await basicNft.symbol()).to.equal('BNFT');
    });

    it('should mint tokens', async function () {
        const [signer1] = await ethers.getSigners();
        await basicNft.connect(signer1).mintNFTtoken();
        // // Mint a token to the first signer
        await basicNft.connect(signer1).mintNFTtoken();

        expect(await basicNft.balanceOf(signer1.address)).to.equal(2);

        // // Mint another token to the second signer
        await basicNft.connect(signer1).mintNFTtoken();

        expect(await basicNft.balanceOf(signer1.address)).to.equal(3);
        expect(await basicNft.totalSupply()).to.equal(3);
    });


    it('should transfer tokens', async function () {
        const [signer1, signer2] = await ethers.getSigners();

        // Mint a token to the first signer
        await basicNft.connect(signer1).mintNFTtoken();

        expect(await basicNft.balanceOf(signer1.address)).to.equal(1);

        // Transfer the token to the second signer
        await basicNft.connect(signer1).transferFrom(signer1.address, signer2.address, 1);

        expect(await basicNft.balanceOf(signer1.address)).to.equal(0);
        expect(await basicNft.balanceOf(signer2.address)).to.equal(1);
    });
});





