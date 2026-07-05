# BERT Role Bootstrap

One-time self-claim distributor for initial `CURATOR_ROLE` and `REVIEWER_ROLE` seeding in BERT V2.

## What it does

- owner seeds allowlisted curator addresses
- owner seeds allowlisted reviewer addresses
- eligible users claim their roles themselves
- owner closes distribution when bootstrap is complete
- protocol admin then revokes `AUTO_GRANT_ROLE` from the distributor

This project is intentionally separate from `bert-core-v2` because it is an operational bootstrap utility, not protocol core logic.

## Contract

- `RoleBootstrapDistributor.sol`

Requirements:

1. Deploy the distributor with the live `RolesRegistry` address.
2. Grant `AUTO_GRANT_ROLE` in `RolesRegistry` to the deployed distributor.
3. Seed allowlists.
4. Let users claim.
5. Close distribution.
6. Revoke `AUTO_GRANT_ROLE` from the distributor.

## Setup

```bash
npm install
cp .env.example .env
```

## Compile and test

```bash
npm run compile
npm run test
```

## Environment

Required values:

- `ROLES_REGISTRY_ADDRESS`
- `DEPLOYER_KEY` for live deploys

Optional values:

- `BOOTSTRAP_OWNER`
- `CLAIM_DEADLINE`
- `DISTRIBUTOR_ADDRESS`
- `ALLOWLIST_CONFIG_PATH`

If `CLAIM_DEADLINE=0`, claims have no time limit.

## Deploy

```bash
npm run deploy:sepolia
```

or

```bash
npm run deploy:arcTestnet
```

## Grant AUTO_GRANT_ROLE

After deploy, the distributor still cannot issue roles until `RolesRegistry` grants it `AUTO_GRANT_ROLE`.

You can do it with the included script:

```bash
npm run grant:auto:sepolia
```

## Seed allowlists

Edit `script-config/allowlists.sample.json` or point `ALLOWLIST_CONFIG_PATH` to your real file.

Then run:

```bash
npm run seed:sepolia
```

## Close distribution

```bash
npm run close:sepolia
```

After that, revoke `AUTO_GRANT_ROLE`:

```bash
npm run revoke:auto:sepolia
```

## Suggested real-world flow

1. prepare `15` curator addresses
2. prepare `15` reviewer addresses
3. deploy distributor
4. grant `AUTO_GRANT_ROLE`
5. seed allowlists
6. announce claim window
7. close distribution
8. revoke `AUTO_GRANT_ROLE`

## Notes

- this contract is intentionally one-time and simple
- it is safer than open public claiming
- it avoids changing `bert-core-v2`
