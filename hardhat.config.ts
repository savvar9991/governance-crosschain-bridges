import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { HardhatUserConfig } from 'hardhat/types';
import '@typechain/hardhat';
import '@typechain/ethers-v5';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import '@tenderly/hardhat-tenderly';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'hardhat-dependency-compiler';
import 'hardhat-contract-sizer';
import 'solidity-coverage';

config();

import { accounts } from './helpers/test-wallets';
import {
  eArbitrumNetwork,
  eEthereumNetwork,
  eNetwork,
  eOptimismNetwork,
  ePolygonNetwork,
  eXDaiNetwork,
  eLiskNetwork,
} from './helpers/types';
import { NETWORKS_RPC_URL } from './helper-hardhat-config';

const SKIP_LOAD = process.env.SKIP_LOAD === 'true';
const TASK_FOLDERS = ['deploy', 'governance', 'l2', 'misc', 'setup', 'verify'];
if (!SKIP_LOAD) {
  TASK_FOLDERS.forEach((folder) => {
    const tasksPath = path.join(__dirname, './tasks', folder);
    fs.readdirSync(tasksPath)
      .filter((pth) => pth.includes('.ts') || pth.includes('.js'))
      .forEach((task) => {
        require(`${tasksPath}/${task}`);
      });
  });
}

const MNEMONIC_PATH = "m/44'/60'/0'/0";
const MNEMONIC = process.env.MNEMONIC || '';
const MAINNET_FORK = process.env.MAINNET_FORK === 'true';
const FORKING_BLOCK_NUMBER = process.env.FORKING_BLOCK_NUMBER;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || '';
const ARBISCAN_KEY = process.env.ARBISCAN_KEY || '';
const OPTIMISTIC_ETHERSCAN_KEY = process.env.OPTIMISTIC_ETHERSCAN_KEY || '';
const TENDERLY_PROJECT = process.env.TENDERLY_PROJECT || '';
const TENDERLY_USERNAME = process.env.TENDERLY_USERNAME || '';

const getCommonNetworkConfig = (networkName: eNetwork, chainId: number) => {
  // For deployment, load the deployer account from the PRIVATE_KEY env variable
  // if provided
  const accounts = process.env.PRIVATE_KEY
    ? [process.env.PRIVATE_KEY]
    : {
        mnemonic: MNEMONIC,
        path: MNEMONIC_PATH,
        initialIndex: 0,
        count: 20,
      };
  return {
    url: NETWORKS_RPC_URL[networkName],
    chainId,
    accounts,
  };
};

const mainnetFork = MAINNET_FORK
  ? {
      blockNumber: FORKING_BLOCK_NUMBER ? Number.parseInt(FORKING_BLOCK_NUMBER) : 14340480,
      url: NETWORKS_RPC_URL['main'],
    }
  : undefined;

const hardhatConfig: HardhatUserConfig = {
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  namedAccounts: {
    deployer: 0,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
  },
  solidity: {
    compilers: [
      {
        version: '0.8.10',
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
      {
        version: '0.7.5',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            details: {
              yul: true,
            },
          },
        },
      },
      { version: '0.7.3', settings: { optimizer: { enabled: true, runs: 200 } } },
      { version: '0.5.2', settings: { optimizer: { enabled: true, runs: 200 } } },
    ],
  },
  etherscan: {
    apiKey: {
      optimisticEthereum: OPTIMISTIC_ETHERSCAN_KEY,
      arbitrumOne: ARBISCAN_KEY,
      optimisticSepolia: OPTIMISTIC_ETHERSCAN_KEY,
      'lisk-sepolia': ETHERSCAN_KEY,
      lisk: ETHERSCAN_KEY,
    },

    customChains: [
      {
        network: 'sepolia',
        chainId: 11155111,
        urls: {
          apiURL: 'https://api-sepolia.etherscan.io/api',
          browserURL: 'https://sepolia.etherscan.io',
        },
      },
      {
        network: 'optimisticSepolia',
        chainId: 11155420,
        urls: {
          apiURL: 'https://api-sepolia-optimism.etherscan.io/api',
          browserURL: 'https://sepolia-optimism.etherscan.io',
        },
      },
      {
        network: 'lisk',
        chainId: 1135,
        urls: {
          apiURL: 'https://blockscout.lisk.com/api',
          browserURL: 'https://blockscout.lisk.com',
        },
      },
      {
        network: 'lisk-sepolia',
        chainId: 4202,
        urls: {
          apiURL: 'https://sepolia-blockscout.lisk.com/api',
          browserURL: 'https://sepolia-blockscout.lisk.com',
        },
      },
    ],
  },
  tenderly: {
    project: TENDERLY_PROJECT,
    username: TENDERLY_USERNAME,
    forkNetwork: '137',
  },
  mocha: {
    timeout: 100000,
  },
  networks: {
    sepolia: {
      ...getCommonNetworkConfig(eEthereumNetwork.sepolia, 11155111),
      companionNetworks: {
        optimism: eOptimismNetwork.testnet,
        arbitrum: eArbitrumNetwork.arbitrumTestnet,
        lisk: eLiskNetwork.testnet,
      },
    },
    goerli: getCommonNetworkConfig(eEthereumNetwork.goerli, 5),
    main: {
      ...getCommonNetworkConfig(eEthereumNetwork.main, 1),
      companionNetworks: {
        optimism: eOptimismNetwork.main,
        arbitrum: eArbitrumNetwork.arbitrum,
        lisk: eLiskNetwork.main,
      },
    },
    tenderlyMain: getCommonNetworkConfig(eEthereumNetwork.tenderlyMain, 5),
    matic: getCommonNetworkConfig(ePolygonNetwork.matic, 137),
    mumbai: getCommonNetworkConfig(ePolygonNetwork.mumbai, 80001),
    xdai: getCommonNetworkConfig(eXDaiNetwork.xdai, 100),
    [eArbitrumNetwork.arbitrum]: getCommonNetworkConfig(eArbitrumNetwork.arbitrum, 42161),
    [eArbitrumNetwork.arbitrumTestnet]: {
      ...getCommonNetworkConfig(eArbitrumNetwork.arbitrumTestnet, 421611),
      companionNetworks: {
        l1: 'sepolia',
      },
    },
    [eOptimismNetwork.main]: getCommonNetworkConfig(eOptimismNetwork.main, 10),
    [eOptimismNetwork.testnet]: {
      ...getCommonNetworkConfig(eOptimismNetwork.testnet, 11155420),
      companionNetworks: {
        l1: 'sepolia',
      },
    },
    [eLiskNetwork.main]: getCommonNetworkConfig(eLiskNetwork.main, 1135),
    [eLiskNetwork.testnet]: {
      ...getCommonNetworkConfig(eLiskNetwork.testnet, 4202),
      companionNetworks: {
        l1: 'sepolia',
      },
    },
    hardhat: {
      accounts: accounts.map(({ secretKey, balance }: { secretKey: string; balance: string }) => ({
        privateKey: secretKey,
        balance,
      })),
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      forking: mainnetFork,
    },
  },
  dependencyCompiler: {
    paths: [
      '@aave/governance-v2/contracts/governance/AaveGovernanceV2.sol',
      '@aave/governance-v2/contracts/governance/Executor.sol',
    ],
  },
};

export default hardhatConfig;
