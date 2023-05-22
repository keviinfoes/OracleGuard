# OracleGuard analyses

## Description
We analyse the OracleGuard quote for historic observations to determine the price difference from the regular TWAP oracle implementation and to analyse price update halting based on historic activity.

The analyses is performed on the relative stable ETH/USDC pair and the relative unstable "meme"coin SHIBA/ETH for single pool quotes and multip pool quotes. To retrieve these historic observations we run the python script [get_historic_0bservations_uniswapV3_pool.py](get_historic_0bservations_uniswapV3_pool.py). The OracleGuard and reqular quote are determined using the test script [oracleGuard_analyses.js](oracleGuard_analyses.js) with the historic observations as input. 

## ETH/USDC pair

### Multi pool 10% max delta
Source: [ETH/USDC multi pool 10% analayses](https://github.com/keviinfoes/OracleGuard/tree/main/historic_analysis/output/ETH%3AUSDC/MULTI-o28_m4_s4-STD1800_MTD1800)
// ADD ANALYSES

### Single pool 10% max delta
Source: // ADD SOURCE
// ADD ANALYSES

### Single pool 20% max delta
Source: [ETH/USDC single pool 20% analayses](https://github.com/keviinfoes/OracleGuard/tree/main/historic_analysis/output/ETH%3AUSDC/pools%5B1%5D-0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8/o28_m4_s4-STD568_MTD1800)

![Scherm­afbeelding 2023-04-06 om 15 18 07](https://user-images.githubusercontent.com/5862753/230396608-bf017801-2d46-437f-9540-f43210db1eca.png)
<sub>Graph 1 - `MAX_TOTAL_TICK_DELTA` 1800 (~= 20% price change)</sub> 

The difference between a regular 30 min TWAP quote is compared to the OracleGuard quote for the period december 2021 - march 2023. The comparisson is visible in graph 1. This shows that the oracle guard quote is comparible to the regular quote. Further that no halting of the oracle guard under these conditions has happend. 

It is possible for the OracleGuard to halt price updates without an oracle attack, in this case during a market price drops >20%. These drops however are rare, as shown by the historic data that does not contain such an event for >2 years for ETH/USDC. In addition drops >20% are short periods of extreme volatility. During these "price discovery" periods we propose that it is beneficial for the oracle to shortly halt price updates until the new price is discovered, this to mitigate risks for the underlying protocols using the price. 

## SHIBA/ETH pair

### Multi pool 10% max delta
Source: // ADD SOURCE
// ADD ANALYSES

### Single pool 10% max delta
Source: Source: [SHIBA/ETH single pool 10% analayses](https://github.com/keviinfoes/OracleGuard/tree/main/historic_analysis/output/SHIBA%3AETH/pools%5B1%5D-0x5764a6F2212D502bC5970f9f129fFcd61e5D7563)
// ADD ANALYSES

### Single pool 20% max delta
Source: // ADD SOURCE
// ADD ANALYSES
