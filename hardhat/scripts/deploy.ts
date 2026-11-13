// Deploys CampusCred to the selected network.
// ADMIN_ADDRESS (optional): the registrar head's wallet. Defaults to the deployer.
// When the deployer is the admin, it is also added as the first issuer (single-wallet demo setup).
import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const admin = process.env.ADMIN_ADDRESS ? ethers.getAddress(process.env.ADMIN_ADDRESS) : deployer.address;
  console.log(`network ${network.name}, deployer ${deployer.address}, admin ${admin}`);

  const cc = await ethers.deployContract("CampusCred", [admin]);
  await cc.waitForDeployment();
  const address = await cc.getAddress();
  console.log(`CampusCred deployed at ${address}`);

  if (admin === deployer.address) {
    const name = process.env.ISSUER_NAME ?? "Office of the Registrar (sample)";
    await (await cc.addIssuer(deployer.address, name)).wait();
    console.log(`issuer added: ${deployer.address} "${name}"`);
  }

  console.log(`verify with: npx hardhat verify --network ${network.name} ${address} ${admin}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
