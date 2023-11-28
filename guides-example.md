## Examples to setting chain id

### 420 (goerli)

#### set chain settings (onramp)

```shell
pnpm hardhat set-chain-settings --network 420 --bridge-address 0xA5fBbb4B142A8062b37A2f2CbeBe8c67F65C9978 --evm-chain-id 43113 --non-evm-chain-id 2664363617261496610 --adapter-address 0xfCc1fd12f71a23782Eef2AbbbCaC50c121c9b4Df --ramp-type 0 --is-enabled true
```

=======================================================================================

### 43113 (43113)

- access management: 0x091BEbE42637D6c283f88ceF478Cab8581293f73
- 3 ccip router: 0x554472a2720e5e7d5d3c817529aba05eed5f82d8
- 2 ccip adapter: 0x99d73bDEB878197F3BeA347E86fD69541BeB14E4
- 1 bridge: 0xF793d3D4372935C236422DFA9cd958ec14C80F55

#### set chain settings (offramp)

```shell
pnpm hardhat set-chain-settings --network 43113 --bridge-address 0xA5fBbb4B142A8062b37A2f2CbeBe8c67F65C9978 --evm-chain-id 420 --non-evm-chain-id 2664363617261496610 --adapter-address 0xfCc1fd12f71a23782Eef2AbbbCaC50c121c9b4Df --ramp-type 0 --is-enabled true
```

=======================================================================================
