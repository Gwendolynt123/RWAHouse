import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { Signer } from "ethers";
import { RWAHouse } from "../types";

describe("RWAHouse Sepolia", function () {
  let rwaHouse: RWAHouse;
  let owner: Signer;
  let user1: Signer;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    user1 = signers[1];

    // Deploy RWAHouse contract
    const RWAHouseFactory = await ethers.getContractFactory("RWAHouse");
    rwaHouse = await RWAHouseFactory.deploy();
    await rwaHouse.waitForDeployment();
  });

  it("Should deploy successfully on Sepolia", async function () {
    expect(await rwaHouse.getAddress()).to.be.properAddress;
  });

  it("Should store and retrieve property information on Sepolia", async function () {
    const country = 1;
    const city = 1;
    const valuation = 500000;

    // Create encrypted input for valuation
    const input = fhevm.createEncryptedInput(
      await rwaHouse.getAddress(),
      await owner.getAddress()
    );
    input.add32(valuation);
    const encryptedInput = await input.encrypt();

    // Store property information
    const tx = await rwaHouse
      .connect(owner)
      .storePropertyInfo(
        country,
        city,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

    await expect(tx)
      .to.emit(rwaHouse, "PropertyStored")
      .withArgs(await owner.getAddress(), country, city);

    // Verify property exists
    expect(await rwaHouse.hasProperty(await owner.getAddress())).to.be.true;

    // Get public property info
    const [returnedCountry, returnedCity, exists] = 
      await rwaHouse.getPublicPropertyInfo(await owner.getAddress());

    expect(returnedCountry).to.equal(country);
    expect(returnedCity).to.equal(city);
    expect(exists).to.be.true;
  });

  it("Should handle authorization on Sepolia", async function () {
    const country = 2;
    const city = 3;
    const valuation = 750000;

    // Store property
    const input = fhevm.createEncryptedInput(
      await rwaHouse.getAddress(),
      await owner.getAddress()
    );
    input.add32(valuation);
    const encryptedInput = await input.encrypt();

    await rwaHouse
      .connect(owner)
      .storePropertyInfo(
        country,
        city,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

    // Initially, user1 should not have access
    await expect(
      rwaHouse.connect(user1).getPropertyInfo(await owner.getAddress())
    ).to.be.revertedWith("Unauthorized access");

    // Grant authorization to user1
    await rwaHouse.connect(owner).authorizeAccess(await user1.getAddress());

    // Now user1 should be able to access property info
    expect(
      await rwaHouse.isAuthorized(await owner.getAddress(), await user1.getAddress())
    ).to.be.true;

    // Verify user1 can get property info (though valuation will be encrypted)
    const [returnedCountry, returnedCity, , exists] = 
      await rwaHouse.connect(user1).getPropertyInfo(await owner.getAddress());

    expect(returnedCountry).to.equal(country);
    expect(returnedCity).to.equal(city);
    expect(exists).to.be.true;

    // Revoke authorization
    await rwaHouse.connect(owner).revokeAccess(await user1.getAddress());

    // User1 should no longer have access
    expect(
      await rwaHouse.isAuthorized(await owner.getAddress(), await user1.getAddress())
    ).to.be.false;

    await expect(
      rwaHouse.connect(user1).getPropertyInfo(await owner.getAddress())
    ).to.be.revertedWith("Unauthorized access");
  });

  it("Should update property valuation on Sepolia", async function () {
    const country = 3;
    const city = 4;
    const initialValuation = 400000;
    const newValuation = 450000;

    // Store initial property
    const input1 = fhevm.createEncryptedInput(
      await rwaHouse.getAddress(),
      await owner.getAddress()
    );
    input1.add32(initialValuation);
    const encryptedInput1 = await input1.encrypt();

    await rwaHouse
      .connect(owner)
      .storePropertyInfo(
        country,
        city,
        encryptedInput1.handles[0],
        encryptedInput1.inputProof
      );

    // Update valuation
    const input2 = fhevm.createEncryptedInput(
      await rwaHouse.getAddress(),
      await owner.getAddress()
    );
    input2.add32(newValuation);
    const encryptedInput2 = await input2.encrypt();

    await rwaHouse
      .connect(owner)
      .updatePropertyValuation(
        encryptedInput2.handles[0],
        encryptedInput2.inputProof
      );

    // Property should still exist with updated valuation
    expect(await rwaHouse.hasProperty(await owner.getAddress())).to.be.true;

    // Public info should remain the same
    const [returnedCountry, returnedCity, exists] = 
      await rwaHouse.getPublicPropertyInfo(await owner.getAddress());

    expect(returnedCountry).to.equal(country);
    expect(returnedCity).to.equal(city);
    expect(exists).to.be.true;
  });
});