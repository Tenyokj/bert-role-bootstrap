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
  const rolesRegistry = getEnv("ROLES_REGISTRY_ADDRESS");
  const owner = process.env.BOOTSTRAP_OWNER ?? (await ethers.getSigners())[0].address;
  const claimDeadline = Number(process.env.CLAIM_DEADLINE ?? "0");

  const Distributor = await ethers.getContractFactory("RoleBootstrapDistributor");
  const distributor = await Distributor.deploy(owner, rolesRegistry, claimDeadline);
  await distributor.waitForDeployment();

  console.log("RoleBootstrapDistributor deployed");
  console.log("network:", network.name);
  console.log("owner:", owner);
  console.log("rolesRegistry:", rolesRegistry);
  console.log("claimDeadline:", claimDeadline);
  console.log("distributor:", await distributor.getAddress());
  console.log("");
  console.log("Next step:");
  console.log("Grant AUTO_GRANT_ROLE in RolesRegistry to this distributor address before opening claims.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
