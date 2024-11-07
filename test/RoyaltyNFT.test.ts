import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("RoyaltyMarketplace", function ()
{
  // Fixture for deploying the RoyaltyMarketplace contract
  async function deployRoyaltyMarketplaceFixture()
  {
    const [owner, otherAccount, creatorAccount] = await hre.ethers.getSigners();
    const RoyaltyMarketplace = await hre.ethers.getContractFactory("RoyaltyMarketplace");
    const royaltyMarketplace = await RoyaltyMarketplace.deploy("https://api.royalty.com/metadata/");
    return { royaltyMarketplace, owner, otherAccount, creatorAccount };
  }

  describe("Deployment", function ()
  {
    it("Should check the correct URI", async function ()
    {
      const { royaltyMarketplace } = await loadFixture(deployRoyaltyMarketplaceFixture);
      expect(await royaltyMarketplace.uri(1)).to.equal("https://api.royalty.com/metadata/");
    });
    it("Should check the incorrect URI", async function ()
    {
      const { royaltyMarketplace } = await loadFixture(deployRoyaltyMarketplaceFixture);
      expect(await royaltyMarketplace.uri(1)).to.not.equal("https://api.royalty.com/incorrect-metadata/");
    });
  });

  describe("Minting Assets", function ()
  {
    it("Should mint an asset with royalties", async function ()
    {
      const { royaltyMarketplace, creatorAccount } = await loadFixture(deployRoyaltyMarketplaceFixture);
      const royaltyPercentage = 10;
      const amount = 100;

      await royaltyMarketplace.connect(creatorAccount).mintAsset(amount, royaltyPercentage);

      const assetInfo = await royaltyMarketplace.assetInfo(0);
      expect(assetInfo.creator).to.equal(creatorAccount.address);
      expect(assetInfo.royaltyPercentage).to.equal(royaltyPercentage);
    });

    it("Should emit MintAsset event on minting", async function ()
    {
      const { royaltyMarketplace, creatorAccount } = await loadFixture(deployRoyaltyMarketplaceFixture);
      const royaltyPercentage = 15;
      const amount = 50;

      await expect(royaltyMarketplace.connect(creatorAccount).mintAsset(amount, royaltyPercentage))
        .to.emit(royaltyMarketplace, "MintAsset")
        .withArgs(creatorAccount.address, 0, amount, royaltyPercentage);
    });
  });

  describe("Royalty Transfers", function ()
  {
    it("Should transfer with royalty to creator", async function ()
    {
      const { royaltyMarketplace, owner, otherAccount } = await loadFixture(deployRoyaltyMarketplaceFixture);

      // Mint a new asset with a 10% royalty for testing
      const assetId = 0;
      const amount = 100n;  // Use BigInt for consistency
      const royaltyPercentage = 10;


      await royaltyMarketplace.mintAsset(Number(amount), royaltyPercentage);

      // Get the creator's (owner's) balance before transfer
      const creatorBalanceBefore = await royaltyMarketplace.balanceOf(owner.address, assetId);
      const otherAccountBalanceBefore = await royaltyMarketplace.balanceOf(otherAccount.address, assetId);

      // Calculate the expected royalty and amount received by the buyer
      const expectedRoyalty = (amount * BigInt(royaltyPercentage)) / 100n;
      const expectedAmountReceivedByBuyer = amount - expectedRoyalty;
      console.log("Expected Royalty:", expectedRoyalty.toString());

      // Perform the transfer
      await expect(
        royaltyMarketplace.safeTransferWithRoyalty(
          owner.address,
          otherAccount.address,
          assetId,
          Number(amount),
          "0x"
        )
      ).to.emit(royaltyMarketplace, "TransferWithRoyalty");

      // Get the balances after the transfer
      const creatorBalanceAfter = await royaltyMarketplace.balanceOf(owner.address, assetId);
      const otherAccountBalanceAfter = await royaltyMarketplace.balanceOf(otherAccount.address, assetId);
      // Check if the creator received the expected royalty amount
      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(expectedRoyalty);
      // Check if the buyer received the correct remaining amount
      expect(otherAccountBalanceAfter - otherAccountBalanceBefore).to.equal(expectedAmountReceivedByBuyer);
      console.log("Creator Balance Change:", (creatorBalanceAfter - creatorBalanceBefore).toString());
      console.log("Buyer Balance Change:", (otherAccountBalanceAfter - otherAccountBalanceBefore).toString());

    });

  });

  describe("Utility Token", function ()
  {
    it("Should mint utility tokens to user", async function ()
    {
      const { royaltyMarketplace, owner, otherAccount } = await loadFixture(deployRoyaltyMarketplaceFixture);
      const utilityAmount = 200;

      await royaltyMarketplace.connect(owner).mintUtilityToken(otherAccount.address, utilityAmount);
      const utilityBalance = await royaltyMarketplace.utilityBalances(otherAccount.address);
      expect(utilityBalance).to.equal(utilityAmount);
    });
  });
});
