import { readFileSync } from "fs";
import { network } from "hardhat";

const { ethers } = await network.connect();

type AllowlistConfig = {
  curatorEligible?: string[];
  reviewerEligible?: string[];
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const distributorAddress = getEnv("DISTRIBUTOR_ADDRESS");
  const configPath = process.env.ALLOWLIST_CONFIG_PATH ?? "./script-config/allowlists.sample.json";
  const raw = readFileSync(configPath, "utf8");
  const config = JSON.parse(raw) as AllowlistConfig;

  const distributor = await ethers.getContractAt("RoleBootstrapDistributor", distributorAddress);

  const curatorEligible = config.curatorEligible ?? [];
  const reviewerEligible = config.reviewerEligible ?? [];

  if (curatorEligible.length > 0) {
    const tx = await distributor.seedCuratorEligibility(curatorEligible);
    await tx.wait();
    console.log(`Seeded ${curatorEligible.length} curator-eligible addresses`);
  }

  if (reviewerEligible.length > 0) {
    const tx = await distributor.seedReviewerEligibility(reviewerEligible);
    await tx.wait();
    console.log(`Seeded ${reviewerEligible.length} reviewer-eligible addresses`);
  }

  if (curatorEligible.length === 0 && reviewerEligible.length === 0) {
    console.log("No allowlist addresses found in config. Nothing was seeded.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
