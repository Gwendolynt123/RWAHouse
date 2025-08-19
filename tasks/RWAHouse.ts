import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { RWAHouse } from "../types";

task("rwa:store-property", "Store property information")
  .addParam("country", "Country code (number)", 0, types.int)
  .addParam("city", "City code (number)", 0, types.int)
  .addParam("valuation", "Property valuation (number)", 0, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, fhevm, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log("Creating encrypted input...");
    
    // Create encrypted input for valuation
    const input = fhevm.createEncryptedInput(RWAHouseDeployment.address, signer.address);
    input.add32(taskArgs.valuation);
    const encryptedInput = await input.encrypt();

    console.log("Storing property information...");
    
    const tx = await rwaHouse.storePropertyInfo(
      taskArgs.country,
      taskArgs.city,
      encryptedInput.handles[0],
      encryptedInput.inputProof
    );

    const receipt = await tx.wait();
    console.log(`Property stored! Transaction hash: ${receipt?.hash}`);
    console.log(`Property owner: ${signer.address}`);
    console.log(`Country: ${taskArgs.country}`);
    console.log(`City: ${taskArgs.city}`);
    console.log(`Valuation: ${taskArgs.valuation} (encrypted)`);
  });

task("rwa:get-property", "Get property information")
  .addParam("owner", "Property owner address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Getting property info for owner: ${taskArgs.owner}`);

    try {
      const [country, city, encryptedValuation, exists] = await rwaHouse.getPropertyInfo(taskArgs.owner);
      
      console.log("Property Information:");
      console.log(`  Country: ${country}`);
      console.log(`  City: ${city}`);
      console.log(`  Exists: ${exists}`);
      console.log(`  Encrypted Valuation: ${encryptedValuation.toString()}`);
      
      if (taskArgs.owner.toLowerCase() === signer.address.toLowerCase()) {
        console.log("Note: Valuation is encrypted. Only the owner can decrypt it using the frontend.");
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:get-public-property", "Get public property information")
  .addParam("owner", "Property owner address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Getting public property info for owner: ${taskArgs.owner}`);

    try {
      const [country, city, exists] = await rwaHouse.getPublicPropertyInfo(taskArgs.owner);
      
      console.log("Public Property Information:");
      console.log(`  Country: ${country}`);
      console.log(`  City: ${city}`);
      console.log(`  Exists: ${exists}`);
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