# 0xdevhub - Crosschain NFT contracts

[![Run Tests](https://github.com/0xdevhub/crosschain-nft-contracts/actions/workflows/tests.yml/badge.svg)](https://github.com/0xdevhub/crosschain-nft-contracts/actions/workflows/tests.yml)

## Networks

- Avalanche Fuji (43113)
- Optimism Goerli (84531)

## Contracts

#### Bridge Contract

- Avalanche Fuji: 0xFA42AbaECF4CA09097099aEa70210DA7f11e579d
- Optimism Goerli

#### CCIPAdapter

- Avalanche Fuji: 0xF922E2032774cCA4b627fB797fB3E4907Ef35b08
- Optimism Goerli:

##### CCIPAdapterRouter

- Avalanche Fuji: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8
- Optimism Goerli 0xeb52e9ae4a9fb37172978642d4c141ef53876f26

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
