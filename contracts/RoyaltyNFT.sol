// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RoyaltyMarketplace is ERC1155Supply, Ownable {
    struct AssetInfo {
        address creator;
        uint256 royaltyPercentage;
    }

    mapping(uint256 => AssetInfo) public assetInfo;
    uint256 public nextAssetId;

    /**
     * @notice This UTILITY_TOKEN = Fungible Token as Utility based on the NFT
     * Use Case #1: This token might serve as an incentive mechanism
     * Use Case #2: Reward users for actions, such as participating in the marketplace
     * Use Case #3: Royality Share
     */
    uint256 public constant UTILITY_TOKEN = 1;
    /**
     * @notice This UtilityBalances = Tracking Utility Token Balances
     * 1) Discounts or Perks: Users could receive discounts on platform fees when purchasing NFTs if they hold a certain amount of utility tokens.
     * 2) Access to Exclusive Assets: Some NFTs could be restricted to users with a certain balance of utility tokens.
     * 3) Reward System: Users who participate in the marketplace (by buying, selling, or referring others) could be rewarded with additional utility tokens. This reward would incentivize increased marketplace activity.
     */
    mapping(address => uint256) public utilityBalances;

    event MintAsset(
        address indexed creator,
        uint256 indexed assetId,
        uint256 amount,
        uint256 royaltyPercentage
    );
    event TransferWithRoyalty(
        address indexed from,
        address indexed to,
        uint256 indexed assetId,
        uint256 amount,
        uint256 royaltyPaid
    );

    /**
     * Potential NFT reward system:
        - Rewarding Activity: For each NFT purchase, the buyer receives a small number of utility tokens as a reward, deposited directly into their utilityBalances. This increases engagement and encourages further transactions.
        - Utility Tokens as Transaction Fees: The marketplace could allow users to pay transaction fees partially or fully with utility tokens. This could reduce the need for other payment tokens (like ETH) and encourage utility token accumulation.
        - Special Access or Voting: Users with a certain number of utility tokens might gain access to vote on new features, upcoming asset releases, or get early access to new NFTs.
        - Leverage utility token’s use cases, such as staking or redeeming tokens for royalty share.
        * This utility token setup can help create a more engaging and rewarding marketplace experience, driving growth and user loyalty *
     */
    constructor(string memory uri) ERC1155(uri) Ownable(msg.sender) {}

    /**
     * @dev Mints an asset (NFT or fungible) with a royalty.
     */
    function mintAsset(uint256 amount, uint256 royaltyPercentage) external {
        require(royaltyPercentage <= 100, "Royalty can't exceed 100%");
        uint256 assetId = nextAssetId++;

        assetInfo[assetId] = AssetInfo({
            creator: msg.sender,
            royaltyPercentage: royaltyPercentage
        });

        _mint(msg.sender, assetId, amount, "");
        emit MintAsset(msg.sender, assetId, amount, royaltyPercentage);
    }

    /**
     * @dev Transfer with royalties: applies royalty if asset is sold.
     */
    function safeTransferWithRoyalty(
        address from,
        address to,
        uint256 assetId,
        uint256 amount,
        bytes memory data
    ) public {
        AssetInfo memory asset = assetInfo[assetId];
        require(asset.creator != address(0), "Asset not found");

        // Calculate the royalty and amount for the seller
        uint256 royalty = (amount * asset.royaltyPercentage) / 100;
        uint256 sellerAmount = amount - royalty;

        // Transfer royalty directly to the creator
        if (royalty > 0) {
            safeTransferFrom(from, asset.creator, assetId, royalty, data);
        }

        // Transfer remaining balance to the buyer
        safeTransferFrom(from, to, assetId, sellerAmount, data);

        emit TransferWithRoyalty(from, to, assetId, amount, royalty);
    }

    /**
     * @dev Utility token mint function to reward users.
     */
    function mintUtilityToken(address to, uint256 amount) external onlyOwner {
        utilityBalances[to] += amount;
        _mint(to, UTILITY_TOKEN, amount, "");
    }
}
