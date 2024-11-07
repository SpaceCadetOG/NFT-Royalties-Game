import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("FighterCard", function ()
{
    async function deployFighterCardFixture()
    {
        const [owner, otherAccount] = await ethers.getSigners();
        const FighterCard = await ethers.getContractFactory("FighterCard");
        const fighterCard = await FighterCard.deploy();
        // await fighterCard.deployed();

        return { fighterCard, owner, otherAccount };
    }

    describe("Seasonal Feature", function ()
    {
        it("Should mint a fighter card with the correct season", async function ()
        {
            const { fighterCard } = await loadFixture(deployFighterCardFixture);

            await fighterCard.mintFighterCard("Jon Jones");
            const fighter = await fighterCard.getFighterDetails(0);

            expect(fighter.fighterName).to.equal("Jon Jones");
            expect(fighter.season).to.equal(1);  // Confirm it’s season 1
        });

        it("Should update the season when starting a new season", async function ()
        {
            const { fighterCard } = await loadFixture(deployFighterCardFixture);

            await fighterCard.startNewSeason();
            const newSeason = await fighterCard.currentSeason();
            expect(newSeason).to.equal(2);
        });

        it("Should mint a fighter card in the new season after it changes", async function ()
        {
            const { fighterCard, owner } = await deployFighterCardFixture();

            // Mint a fighter card in the initial season
            await fighterCard.connect(owner).mintFighterCard("Conor McGregor");
            let fighter = await fighterCard.getFighterDetails(0);
            expect(fighter.fighterName).to.equal("Conor McGregor");
            expect(fighter.season).to.equal(1);

            // Start a new season
            await fighterCard.connect(owner).startNewSeason();

            // Mint a fighter card in the new season
            await fighterCard.connect(owner).mintFighterCard("khabib nurmagomedov");
            fighter = await fighterCard.getFighterDetails(1);

            // Check the fighter's details for the new season
            expect(fighter.fighterName).to.equal("khabib nurmagomedov");
            expect(fighter.season).to.equal(2);
        });
    });
});
