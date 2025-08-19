import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployRWAHouse: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying RWAHouse contract...");

  const rwaHouse = await deploy("RWAHouse", {
    from: deployer,
    args: [], // No constructor arguments needed
    log: true,
    skipIfAlreadyDeployed: false,
  });

  console.log(`RWAHouse deployed to: ${rwaHouse.address}`);
  console.log(`Transaction hash: ${rwaHouse.transactionHash}`);
};

export default deployRWAHouse;
deployRWAHouse.tags = ["RWAHouse"];