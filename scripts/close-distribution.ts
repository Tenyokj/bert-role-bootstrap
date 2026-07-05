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
  const distributorAddress = getEnv("DISTRIBUTOR_ADDRESS");
  const distributor = await ethers.getContractAt("RoleBootstrapDistributor", distributorAddress);

  const tx = await distributor.closeDistribution();
  await tx.wait();

  console.log("Distribution closed:", distributorAddress);
  console.log("Recommended final step: revoke AUTO_GRANT_ROLE from the distributor in RolesRegistry.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
