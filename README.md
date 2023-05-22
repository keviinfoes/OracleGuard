# OracleGuard
OracleGuard is a modular UniswapV3 oracle extension that favors safety over liveness to mitigate the risk of oracle manipulations. 

* [Background](#Background)
* [Description](#Description)
* [Gascost](#Gascost)
* [Test](#Test)
* [Analyses](#Analyses)
* [License](#License)

## Background
UniswapV3 integrates a time-weighted average price (TWAP) oracle. To calculate the TWAP the pool stores ticks on price changes or liquidity changes. The current main oracle protection is that ticks are stored on changes between blocks, not within blocks. This mitigates flashloan manipulations and under POW also mitigates wash trading manipulations. Wash trading is mitigated by the arbitrage risk during the execution of the wash trade. For more info on the oracle risks under POW see [this](https://github.com/euler-xyz/uni-v3-twap-manipulation) paper by Micheal Bentley.

The transition of Ethereum mainnet from POW to Proof of Stake (PoS) resulted in significant changes in block building. This in turn results in reduction of the arbitrage risk for oracle manipulators because validators can produce consecutive blocks and validators know in advance (~max 2 epochs) the blocks they will propose. With consecutive blocks the validator can order txt in a way that removes the arbitrage risk for oracle manipulation. The higher the market share of a validator the higher the probability of consecutive blocks. See [this](https://alrevuelta.github.io/posts/ethereum-mev-multiblock) paper by Alvaro Revuelta for info on the probability of consecutive blocks per marketshare of a validator. For the effect of consecutive proposals on the UniswapV3 TWAP oracle see [this](https://uniswap.org/blog/uniswap-v3-oracles) research by Austin Adams, Xin Wan, and Noah Zinsmeister.

Note that under POS the oracle manipulator still pays the market fee for the manipulation and needs capital for the wash trade. 

## Description
The goal is to mitigate the risk of oracle manipulation without the need for a change in UniswapV3 or the need for Ethereum protocol changes. The result is the here proposed OracleGuard. 

OracleGuard is a seperate smart contract that checks a set number of `OBSERVATIONS` and removes outliers based on a defined `MAX_SINGLE_TICK_DELTA` between  ticks. If there are more than `MAX_OUTLIERS` the guard halts the price update. If there are less then `MAX_OUTLIERS` it returns the average of the observations without outliers. This method favors safety over liveness. To manipulate the price outside of the `MAX_TOTAL_TICK_DELTA` range a manipulator needs `manipulated observations > OBSERVATIONS - MAX_OUTLIERS`. To halt price updates the manipulator needs `manipulated observations > MAX_OUTLIERS`.

OracleGuard uses the following boundaries:
1. `OBSERVATIONS` the number of tick observations;
2. `MAX_OUTLIERS` the max number of ticks that are out of range;
3. `SKIP` the step between two observations. This is used to pass multiple epochs without needing to check 32 observations per epoch.
4. `MAX_SINGLE_TICK_DELTA` the max difference between the previous stored tick in the array and the current observed tick;
5. `MAX_TOTAL_TICK_DELTA` the max difference in the array with the most observed ticks.

These variables can be set to favor safety or liveness. More `OBSERVATIONS` are safer and more `MAX_OUTLIERS` increases liveness at the cost of `OBSERVATIONS` (safety). Another consideration besides safety and liveness is gascost, see [Gascost](#Gascost).

## Gascost
The testscript estimates the gascosts for `OBSERVATIONS=28 && MAX_OUTLIERS=4` ~200k gas. In this case the oracle manipulator needs to controle 22 observations (44 blocks, observation manipulation requires two consecutive blocks). See [Test](#Test) to run the gascost estimate.

## Test
The tests use the ganache mainnet fork option.

```
// Terminal 1
ganache-cli --fork [node_address || Alchemy URL || Infura URL]

// Terminal 2
truffle test --network mainfork
```

## Analyses
We analyse the difference between the OraceleGuard quote and the regular TWAP implementation quote, including the impact of halting price updates for historic observations. See [historic analyses](https://github.com/keviinfoes/OracleGuard/tree/main/historic_analysis). 

## License
OracleGuard is licensed under `GPL-2.0-or-later`.
