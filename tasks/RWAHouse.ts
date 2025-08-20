import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { RWAHouse } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

task("rwa:store-property", "Store property information")
  .addParam("country", "Country code (number)", 0, types.int)
  .addParam("city", "City code (number)", 0, types.int)
  .addParam("valuation", "Property valuation (number)", 0, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, fhevm, deployments } = hre;
    await fhevm.initializeCLIApi()
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log("Creating encrypted inputs for all property data...");

    // Create encrypted inputs for all three parameters (country, city, valuation)
    const input = fhevm.createEncryptedInput(RWAHouseDeployment.address, signer.address);
    input.add32(taskArgs.country);  // Index 0
    input.add32(taskArgs.city);     // Index 1
    input.add32(taskArgs.valuation); // Index 2
    const encryptedInput = await input.encrypt();

    console.log("Storing property information...");

    const tx = await rwaHouse.storePropertyInfo(
      encryptedInput.handles[0], // encrypted country
      encryptedInput.handles[1], // encrypted city
      encryptedInput.handles[2], // encrypted valuation
      encryptedInput.inputProof
    );

    const receipt = await tx.wait();
    console.log(`Property stored! Transaction hash: ${receipt?.hash}`);
    console.log(`Property owner: ${signer.address}`);
    console.log(`Country: ${taskArgs.country} (encrypted)`);
    console.log(`City: ${taskArgs.city} (encrypted)`);
    console.log(`Valuation: ${taskArgs.valuation} (encrypted)`);
    console.log("Note: All property data is now encrypted and can only be decrypted by the owner.");
  });

task("rwa:get-property", "Get property information")
  .addParam("index", "Signer index (number)", 0, types.int)
  .addParam("decrypt", "Decrypt the information (true/false)", false, types.boolean)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments, fhevm } = hre;
    const signers = await ethers.getSigners();
    const signer = signers[taskArgs.index];
    await fhevm.initializeCLIApi()
    if (!signer) {
      console.log(`Error: Signer at index ${taskArgs.index} not found`);
      return;
    }

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Getting property info for owner: ${signer.address}`);

    try {
      const [encryptedCountry, encryptedCity, encryptedValuation, exists] = await rwaHouse.getPropertyInfo(signer.address);

      console.log("Property Information:");
      console.log(`  Exists: ${exists}`);

      if (taskArgs.decrypt && exists) {
        console.log("Decrypting property information...");

        try {
          // Decrypt each field using the correct FHEVM API from documentation
          const decryptedCountry = await fhevm.userDecryptEuint(
            FhevmType.euint32,
            encryptedCountry,
            RWAHouseDeployment.address,
            signer
          );
          const decryptedCity = await fhevm.userDecryptEuint(
            FhevmType.euint32,
            encryptedCity,
            RWAHouseDeployment.address,
            signer
          );
          const decryptedValuation = await fhevm.userDecryptEuint(
            FhevmType.euint32,
            encryptedValuation,
            RWAHouseDeployment.address,
            signer
          );

          console.log("Decrypted Property Information:");
          console.log(`  Country: ${decryptedCountry}`);
          console.log(`  City: ${decryptedCity}`);
          console.log(`  Valuation: ${decryptedValuation}`);
        } catch (decryptError: any) {
          console.log(`Decryption failed: ${decryptError.message}`);
          console.log("Showing encrypted handles instead:");
          console.log(`  Encrypted Country: ${encryptedCountry.toString()}`);
          console.log(`  Encrypted City: ${encryptedCity.toString()}`);
          console.log(`  Encrypted Valuation: ${encryptedValuation.toString()}`);
        }
      } else {
        console.log(`  Encrypted Country: ${encryptedCountry.toString()}`);
        console.log(`  Encrypted City: ${encryptedCity.toString()}`);
        console.log(`  Encrypted Valuation: ${encryptedValuation.toString()}`);

        if (!taskArgs.decrypt) {
          console.log("Note: Use --decrypt true to decrypt the values (only works if you have access).");
        }
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:get-location", "Get encrypted property location information")
  .addParam("owner", "Property owner address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Getting property location for owner: ${taskArgs.owner}`);

    try {
      const [encryptedCountry, encryptedCity, exists] = await rwaHouse.getPropertyLocation(taskArgs.owner);

      console.log("Property Location Information:");
      console.log(`  Encrypted Country: ${encryptedCountry.toString()}`);
      console.log(`  Encrypted City: ${encryptedCity.toString()}`);
      console.log(`  Exists: ${exists}`);

      if (taskArgs.owner.toLowerCase() === signer.address.toLowerCase()) {
        console.log("Note: Location data is encrypted. Only you can decrypt it using the frontend.");
      } else {
        console.log("Note: You can only view encrypted handles. To decrypt, you need authorization from the owner.");
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:get-country", "Get encrypted country information")
  .addParam("owner", "Property owner address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Getting encrypted country for owner: ${taskArgs.owner}`);

    try {
      const encryptedCountry = await rwaHouse.getPropertyCountry(taskArgs.owner);

      console.log("Property Country Information:");
      console.log(`  Encrypted Country: ${encryptedCountry.toString()}`);

      if (taskArgs.owner.toLowerCase() === signer.address.toLowerCase()) {
        console.log("Note: Country data is encrypted. Only you can decrypt it using the frontend.");
      } else {
        console.log("Note: You can only view encrypted handles. To decrypt, you need authorization from the owner.");
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:get-city", "Get encrypted city information")
  .addParam("owner", "Property owner address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Getting encrypted city for owner: ${taskArgs.owner}`);

    try {
      const encryptedCity = await rwaHouse.getPropertyCity(taskArgs.owner);

      console.log("Property City Information:");
      console.log(`  Encrypted City: ${encryptedCity.toString()}`);

      if (taskArgs.owner.toLowerCase() === signer.address.toLowerCase()) {
        console.log("Note: City data is encrypted. Only you can decrypt it using the frontend.");
      } else {
        console.log("Note: You can only view encrypted handles. To decrypt, you need authorization from the owner.");
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:get-valuation", "Get encrypted valuation information")
  .addParam("owner", "Property owner address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Getting encrypted valuation for owner: ${taskArgs.owner}`);

    try {
      const encryptedValuation = await rwaHouse.getPropertyValuation(taskArgs.owner);

      console.log("Property Valuation Information:");
      console.log(`  Encrypted Valuation: ${encryptedValuation.toString()}`);

      if (taskArgs.owner.toLowerCase() === signer.address.toLowerCase()) {
        console.log("Note: Valuation data is encrypted. Only you can decrypt it using the frontend.");
      } else {
        console.log("Note: You can only view encrypted handles. To decrypt, you need authorization from the owner.");
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:authorize", "Authorize access to property information")
  .addParam("authorized", "Address to authorize")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Authorizing ${taskArgs.authorized} to access property info...`);

    try {
      const tx = await rwaHouse.authorizeAccess(taskArgs.authorized);
      const receipt = await tx.wait();

      console.log(`Authorization granted! Transaction hash: ${receipt?.hash}`);
      console.log(`Owner: ${signer.address}`);
      console.log(`Authorized: ${taskArgs.authorized}`);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:revoke", "Revoke access to property information")
  .addParam("authorized", "Address to revoke authorization from")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Revoking authorization from ${taskArgs.authorized}...`);

    try {
      const tx = await rwaHouse.revokeAccess(taskArgs.authorized);
      const receipt = await tx.wait();

      console.log(`Authorization revoked! Transaction hash: ${receipt?.hash}`);
      console.log(`Owner: ${signer.address}`);
      console.log(`Revoked from: ${taskArgs.authorized}`);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:check-authorization", "Check if an address is authorized")
  .addParam("owner", "Property owner address")
  .addParam("accessor", "Address to check authorization for")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Checking authorization...`);
    console.log(`Owner: ${taskArgs.owner}`);
    console.log(`Accessor: ${taskArgs.accessor}`);

    try {
      const isAuthorized = await rwaHouse.isAuthorized(taskArgs.owner, taskArgs.accessor);
      console.log(`Authorized: ${isAuthorized}`);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:update-valuation", "Update property valuation")
  .addParam("valuation", "New property valuation", 0, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, fhevm, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log("Creating encrypted input for new valuation...");

    // Create encrypted input for new valuation
    const input = fhevm.createEncryptedInput(RWAHouseDeployment.address, signer.address);
    input.add32(taskArgs.valuation);
    const encryptedInput = await input.encrypt();

    console.log("Updating property valuation...");

    try {
      const tx = await rwaHouse.updatePropertyValuation(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      const receipt = await tx.wait();
      console.log(`Valuation updated! Transaction hash: ${receipt?.hash}`);
      console.log(`Property owner: ${signer.address}`);
      console.log(`New valuation: ${taskArgs.valuation} (encrypted)`);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:has-property", "Check if an address has property")
  .addParam("owner", "Address to check")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Checking if ${taskArgs.owner} has property...`);

    try {
      const hasProperty = await rwaHouse.hasProperty(taskArgs.owner);
      console.log(`Has property: ${hasProperty}`);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:update-location", "Update property location (country and city)")
  .addParam("country", "New country code (number)", 0, types.int)
  .addParam("city", "New city code (number)", 0, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, fhevm, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log("Creating encrypted inputs for location update...");

    // Create encrypted inputs for country and city
    const input = fhevm.createEncryptedInput(RWAHouseDeployment.address, signer.address);
    input.add32(taskArgs.country);  // Index 0
    input.add32(taskArgs.city);     // Index 1
    const encryptedInput = await input.encrypt();

    console.log("Updating property location...");

    try {
      const tx = await rwaHouse.updatePropertyLocation(
        encryptedInput.handles[0], // encrypted country
        encryptedInput.handles[1], // encrypted city
        encryptedInput.inputProof
      );

      const receipt = await tx.wait();
      console.log(`Location updated! Transaction hash: ${receipt?.hash}`);
      console.log(`Property owner: ${signer.address}`);
      console.log(`New country: ${taskArgs.country} (encrypted)`);
      console.log(`New city: ${taskArgs.city} (encrypted)`);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:update-complete", "Update complete property information (country, city, and valuation)")
  .addParam("country", "New country code (number)", 0, types.int)
  .addParam("city", "New city code (number)", 0, types.int)
  .addParam("valuation", "New property valuation (number)", 0, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, fhevm, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log("Creating encrypted inputs for complete property update...");

    // Create encrypted inputs for all three parameters
    const input = fhevm.createEncryptedInput(RWAHouseDeployment.address, signer.address);
    input.add32(taskArgs.country);   // Index 0
    input.add32(taskArgs.city);      // Index 1
    input.add32(taskArgs.valuation); // Index 2
    const encryptedInput = await input.encrypt();

    console.log("Updating complete property information...");

    try {
      const tx = await rwaHouse.updateCompletePropertyInfo(
        encryptedInput.handles[0], // encrypted country
        encryptedInput.handles[1], // encrypted city
        encryptedInput.handles[2], // encrypted valuation
        encryptedInput.inputProof
      );

      const receipt = await tx.wait();
      console.log(`Complete property information updated! Transaction hash: ${receipt?.hash}`);
      console.log(`Property owner: ${signer.address}`);
      console.log(`New country: ${taskArgs.country} (encrypted)`);
      console.log(`New city: ${taskArgs.city} (encrypted)`);
      console.log(`New valuation: ${taskArgs.valuation} (encrypted)`);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });