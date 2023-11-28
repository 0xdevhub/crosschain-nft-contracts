# 0xdevhub - Crosschain NFT contracts

[![Run Tests](https://github.com/0xdevhub/crosschain-nft-contracts/actions/workflows/tests.yml/badge.svg)](https://github.com/0xdevhub/crosschain-nft-contracts/actions/workflows/tests.yml)

Please, read [extra guides here](guides-examples.md).

## Networks

- Avalanche Fuji (43113)
- Optimism Goerli (420)

## Contracts

#### Avalanche Fuji (43113)

- Bridge Contract: 0xF793d3D4372935C236422DFA9cd958ec14C80F55 (✅ verified)
- CCIPAdapter: 0x99d73bDEB878197F3BeA347E86fD69541BeB14E4 (✅ verified)
- CCIPAdapterRouter: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8

#### Optimism Goerli (420)

- Bridge Contract: 0xA5fBbb4B142A8062b37A2f2CbeBe8c67F65C9978 (✅ verified)
- CCIPAdapter: 0xfCc1fd12f71a23782Eef2AbbbCaC50c121c9b4Df (✅ verified)
- CCIPAdapterRouter: 0xeb52e9ae4a9fb37172978642d4c141ef53876f26

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

```shell
pnpm hardhat deploy-bridge-contract --network 43113

pnpm hardhat deploy-adapter-contract --network 420 --adapter "CCIPAdapter" --bridge-address 0xA5fBbb4B142A8062b37A2f2CbeBe8c67F65C9978 --router-address 0xeb52e9ae4a9fb37172978642d4c141ef53876f26
```

### Verifing contracts

```shell
pnpm verify --contract contracts/[ContractName].sol:[Contract] --network [networkid] [contractAddress] ["ARGUMENTS"]
```
