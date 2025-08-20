import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { RWAHouse } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

task("rwa:store-property", "Store property information for a user (only project owner can call)")
  .addParam("callerindex", "User address to store property for")
  .addParam("userindex", "User address to store property for")
  .addParam("country", "Country code (number)", 0, types.int)
  .addParam("city", "City code (number)", 0, types.int)
  .addParam("valuation", "Property valuation (number)", 0, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, fhevm, deployments } = hre;
    await fhevm.initializeCLIApi()
    const signers = await ethers.getSigners();
    const signer = signers[taskArgs.callerindex]
    const useraddress = signers[taskArgs.userindex]
    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Project owner: ${signer.address}`);
    console.log(`Target user: ${useraddress}`);
    console.log("Creating encrypted inputs for all property data...");

    // Create encrypted inputs for all three parameters (country, city, valuation)
    const input = fhevm.createEncryptedInput(RWAHouseDeployment.address, signer.address);
    input.add32(taskArgs.country);  // Index 0
    input.add32(taskArgs.city);     // Index 1
    input.add32(taskArgs.valuation); // Index 2
    const encryptedInput = await input.encrypt();

    console.log("Storing property information...");

    const tx = await rwaHouse.storePropertyInfo(
      useraddress,         // user address
      encryptedInput.handles[0], // encrypted country
      encryptedInput.handles[1], // encrypted city
      encryptedInput.handles[2], // encrypted valuation
      encryptedInput.inputProof
    );

    const receipt = await tx.wait();
    console.log(`Property stored! Transaction hash: ${receipt?.hash}`);
    console.log(`Property owner: ${useraddress}`);
    console.log(`Stored by project owner: ${signer.address}`);
    console.log(`Country: ${taskArgs.country} (encrypted)`);
    console.log(`City: ${taskArgs.city} (encrypted)`);
    console.log(`Valuation: ${taskArgs.valuation} (encrypted)`);
    console.log("Note: All property data is now encrypted and bound to the user address. Only the user can decrypt it.");
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

// Update functions are currently disabled in the contract
// task("rwa:update-valuation", "Update property valuation")
//   .addParam("valuation", "New property valuation", 0, types.int)
//   .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
//     const { ethers, fhevm, deployments } = hre;
//     const [signer] = await ethers.getSigners();

//     const RWAHouseDeployment = await deployments.get("RWAHouse");
//     const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

//     console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
//     console.log("Creating encrypted input for new valuation...");

//     // Create encrypted input for new valuation
//     const input = fhevm.createEncryptedInput(RWAHouseDeployment.address, signer.address);
//     input.add32(taskArgs.valuation);
//     const encryptedInput = await input.encrypt();

//     console.log("Updating property valuation...");

//     try {
//       const tx = await rwaHouse.updatePropertyValuation(
//         encryptedInput.handles[0],
//         encryptedInput.inputProof
//       );

//       const receipt = await tx.wait();
//       console.log(`Valuation updated! Transaction hash: ${receipt?.hash}`);
//       console.log(`Property owner: ${signer.address}`);
//       console.log(`New valuation: ${taskArgs.valuation} (encrypted)`);
//     } catch (error: any) {
//       console.log(`Error: ${error.message}`);
//     }
//   });

task("rwa:get-project-owner", "Get the project owner address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);

    try {
      const projectOwner = await rwaHouse.projectOwner();
      console.log(`Project Owner: ${projectOwner}`);
      console.log("Note: Only this address can store property information for users.");
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

// task("rwa:update-location", "Update property location (country and city)")
//   .addParam("country", "New country code (number)", 0, types.int)
//   .addParam("city", "New city code (number)", 0, types.int)
//   .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
//     const { ethers, fhevm, deployments } = hre;
//     const [signer] = await ethers.getSigners();

//     const RWAHouseDeployment = await deployments.get("RWAHouse");
//     const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

//     console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
//     console.log("Creating encrypted inputs for location update...");

//     // Create encrypted inputs for country and city
//     const input = fhevm.createEncryptedInput(RWAHouseDeployment.address, signer.address);
//     input.add32(taskArgs.country);  // Index 0
//     input.add32(taskArgs.city);     // Index 1
//     const encryptedInput = await input.encrypt();

//     console.log("Updating property location...");

//     try {
//       const tx = await rwaHouse.updatePropertyLocation(
//         encryptedInput.handles[0], // encrypted country
//         encryptedInput.handles[1], // encrypted city
//         encryptedInput.inputProof
//       );

//       const receipt = await tx.wait();
//       console.log(`Location updated! Transaction hash: ${receipt?.hash}`);
//       console.log(`Property owner: ${signer.address}`);
//       console.log(`New country: ${taskArgs.country} (encrypted)`);
//       console.log(`New city: ${taskArgs.city} (encrypted)`);
//     } catch (error: any) {
//       console.log(`Error: ${error.message}`);
//     }
//   });

// task("rwa:update-complete", "Update complete property information (country, city, and valuation)")
//   .addParam("country", "New country code (number)", 0, types.int)
//   .addParam("city", "New city code (number)", 0, types.int)
//   .addParam("valuation", "New property valuation (number)", 0, types.int)
//   .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
//     const { ethers, fhevm, deployments } = hre;
//     const [signer] = await ethers.getSigners();

//     const RWAHouseDeployment = await deployments.get("RWAHouse");
//     const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

//     console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
//     console.log("Creating encrypted inputs for complete property update...");

//     // Create encrypted inputs for all three parameters
//     const input = fhevm.createEncryptedInput(RWAHouseDeployment.address, signer.address);
//     input.add32(taskArgs.country);   // Index 0
//     input.add32(taskArgs.city);      // Index 1
//     input.add32(taskArgs.valuation); // Index 2
//     const encryptedInput = await input.encrypt();

//     console.log("Updating complete property information...");

//     try {
//       const tx = await rwaHouse.updateCompletePropertyInfo(
//         encryptedInput.handles[0], // encrypted country
//         encryptedInput.handles[1], // encrypted city
//         encryptedInput.handles[2], // encrypted valuation
//         encryptedInput.inputProof
//       );

//       const receipt = await tx.wait();
//       console.log(`Complete property information updated! Transaction hash: ${receipt?.hash}`);
//       console.log(`Property owner: ${signer.address}`);
//       console.log(`New country: ${taskArgs.country} (encrypted)`);
//       console.log(`New city: ${taskArgs.city} (encrypted)`);
//       console.log(`New valuation: ${taskArgs.valuation} (encrypted)`);
//     } catch (error: any) {
//       console.log(`Error: ${error.message}`);
//     }
//   });

// ============= QUERY AUTHORIZATION TASKS =============

task("rwa:authorize-query", "Authorize a query for external use")
  .addParam('userindex', "signer index")
  .addParam("requesterindex", "Address to authorize for queries")
  .addParam("querytype", "Query type: 0=COUNTRY, 1=CITY, 2=VALUATION", 0, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const signers = await ethers.getSigners();
    const signer = signers[taskArgs.userindex]
    const requester = signers[taskArgs.requesterindex]
    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Authorizing query for ${requester.address}...`);

    const queryTypes = ["COUNTRY", "CITY", "VALUATION"];
    console.log(`Query type: ${queryTypes[taskArgs.querytype]} (${taskArgs.querytype})`);

    try {
      const tx = await rwaHouse.connect(signer).authorizeQuery(requester.address, taskArgs.querytype);
      const receipt = await tx.wait();

      console.log(`Query authorization granted! Transaction hash: ${receipt?.hash}`);
      console.log(`Owner: ${signer.address}`);
      console.log(`Authorized requester: ${requester.address}`);
      console.log(`Query type: ${queryTypes[taskArgs.querytype]}`);
      console.log("Note: This authorization can only be used once.");
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:check-query-used", "Check if a query authorization has been used")
  .addParam("userindex", "Property owner address")
  .addParam("requesterindex", "Requester address")
  .addParam("querytype", "Query type: 0=COUNTRY, 1=CITY, 2=VALUATION", 0, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const signers = await ethers.getSigners();
    const signer = signers[taskArgs.userindex]
    const requester = signers[taskArgs.requesterindex]

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);

    const queryTypes = ["COUNTRY", "CITY", "VALUATION"];
    console.log(`Checking if query authorization has been used:`);
    console.log(`Owner: ${signer.address}`);
    console.log(`Requester: ${requester.address}`);
    console.log(`Query type: ${queryTypes[taskArgs.querytype]}`);

    try {
      const isUsed = await rwaHouse.isQueryAuthorized(signer.address, requester.address, taskArgs.querytype);
      console.log(`Authorization used: ${isUsed}`)
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

// ============= EXTERNAL QUERY INTERFACE TASKS =============

task("rwa:query-country", "Query if property is in a specific country")
  .addParam("requesterindex", "Property owner address")
  .addParam("ownerindex", "Property owner address")
  .addParam("countrycode", "Country code to check against", 0, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const signers = await ethers.getSigners();
    const signer = signers[taskArgs.requesterindex]
    const owner = signers[taskArgs.ownerindex]

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Querying if property is in country: ${taskArgs.countrycode}`);
    console.log(`Property owner: ${owner.address}`);
    console.log(`Requester: ${signer.address}`);

    try {
      const tx = await rwaHouse.connect(signer).queryIsInCountry(owner.address, taskArgs.countrycode);
      const receipt = await tx.wait();

      console.log(`Query submitted! Transaction hash: ${receipt?.hash}`);

      // Extract request ID from logs
      const logs = receipt?.logs || [];
      let requestId = null;

      for (const log of logs) {
        try {
          const parsedLog = rwaHouse.interface.parseLog(log);
          if (parsedLog && parsedLog.args && parsedLog.args.requestId) {
            requestId = parsedLog.args.requestId.toString();
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
        }
      }

      if (requestId) {
        console.log(`Request ID: ${requestId}`);
        console.log("Note: The result will be available after decryption. Use 'rwa:get-query-result' to check the result.");
      } else {
        console.log("Note: Check the transaction events for the request ID.");
      }

      console.log("Note: This query authorization has been consumed and cannot be used again.");
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
      if (error.message.includes("Query authorization already used")) {
        console.log("Hint: The property owner needs to call 'rwa:authorize-query' first with querytype=0 (COUNTRY)");
      }
    }
  });

task("rwa:query-city", "Query if property is in a specific city")
  .addParam("owner", "Property owner address")
  .addParam("citycode", "City code to check against", 0, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Querying if property is in city: ${taskArgs.citycode}`);
    console.log(`Property owner: ${taskArgs.owner}`);
    console.log(`Requester: ${signer.address}`);

    try {
      const tx = await rwaHouse.queryIsInCity(taskArgs.owner, taskArgs.citycode);
      const receipt = await tx.wait();

      console.log(`Query submitted! Transaction hash: ${receipt?.hash}`);

      // Extract request ID from logs
      const logs = receipt?.logs || [];
      let requestId = null;

      for (const log of logs) {
        try {
          const parsedLog = rwaHouse.interface.parseLog(log);
          if (parsedLog && parsedLog.args && parsedLog.args.requestId) {
            requestId = parsedLog.args.requestId.toString();
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
        }
      }

      if (requestId) {
        console.log(`Request ID: ${requestId}`);
        console.log("Note: The result will be available after decryption. Use 'rwa:get-query-result' to check the result.");
      } else {
        console.log("Note: Check the transaction events for the request ID.");
      }

      console.log("Note: This query authorization has been consumed and cannot be used again.");
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
      if (error.message.includes("Query authorization already used")) {
        console.log("Hint: The property owner needs to call 'rwa:authorize-query' first with querytype=1 (CITY)");
      }
    }
  });

task("rwa:query-value", "Query if property valuation is above a threshold")
  .addParam("owner", "Property owner address")
  .addParam("minvalue", "Minimum valuation threshold", 0, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Querying if property valuation is above: ${taskArgs.minvalue}`);
    console.log(`Property owner: ${taskArgs.owner}`);
    console.log(`Requester: ${signer.address}`);

    try {
      const tx = await rwaHouse.queryIsAboveValue(taskArgs.owner, taskArgs.minvalue);
      const receipt = await tx.wait();

      console.log(`Query submitted! Transaction hash: ${receipt?.hash}`);

      // Extract request ID from logs
      const logs = receipt?.logs || [];
      let requestId = null;

      for (const log of logs) {
        try {
          const parsedLog = rwaHouse.interface.parseLog(log);
          if (parsedLog && parsedLog.args && parsedLog.args.requestId) {
            requestId = parsedLog.args.requestId.toString();
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
        }
      }

      if (requestId) {
        console.log(`Request ID: ${requestId}`);
        console.log("Note: The result will be available after decryption. Use 'rwa:get-query-result' to check the result.");
      } else {
        console.log("Note: Check the transaction events for the request ID.");
      }

      console.log("Note: This query authorization has been consumed and cannot be used again.");
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
      if (error.message.includes("Query authorization already used")) {
        console.log("Hint: The property owner needs to call 'rwa:authorize-query' first with querytype=2 (VALUATION)");
      }
    }
  });

// ============= QUERY RESULT TASKS =============

task("rwa:get-query-result", "Get the details of a query request")
  .addParam("requestid", "Request ID to check")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Getting query request details for ID: ${taskArgs.requestid}`);

    try {
      const [requester, propertyOwner, queryType, compareValue, isPending] = await rwaHouse.getQueryRequest(taskArgs.requestid);

      const queryTypes = ["COUNTRY", "CITY", "VALUATION"];

      console.log("Query Request Details:");
      console.log(`  Request ID: ${taskArgs.requestid}`);
      console.log(`  Requester: ${requester}`);
      console.log(`  Property Owner: ${propertyOwner}`);
      console.log(`  Query Type: ${queryTypes[Number(queryType)]} (${queryType})`);
      console.log(`  Compare Value: ${compareValue}`);
      console.log(`  Status: ${isPending ? 'PENDING' : 'COMPLETED'}`);

      if (isPending) {
        console.log("Note: The decryption is still pending. Please wait for the result.");
      } else {
        console.log("Note: The decryption has completed. Check the QueryResultReady event for the boolean result.");
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });

task("rwa:get-latest-request", "Get the latest request ID for an address")
  .addParam("requester", "Requester address to check")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;

    const RWAHouseDeployment = await deployments.get("RWAHouse");
    const rwaHouse: RWAHouse = await ethers.getContractAt("RWAHouse", RWAHouseDeployment.address);

    console.log(`Using RWAHouse contract at: ${RWAHouseDeployment.address}`);
    console.log(`Getting latest request ID for: ${taskArgs.requester}`);

    try {
      const latestRequestId = await rwaHouse.getLatestRequestId(taskArgs.requester);

      console.log(`Latest Request ID: ${latestRequestId.toString()}`);

      if (latestRequestId.toString() === "0") {
        console.log("Note: No queries have been made by this address yet.");
      } else {
        console.log("Note: Use 'rwa:get-query-result' with this ID to check the query details.");
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  });