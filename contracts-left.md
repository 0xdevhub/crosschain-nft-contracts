## Contracts

do not use this contract, is just a test

router: 0x70499c328e1e2a3c41108bd3730f6670a44595d1
chainid: 12532609583862916517

# Deploy bridge

=========================
pnpm hardhat deploy-bridge-contract --network 80001

# Deploy adapter

=========================

pnpm hardhat deploy-adapter-contract --network 80001 --adapter "CCIPAdapter" --bridge-address 0x1Bf691F16aE2FA20c4e53B7787FCCBfe863c187c --router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --fee-token-name LINK

# Set chain settings

=========================

pnpm hardhat set-chain-settings --network 80001 --bridge-address 0x1Bf691F16aE2FA20c4e53B7787FCCBfe863c187c --evm-chain-id 43113 --non-evm-chain-id 14767482510784806043 --adapter-address 0xa9e05B1C8Cc483eFb03EBaD156Cd00fc87e54C32 ---target-adapter-address 0xCffb30c3183256592afC335423a65e0c569D43A9 --is-enabled true --gas-limit 4000000

# Setup bridge adapter roles

=========================

pnpm hardhat setup-bridge-adapter --network 80001 --bridge-address 0x1Bf691F16aE2FA20c4e53B7787FCCBfe863c187c --adapter-address 0xa9e05B1C8Cc483eFb03EBaD156Cd00fc87e54C32 --adapter-router-address 0x70499c328e1e2a3c41108bd3730f6670a44595d1 --router-to-adapter-function-selector ccipReceive ----bridge-to-adapter-function-selector sendMessageUsingERC20 --adapter-contract-name CCIPAdapter

# Verify

=========================

pnpm hardhat verify --network 80001 --contract contracts/Bridge.sol:Bridge 0x1Bf691F16aE2FA20c4e53B7787FCCBfe863c187c 0x52Ef16e646A21150b6f8D7A41F0D6A9483EC2196 80001

pnpm hardhat verify --network 80001 --contract contracts/adapters/CCIPAdapter.sol:CCIPAdapter 0xa9e05B1C8Cc483eFb03EBaD156Cd00fc87e54C32 0x1Bf691F16aE2FA20c4e53B7787FCCBfe863c187c 0x52Ef16e646A21150b6f8D7A41F0D6A9483EC2196 0x70499c328e1e2a3c41108bd3730f6670a44595d1 0x326C977E6efc84E512bB9C30f76E30c160eD06FB

# Bridge ERC721 using ERC20 token as fee

=========================

pnpm hardhat bridge-erc721-using-erc20 --network 80001 --token-name "Doodle" --token-symbol "DOD" --bridge-address 0x1Bf691F16aE2FA20c4e53B7787FCCBfe863c187c --adapter-address 0xa9e05B1C8Cc483eFb03EBaD156Cd00fc87e54C32 --target-network 43113 --fee-token-name LINK

# Execute

pnpm hardhat execute-message --network 80001 --adapter-address 0xa9e05B1C8Cc483eFb03EBaD156Cd00fc87e54C32

=========================

pnpm hardhat bridge-erc721 --network 80001 --token-address 0x46bef163d6c470a4774f9585f3500ae3b642e751 --token-id 530 --bridge-address 0x1Bf691F16aE2FA20c4e53B7787FCCBfe863c187c --adapter-address 0xa9e05B1C8Cc483eFb03EBaD156Cd00fc87e54C32 --target-network 43113 --fee-token-name LINK --origin-chain-evm-id 80001
