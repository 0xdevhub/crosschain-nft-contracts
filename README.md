# 0xdevhub - Crosschain NFT contracts

[![Run Tests](https://github.com/0xdevhub/crosschain-nft-contracts/actions/workflows/tests.yml/badge.svg)](https://github.com/0xdevhub/crosschain-nft-contracts/actions/workflows/tests.yml)

## Networks

- Avalanche Fuji (43113)
- Arbitrum Rinkeby (soon)

## Contracts

- Avalanche Fuji: (soon)
- Arbitrum Rinkeby: (soon)

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

### Deploying contracts

ToDo

### Verifing contracts

```shell
pnpm verify --contract contracts/[ContractName].sol:[Contract] --network [networkid] [contractAddress] ["ARGUMENTS"]
```

### Setting chain config

ToDo
