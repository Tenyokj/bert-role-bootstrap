import { network } from "hardhat";

const { ethers } = await network.connect();

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const rolesRegistryAddress = getEnv("ROLES_REGISTRY_ADDRESS");
  const distributorAddress = getEnv("DISTRIBUTOR_ADDRESS");

  const abi = [
    "function AUTO_GRANT_ROLE() view returns (bytes32)",
    "function grantRole(bytes32 role, address account) external"
  ];

  const rolesRegistry = await ethers.getContractAt(abi, rolesRegistryAddress);
  const role = await rolesRegistry.AUTO_GRANT_ROLE();
  const tx = await rolesRegistry.grantRole(role, distributorAddress);
  await tx.wait();

  console.log("Granted AUTO_GRANT_ROLE");
  console.log("rolesRegistry:", rolesRegistryAddress);
  console.log("distributor:", distributorAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
