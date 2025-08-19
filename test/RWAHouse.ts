import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { Signer } from "ethers";
import { RWAHouse } from "../types";
import { FhevmInstance } from "@fhevm/hardhat-plugin";

describe("RWAHouse", function () {
  let rwaHouse: RWAHouse;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let instance: FhevmInstance;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    user1 = signers[1];
    user2 = signers[2];

    // Deploy RWAHouse contract
    const RWAHouseFactory = await ethers.getContractFactory("RWAHouse");
    rwaHouse = await RWAHouseFactory.deploy();
    await rwaHouse.waitForDeployment();

    // Create FHEVM instance for encrypted operations
    instance = await fhevm.createInstance({
      aclAddress: "0x687820221192C5B662b25367F70076A37bc79b6c",
      kmsVerifierAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
      inputVerifierAddress: "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
      gatewayUrl: "https://gateway.testnet.zama.cloud"
    });
  });

  describe("Property Storage", function () {
    it("Should store property information with encrypted valuation", async function () {
      const country = 1; // Country code for USA
      const city = 1; // City code for New York
      const valuation = 500000; // Property valuation $500,000

      // Create encrypted input for valuation
      const input = instance.createEncryptedInput(
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
    });

    it("Should allow property owner to access their own property info", async function () {
      const country = 2; // Country code for Canada  
      const city = 3; // City code for Toronto
      const valuation = 750000;

      // Store property
      const input = instance.createEncryptedInput(
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

      // Get property information
      const [returnedCountry, returnedCity, encryptedValuation, exists] = 
        await rwaHouse.connect(owner).getPropertyInfo(await owner.getAddress());

      expect(returnedCountry).to.equal(country);
      expect(returnedCity).to.equal(city);
      expect(exists).to.be.true;

      // Decrypt the valuation to verify it matches
      const decryptedValuation = await instance.decrypt(encryptedValuation);
      expect(decryptedValuation).to.equal(valuation);
    });

    it("Should get public property info without encryption", async function () {
      const country = 3;
      const city = 5;
      const valuation = 300000;

      // Store property
      const input = instance.createEncryptedInput(
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

      // Anyone can get public info
      const [returnedCountry, returnedCity, exists] = 
        await rwaHouse.connect(user1).getPublicPropertyInfo(await owner.getAddress());

      expect(returnedCountry).to.equal(country);
      expect(returnedCity).to.equal(city);
      expect(exists).to.be.true;
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      // Store a property for testing
      const input = instance.createEncryptedInput(
        await rwaHouse.getAddress(),
        await owner.getAddress()
      );
      input.add32(400000);
      const encryptedInput = await input.encrypt();

      await rwaHouse
        .connect(owner)
        .storePropertyInfo(1, 2, encryptedInput.handles[0], encryptedInput.inputProof);
    });

    it("Should prevent unauthorized access to property info", async function () {
      await expect(
        rwaHouse.connect(user1).getPropertyInfo(await owner.getAddress())
      ).to.be.revertedWith("Unauthorized access");
    });

    it("Should prevent unauthorized access to property valuation", async function () {
      await expect(
        rwaHouse.connect(user1).getPropertyValuation(await owner.getAddress())
      ).to.be.revertedWith("Unauthorized access");
    });

    it("Should grant authorization to another address", async function () {
      // Grant authorization
      const tx = await rwaHouse
        .connect(owner)
        .authorizeAccess(await user1.getAddress());

      await expect(tx)
        .to.emit(rwaHouse, "AuthorizationGranted")
        .withArgs(await owner.getAddress(), await user1.getAddress());

      // Check authorization status
      expect(
        await rwaHouse.isAuthorized(await owner.getAddress(), await user1.getAddress())
      ).to.be.true;

      // Authorized user should now be able to access property info
      const [country, city, , exists] = await rwaHouse
        .connect(user1)
        .getPropertyInfo(await owner.getAddress());

      expect(country).to.equal(1);
      expect(city).to.equal(2);
      expect(exists).to.be.true;
    });

    it("Should revoke authorization", async function () {
      // Grant then revoke authorization
      await rwaHouse.connect(owner).authorizeAccess(await user1.getAddress());
      
      const tx = await rwaHouse
        .connect(owner)
        .revokeAccess(await user1.getAddress());

      await expect(tx)
        .to.emit(rwaHouse, "AuthorizationRevoked")
        .withArgs(await owner.getAddress(), await user1.getAddress());

      // Check authorization status
      expect(
        await rwaHouse.isAuthorized(await owner.getAddress(), await user1.getAddress())
      ).to.be.false;

      // User should no longer be able to access property info
      await expect(
        rwaHouse.connect(user1).getPropertyInfo(await owner.getAddress())
      ).to.be.revertedWith("Unauthorized access");
    });

    it("Should prevent self-authorization", async function () {
      await expect(
        rwaHouse.connect(owner).authorizeAccess(await owner.getAddress())
      ).to.be.revertedWith("Cannot authorize self");
    });

    it("Should prevent authorization of zero address", async function () {
      await expect(
        rwaHouse.connect(owner).authorizeAccess(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Property Updates", function () {
    beforeEach(async function () {
      // Store initial property
      const input = instance.createEncryptedInput(
        await rwaHouse.getAddress(),
        await owner.getAddress()
      );
      input.add32(500000);
      const encryptedInput = await input.encrypt();

      await rwaHouse
        .connect(owner)
        .storePropertyInfo(1, 1, encryptedInput.handles[0], encryptedInput.inputProof);
    });

    it("Should allow owner to update property valuation", async function () {
      const newValuation = 600000;

      // Create encrypted input for new valuation
      const input = instance.createEncryptedInput(
        await rwaHouse.getAddress(),
        await owner.getAddress()
      );
      input.add32(newValuation);
      const encryptedInput = await input.encrypt();

      // Update valuation
      await rwaHouse
        .connect(owner)
        .updatePropertyValuation(
          encryptedInput.handles[0],
          encryptedInput.inputProof
        );

      // Verify the update
      const encryptedValuation = await rwaHouse
        .connect(owner)
        .getPropertyValuation(await owner.getAddress());

      const decryptedValuation = await instance.decrypt(encryptedValuation);
      expect(decryptedValuation).to.equal(newValuation);
    });

    it("Should prevent non-owner from updating property valuation", async function () {
      const input = instance.createEncryptedInput(
        await rwaHouse.getAddress(),
        await user1.getAddress()
      );
      input.add32(700000);
      const encryptedInput = await input.encrypt();

      await expect(
        rwaHouse
          .connect(user1)
          .updatePropertyValuation(
            encryptedInput.handles[0],
            encryptedInput.inputProof
          )
      ).to.be.revertedWith("Property does not exist");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle non-existent property queries gracefully", async function () {
      await expect(
        rwaHouse.getPropertyInfo(await user1.getAddress())
      ).to.be.revertedWith("Property does not exist");

      expect(await rwaHouse.hasProperty(await user1.getAddress())).to.be.false;
    });

    it("Should prevent revoking non-existent authorization", async function () {
      // Store property first
      const input = instance.createEncryptedInput(
        await rwaHouse.getAddress(),
        await owner.getAddress()
      );
      input.add32(400000);
      const encryptedInput = await input.encrypt();

      await rwaHouse
        .connect(owner)
        .storePropertyInfo(1, 1, encryptedInput.handles[0], encryptedInput.inputProof);

      // Try to revoke non-existent authorization
      await expect(
        rwaHouse.connect(owner).revokeAccess(await user1.getAddress())
      ).to.be.revertedWith("Not authorized");
    });
  });
});