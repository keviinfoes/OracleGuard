# OracleGuard analyses

## Description
We analyse the OracleGuard quote for historic observations to determine the price difference from the regular TWAP oracle implementation and to analyse price update halting based on historic activity.

The analyses is performed on the relative stable ETH/USDC pair and the relative unstable "meme"coin SHIBA/ETH for single pool quotes and multip pool quotes. To retrieve these historic observations we run the python script [get_historic_0bservations_uniswapV3_pool.py](get_historic_0bservations_uniswapV3_pool.py). The OracleGuard and reqular quote are determined using the test script [oracleGuard_analyses.js](oracleGuard_analyses.js) with the historic observations as input. 

## ETH/USDC pair

### Multi pool 10% max delta
Source: [ETH/USDC multi pool 10% analayses](https://github.com/keviinfoes/OracleGuard/tree/main/historic_analysis/output/ETH%3AUSDC/MULTI-o28_m4_s4-STD1800_MTD1800)

![multi pool 10%](https://github.com/keviinfoes/OracleGuard/blob/main/analysis/assets/eth%3Ausdc-multi-pool-10%25.png)
<sub>Graph 1 - `MAX_TOTAL_TICK_DELTA` 900 (~= 10% price change), `OBSERVATIONS` 28</sub> 

The difference between a regular 30 min TWAP quote is compared to the OracleGuard quote for the highly volatile period december 2021 - april 2022. The comparisson is visible in graph 1.

The data shows no halting of the price update in this volatile period. Further it shows a significant difference between the regular 30 min TWAP quote and the OracleGuard quote. The regular 30 min TWAP quote stays above ~3000 usdc for the entire period while the OracleGuard quote moves between the 2100 usdc to 3100 usdc. Based on a comparison with the data on coinmarketcap (see graph 2) we conclude that the OracleGuard quote is more in line with the actual market wide price movement then the 30 min TWAP oracle.

![coinmarketcap compare](https://github.com/keviinfoes/OracleGuard/blob/main/analysis/assets/eth%3Ausdc-coinmarketcap-compare.png)

<sub>Graph 2 - coinmarketcap ETH/USDC</sub> 

### Single pool 20% max delta
Source: [ETH/USDC single pool 20% analayses](https://github.com/keviinfoes/OracleGuard/tree/main/historic_analysis/output/ETH%3AUSDC/pools%5B1%5D-0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8/o28_m4_s4-STD568_MTD1800)

![single pool 20%](https://github.com/keviinfoes/OracleGuard/blob/main/analysis/assets/eth%3Ausdc-pool%5B1%5D-20%25.png)
<sub>Graph 3 - `MAX_TOTAL_TICK_DELTA` 1800 (~= 20% price change), `OBSERVATIONS` 28</sub> 

The difference between a regular 30 min TWAP quote is compared to the OracleGuard quote for the extended period december 2021 - march 2023. The comparisson is visible in graph 3. The data shows that no halting happend during this period. Further the qraph makes it visible that the quotes are highly comparable.

## SHIBA/ETH pair

### Single pool 10% max delta
Source: Source: [SHIBA/ETH single pool 10% analayses](https://github.com/keviinfoes/OracleGuard/tree/main/historic_analysis/output/SHIBA%3AETH/pools%5B1%5D-0x5764a6F2212D502bC5970f9f129fFcd61e5D7563)

![single pool 10%](https://github.com/keviinfoes/OracleGuard/blob/main/analysis/assets/shiba%3Aeth-pool%5B1%5D-10%25.png)
<sub>Graph 4 - `MAX_TOTAL_TICK_DELTA` 900 (~= 10% price change), `OBSERVATIONS` 22</sub> 

The difference between a regular 30 min TWAP quote is compared to the OracleGuard quote for the volatile period oktober 2021 - december 2021. The comparisson is visible in graph 4. The data shows multiple halting events in this volatile period (1454 data points). The total mount of halting of price updates is (1454 * 12 / 60 / 60) ~5 hours over a period of 3 months. The halting events are distributed over this period, as shown in the graph. The OracleGuard quote (excluding the price update halts) is comparable to the 30 min TWAP. It is more stable with less spikes.

Note that halting only refers to price updates, not the entire dapp that uses the oracle. The OracleGuard pauses the updates awaiting price stabilization. For the analyses the halting is made visible by the drops to zero in the graph.
The OracleGuard updates every 12 seconds and during this period paused updates only for a total of 5 hours for a highly volatile asset during its most volatile period to date. For comparisson the chainlink ETH/USDC oracle updates only once every hour (or movement >10%). 

### Single pool 20% max delta
Source: Source: [SHIBA/ETH single pool 20% analayses]()

![single pool 20%](https://github.com/keviinfoes/OracleGuard/blob/main/analysis/assets/shiba%3Aeth-pool%5B1%5D-20%25.png)
<sub>Graph 5 - `MAX_TOTAL_TICK_DELTA` 1800 (~= 20% price change), `OBSERVATIONS` 22</sub> 

The difference between a regular 30 min TWAP quote is compared to the OracleGuard quote for the volatile period oktober 2021 - december 2021. The comparisson is visible in graph 5. The data shows minimal halting events in this volatile period (37 data points). The total mount of halting of price updates is (37 * 12 / 60) ~7 minutes over a period of 3 months. The OracleGuard quote is comparable to the 30 min TWAP. It is more stable with less spikes.
