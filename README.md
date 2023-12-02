# 0xdevhub - Crosschain NFT contracts

[![Run Tests](https://github.com/0xdevhub/crosschain-nft-contracts/actions/workflows/tests.yml/badge.svg)](https://github.com/0xdevhub/crosschain-nft-contracts/actions/workflows/tests.yml)

## Networks

- Avalanche Fuji (43113)
- Optimism Goerli (420)
- Mumbai (80001)
- Base goerli (84531)

## Getting Started

```shell
pnpm compile
pnpm typechain
pnpm node
```

## Available scrips by `dlx hardhat`

```shell
dlx hardhat help
REPORT_GAS=true dlx hardhat test
```

## Testing

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

### Deploying bridge contract

```shell
pnpm hardhat deploy-bridge-contract --network 80001
```

#### parameters

`--account-index` - {optional} account index (default 0)

### Deploying adapter contract

```shell

pnpm hardhat deploy-adapter-contract --network 80001 --adapter "CCIPAdapter" --bridge-address 0x3b89046C763c3C8aCD5b62d3c61805b205395957 --router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1

```

#### parameters

`--adapter` - Adapter name

`--bridge-address` - Bridge contract address

`--router-address` - Adapter router contract address

`--fee-token-name` - {optional} Fee token address (default if not set is zero address)

`--account-index` - {optional} account index (default 0)

### Setting chain settings

enabling onramp as the destination chain and offramp as the source chain

```shell
pnpm hardhat set-chain-settings --network 80001 --bridge-address 0x3b89046C763c3C8aCD5b62d3c61805b205395957 --evm-chain-id 43113 --non-evm-chain-id 14767482510784806043 --adapter-address 0x3fb3D961fFB2f632748Bdb22F7AfC141384A38EF ---target-adapter-address 0x998F8187B79705bd9c4cABA39115157B2393801c --is-enabled true
```

#### parameters

`--bridge-address` - Bridge contract address

`--evm-chain-id` - EVM chain id used by bridge

`--non-evm-chain-id` - Non EVM chain id used by adapter

`--adapter-address` - Adapter contract address

`--target-adapter-address` - Target adapter contract address from other chain

`--is-enabled` - Enable or disable chain connection offramp/onramp

`--gas-limit` - {optional} Gas limit (default 200_000n)

`--account-index` - {optional} account index (default 0)

### Setup bridge adapter

```shell
pnpm hardhat setup-bridge-adapter --network 80001 --bridge-address 0x96D103BCb675945DE9C51D9dCa57a14593a54558 --adapter-address 0xBd770416a3345F91E4B34576cb804a576fa48EB1 --adapter-router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingNative --adapter-contract-name CCIPAdapter
```

#### parameters

`--bridge-address` - Bridge contract address

`--adapter-address` - Adapter contract address

`--adapter-router-address` - Adapter router contract address

`--router-to-adapter-function-selector` - Adapter bytes4 signature to call adapter from router

`--bridge-to-adapter-function-selector` - Adapter bytes4 signature to call adapter from bridge

`--adapter-contract-name` - Adapter contract name

`--account-index` - {optional} account index (default 0)

### Verifing contracts

```shell
pnpm verify --network [networkid] --contract contracts/[ContractName].sol:[Contract] [contractAddress] [arguments]
```
