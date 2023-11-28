## Examples to setting chain id

### 420 (goerli)

#### set chain settings (onramp)

```shell
pnpm hardhat set-chain-settings --network 420 --bridge-address 0xA5fBbb4B142A8062b37A2f2CbeBe8c67F65C9978 --evm-chain-id 43113 --non-evm-chain-id 2664363617261496610 --adapter-address 0xfCc1fd12f71a23782Eef2AbbbCaC50c121c9b4Df --ramp-type 0 --is-enabled true
```

=======================================================================================

### 43113 (43113)

#### set chain settings (offramp)

```shell
pnpm hardhat set-chain-settings --network 43113 --bridge-address 0xA5fBbb4B142A8062b37A2f2CbeBe8c67F65C9978 --evm-chain-id 420 --non-evm-chain-id 2664363617261496610 --adapter-address 0xfCc1fd12f71a23782Eef2AbbbCaC50c121c9b4Df --ramp-type 1 --is-enabled true
```

=======================================================================================
