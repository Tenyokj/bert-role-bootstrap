import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

async function latestTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  if (!block) {
    throw new Error("Latest block not found");
  }
  return block.timestamp;
}

async function increaseTo(timestamp: number): Promise<void> {
  await networkHelpers.time.increaseTo(timestamp);
}

describe("RoleBootstrapDistributor", function () {
  async function deployFixture(deadlineOffset = 0n) {
    const [owner, curator, reviewer, dual, outsider, other] = await ethers.getSigners();

    const Roles = await ethers.getContractFactory("MockRolesRegistry");
    const roles = await Roles.deploy(owner.address);
    await roles.waitForDeployment();

    const now = BigInt(await latestTimestamp());
    const deadline = deadlineOffset === 0n ? 0n : now + deadlineOffset;

    const Distributor = await ethers.getContractFactory("RoleBootstrapDistributor");
    const distributor = await Distributor.deploy(owner.address, await roles.getAddress(), deadline);
    await distributor.waitForDeployment();

    const autoGrantRole = await roles.AUTO_GRANT_ROLE();
    await roles.grantRole(autoGrantRole, await distributor.getAddress());

    return { owner, curator, reviewer, dual, outsider, other, roles, distributor, deadline };
  }

  it("claims curator role for an eligible address", async function () {
    const { owner, curator, roles, distributor } = await deployFixture();
    const curatorRole = await roles.CURATOR_ROLE();

    await expect(distributor.connect(owner).seedCuratorEligibility([curator.address]))
      .to.emit(distributor, "CuratorEligibilitySeeded")
      .withArgs(curator.address);

    await expect(distributor.connect(curator).claimCuratorRole())
      .to.emit(distributor, "CuratorRoleClaimed")
      .withArgs(curator.address);

    expect(await roles.hasRole(curatorRole, curator.address)).to.equal(true);
    expect(await distributor.hasClaimedCurator(curator.address)).to.equal(true);
  });

  it("claims reviewer role for an eligible address", async function () {
    const { owner, reviewer, roles, distributor } = await deployFixture();
    const reviewerRole = await roles.REVIEWER_ROLE();

    await expect(distributor.connect(owner).seedReviewerEligibility([reviewer.address]))
      .to.emit(distributor, "ReviewerEligibilitySeeded")
      .withArgs(reviewer.address);

    await expect(distributor.connect(reviewer).claimReviewerRole())
      .to.emit(distributor, "ReviewerRoleClaimed")
      .withArgs(reviewer.address);

    expect(await roles.hasRole(reviewerRole, reviewer.address)).to.equal(true);
    expect(await distributor.hasClaimedReviewer(reviewer.address)).to.equal(true);
  });

  it("claims both roles through claimAllEligibleRoles", async function () {
    const { owner, dual, roles, distributor } = await deployFixture();

    await distributor.connect(owner).seedCuratorEligibility([dual.address]);
    await distributor.connect(owner).seedReviewerEligibility([dual.address]);

    await expect(distributor.connect(dual).claimAllEligibleRoles())
      .to.emit(distributor, "CuratorRoleClaimed")
      .withArgs(dual.address);

    expect(await roles.hasRole(await roles.CURATOR_ROLE(), dual.address)).to.equal(true);
    expect(await roles.hasRole(await roles.REVIEWER_ROLE(), dual.address)).to.equal(true);
  });

  it("reverts when non-eligible account tries to claim", async function () {
    const { outsider, distributor } = await deployFixture();

    await expect(distributor.connect(outsider).claimCuratorRole()).to.be.revertedWithCustomError(
      distributor,
      "NotEligible"
    );
  });

  it("reverts on duplicate claims", async function () {
    const { owner, curator, distributor } = await deployFixture();

    await distributor.connect(owner).seedCuratorEligibility([curator.address]);
    await distributor.connect(curator).claimCuratorRole();

    await expect(distributor.connect(curator).claimCuratorRole()).to.be.revertedWithCustomError(
      distributor,
      "AlreadyClaimed"
    );
  });

  it("reverts claimAll when caller has nothing left to claim", async function () {
    const { outsider, distributor } = await deployFixture();

    await expect(distributor.connect(outsider).claimAllEligibleRoles()).to.be.revertedWithCustomError(
      distributor,
      "NotEligible"
    );
  });

  it("owner can close distribution and block future claims", async function () {
    const { owner, curator, distributor } = await deployFixture();

    await distributor.connect(owner).seedCuratorEligibility([curator.address]);
    await expect(distributor.connect(owner).closeDistribution())
      .to.emit(distributor, "DistributionClosed")
      .withArgs(owner.address);

    await expect(distributor.connect(curator).claimCuratorRole()).to.be.revertedWithCustomError(
      distributor,
      "DistributionClosedError"
    );
  });

  it("blocks claims after the deadline", async function () {
    const { owner, curator, distributor, deadline } = await deployFixture(60n);

    await distributor.connect(owner).seedCuratorEligibility([curator.address]);
    await increaseTo(Number(deadline) + 1);

    await expect(distributor.connect(curator).claimCuratorRole()).to.be.revertedWithCustomError(
      distributor,
      "ClaimWindowExpired"
    );
  });

  it("blocks seeding after the deadline", async function () {
    const { owner, other, distributor, deadline } = await deployFixture(60n);

    await increaseTo(Number(deadline) + 1);

    await expect(
      distributor.connect(owner).seedReviewerEligibility([other.address])
    ).to.be.revertedWithCustomError(distributor, "ClaimWindowExpired");
  });

  it("reverts if account already has the protocol role before claim", async function () {
    const { owner, curator, roles, distributor } = await deployFixture();

    await distributor.connect(owner).seedCuratorEligibility([curator.address]);
    await roles.grantRole(await roles.CURATOR_ROLE(), curator.address);

    await expect(distributor.connect(curator).claimCuratorRole()).to.be.revertedWithCustomError(
      distributor,
      "AlreadyHasProtocolRole"
    );
  });

  it("only owner can seed and close", async function () {
    const { curator, other, distributor } = await deployFixture();

    await expect(
      distributor.connect(curator).seedCuratorEligibility([other.address])
    ).to.be.revertedWithCustomError(distributor, "OwnableUnauthorizedAccount");

    await expect(distributor.connect(curator).closeDistribution()).to.be.revertedWithCustomError(
      distributor,
      "OwnableUnauthorizedAccount"
    );
  });
});
