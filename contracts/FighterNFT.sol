// SPDX-License-Identifier: ME
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract FighterCard is ERC721, Ownable {
    struct Fighter {
        uint256 striking;
        uint256 grappling;
        uint256 stamina;
        string fighterName;
        uint8 rarity;
        uint8 season; // attribute for season
    }

    Fighter[] public fighters;
    uint256 public constant MAX_SUPPLY = 5000;
    uint256 private nonce = 0;
    uint8 public currentSeason = 1; // Tracks the current season

    mapping(uint256 => Fighter) private fighterDetails;

    // Pass msg.sender to Ownable constructor
    constructor() Ownable(msg.sender) ERC721("FighterCard", "FIGHTER") {}

    function mintFighterCard(string memory _fighterName) public onlyOwner {
        require(fighters.length < MAX_SUPPLY, "Max supply reached");

        uint256 striking = _random(60, 100);
        uint256 grappling = _random(50, 90);
        uint256 stamina = _random(70, 110);
        uint8 rarity = uint8(_random(1, 5));

        uint256 fighterId = fighters.length;
        fighters.push(
            Fighter(
                striking,
                grappling,
                stamina,
                _fighterName,
                rarity,
                currentSeason
            )
        );
        _safeMint(msg.sender, fighterId);
        fighterDetails[fighterId] = Fighter(
            striking,
            grappling,
            stamina,
            _fighterName,
            rarity,
            currentSeason
        );
    }

    /**
     *
     * @param fighterId The ID of the Fighter that will be upgraded
     * Will potentially use the ERC 1155 Fungible tokens to upgrade
     */
    function upgradeFighterCard(uint256 fighterId) public {
        require(ownerOf(fighterId) == msg.sender, "Only owner can upgrade");

        fighterDetails[fighterId].striking += 5;
        fighterDetails[fighterId].grappling += 3;
        fighterDetails[fighterId].stamina += 4;
    }

    /**
     * Start a new season and a new to create a new set of Rosters
     */
    function startNewSeason() public onlyOwner {
        currentSeason++;
    }

    function getFighterDetails(
        uint256 fighterId
    ) public view returns (Fighter memory) {
        return fighterDetails[fighterId];
    }

    function totalSupply() public view returns (uint256) {
        return fighters.length;
    }

    // Pseudo-random number generator
    function _random(uint256 min, uint256 max) private returns (uint256) {
        nonce++;
        return
            (uint256(
                keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))
            ) % (max - min + 1)) + min;
    }
}
