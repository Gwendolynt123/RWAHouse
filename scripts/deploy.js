const hre = require("hardhat");

async function main() {
  console.log("Deploying RWAHouse contract...");
  
  const RWAHouse = await hre.ethers.getContractFactory("RWAHouse");
  const rwaHouse = await RWAHouse.deploy();
  
  await rwaHouse.waitForDeployment();
  
  const address = await rwaHouse.getAddress();
  console.log("RWAHouse deployed to:", address);
  
  return address;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;