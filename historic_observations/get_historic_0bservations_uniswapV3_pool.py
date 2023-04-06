"""
STORES THE OLDEST ARRAY OF CARDINALITY OBSERVATIONS IN FILE 1 (START DATA)
STORES ALL SUBSEQUENT CHANGED OBSERVATIONS IN FILE 2 (CHANGES DATA)
"""

#Analyses for OracleGuard - het historic observations
from web3 import Web3
import csv

#INPUT DATA
Web3_provider = "http://127.0.0.1:8545"                             #[add node url - home_node or alchemy or infura]
path_start = "/Users/username/Desktop/start_observations.csv"       #[add path for storing csv -> start data]
path_changes = "/Users/username/Desktop/changes_observations.csv"   #[add path for storing csv -> changes data]
block = "13875111"                                                  #[add highest block for observation -> gets the observations from (block - 1,000,000) to block]
base_token = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"           #[add first token for pool]
quote_token = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"          #[add first token for pool]
index_pool = "1"                                                    #[add index for pool to check (0 - 3)]

#Web3 data
web3 = Web3(Web3.HTTPProvider(Web3_provider))

#Connect to Static Oracle
abi_StaticOracle = '''[{"inputs":[{"internalType":"contract IUniswapV3Factory","name":"_UNISWAP_V3_FACTORY","type":"address"},{"internalType":"uint8","name":"_CARDINALITY_PER_MINUTE","type":"uint8"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"CARDINALITY_PER_MINUTE","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"UNISWAP_V3_FACTORY","outputs":[{"internalType":"contract IUniswapV3Factory","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint24","name":"_feeTier","type":"uint24"}],"name":"addNewFeeTier","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_tokenA","type":"address"},{"internalType":"address","name":"_tokenB","type":"address"}],"name":"getAllPoolsForPair","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_tokenA","type":"address"},{"internalType":"address","name":"_tokenB","type":"address"}],"name":"isPairSupported","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_tokenA","type":"address"},{"internalType":"address","name":"_tokenB","type":"address"},{"internalType":"uint16","name":"_cardinality","type":"uint16"}],"name":"prepareAllAvailablePoolsWithCardinality","outputs":[{"internalType":"address[]","name":"_preparedPools","type":"address[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_tokenA","type":"address"},{"internalType":"address","name":"_tokenB","type":"address"},{"internalType":"uint32","name":"_period","type":"uint32"}],"name":"prepareAllAvailablePoolsWithTimePeriod","outputs":[{"internalType":"address[]","name":"_preparedPools","type":"address[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_tokenA","type":"address"},{"internalType":"address","name":"_tokenB","type":"address"},{"internalType":"uint24[]","name":"_feeTiers","type":"uint24[]"},{"internalType":"uint16","name":"_cardinality","type":"uint16"}],"name":"prepareSpecificFeeTiersWithCardinality","outputs":[{"internalType":"address[]","name":"_preparedPools","type":"address[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_tokenA","type":"address"},{"internalType":"address","name":"_tokenB","type":"address"},{"internalType":"uint24[]","name":"_feeTiers","type":"uint24[]"},{"internalType":"uint32","name":"_period","type":"uint32"}],"name":"prepareSpecificFeeTiersWithTimePeriod","outputs":[{"internalType":"address[]","name":"_preparedPools","type":"address[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_pools","type":"address[]"},{"internalType":"uint16","name":"_cardinality","type":"uint16"}],"name":"prepareSpecificPoolsWithCardinality","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_pools","type":"address[]"},{"internalType":"uint32","name":"_period","type":"uint32"}],"name":"prepareSpecificPoolsWithTimePeriod","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint128","name":"_baseAmount","type":"uint128"},{"internalType":"address","name":"_baseToken","type":"address"},{"internalType":"address","name":"_quoteToken","type":"address"},{"internalType":"uint32","name":"_period","type":"uint32"}],"name":"quoteAllAvailablePoolsWithTimePeriod","outputs":[{"internalType":"uint256","name":"_quoteAmount","type":"uint256"},{"internalType":"address[]","name":"_queriedPools","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint128","name":"_baseAmount","type":"uint128"},{"internalType":"address","name":"_baseToken","type":"address"},{"internalType":"address","name":"_quoteToken","type":"address"},{"internalType":"uint24[]","name":"_feeTiers","type":"uint24[]"},{"internalType":"uint32","name":"_period","type":"uint32"}],"name":"quoteSpecificFeeTiersWithTimePeriod","outputs":[{"internalType":"uint256","name":"_quoteAmount","type":"uint256"},{"internalType":"address[]","name":"_queriedPools","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint128","name":"_baseAmount","type":"uint128"},{"internalType":"address","name":"_baseToken","type":"address"},{"internalType":"address","name":"_quoteToken","type":"address"},{"internalType":"address[]","name":"_pools","type":"address[]"},{"internalType":"uint32","name":"_period","type":"uint32"}],"name":"quoteSpecificPoolsWithTimePeriod","outputs":[{"internalType":"uint256","name":"_quoteAmount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"supportedFeeTiers","outputs":[{"internalType":"uint24[]","name":"","type":"uint24[]"}],"stateMutability":"view","type":"function"}]'''
address_StaticOracle = web3.toChecksumAddress("0xB210CE856631EeEB767eFa666EC7C1C57738d438")
contract_StaticOracle = web3.eth.contract(address_StaticOracle, abi=abi_StaticOracle)

pools = contract_StaticOracle.functions.getAllPoolsForPair(
    base_token,
    quote_token 
).call()

#Connect to Pool ETH/USDC
abi_UniV3Pool = '''[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"int24","name":"tickLower","type":"int24"},{"indexed":true,"internalType":"int24","name":"tickUpper","type":"int24"},{"indexed":false,"internalType":"uint128","name":"amount","type":"uint128"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"},{"indexed":true,"internalType":"int24","name":"tickLower","type":"int24"},{"indexed":true,"internalType":"int24","name":"tickUpper","type":"int24"},{"indexed":false,"internalType":"uint128","name":"amount0","type":"uint128"},{"indexed":false,"internalType":"uint128","name":"amount1","type":"uint128"}],"name":"Collect","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint128","name":"amount0","type":"uint128"},{"indexed":false,"internalType":"uint128","name":"amount1","type":"uint128"}],"name":"CollectProtocol","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"paid0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"paid1","type":"uint256"}],"name":"Flash","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"observationCardinalityNextOld","type":"uint16"},{"indexed":false,"internalType":"uint16","name":"observationCardinalityNextNew","type":"uint16"}],"name":"IncreaseObservationCardinalityNext","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"indexed":false,"internalType":"int24","name":"tick","type":"int24"}],"name":"Initialize","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"int24","name":"tickLower","type":"int24"},{"indexed":true,"internalType":"int24","name":"tickUpper","type":"int24"},{"indexed":false,"internalType":"uint128","name":"amount","type":"uint128"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"feeProtocol0Old","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"feeProtocol1Old","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"feeProtocol0New","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"feeProtocol1New","type":"uint8"}],"name":"SetFeeProtocol","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"int256","name":"amount0","type":"int256"},{"indexed":false,"internalType":"int256","name":"amount1","type":"int256"},{"indexed":false,"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"indexed":false,"internalType":"uint128","name":"liquidity","type":"uint128"},{"indexed":false,"internalType":"int24","name":"tick","type":"int24"}],"name":"Swap","type":"event"},{"inputs":[{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"},{"internalType":"uint128","name":"amount","type":"uint128"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"},{"internalType":"uint128","name":"amount0Requested","type":"uint128"},{"internalType":"uint128","name":"amount1Requested","type":"uint128"}],"name":"collect","outputs":[{"internalType":"uint128","name":"amount0","type":"uint128"},{"internalType":"uint128","name":"amount1","type":"uint128"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint128","name":"amount0Requested","type":"uint128"},{"internalType":"uint128","name":"amount1Requested","type":"uint128"}],"name":"collectProtocol","outputs":[{"internalType":"uint128","name":"amount0","type":"uint128"},{"internalType":"uint128","name":"amount1","type":"uint128"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"fee","outputs":[{"internalType":"uint24","name":"","type":"uint24"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeGrowthGlobal0X128","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeGrowthGlobal1X128","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"flash","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint16","name":"observationCardinalityNext","type":"uint16"}],"name":"increaseObservationCardinalityNext","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"liquidity","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxLiquidityPerTick","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"},{"internalType":"uint128","name":"amount","type":"uint128"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"mint","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"observations","outputs":[{"internalType":"uint32","name":"blockTimestamp","type":"uint32"},{"internalType":"int56","name":"tickCumulative","type":"int56"},{"internalType":"uint160","name":"secondsPerLiquidityCumulativeX128","type":"uint160"},{"internalType":"bool","name":"initialized","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32[]","name":"secondsAgos","type":"uint32[]"}],"name":"observe","outputs":[{"internalType":"int56[]","name":"tickCumulatives","type":"int56[]"},{"internalType":"uint160[]","name":"secondsPerLiquidityCumulativeX128s","type":"uint160[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"positions","outputs":[{"internalType":"uint128","name":"liquidity","type":"uint128"},{"internalType":"uint256","name":"feeGrowthInside0LastX128","type":"uint256"},{"internalType":"uint256","name":"feeGrowthInside1LastX128","type":"uint256"},{"internalType":"uint128","name":"tokensOwed0","type":"uint128"},{"internalType":"uint128","name":"tokensOwed1","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"protocolFees","outputs":[{"internalType":"uint128","name":"token0","type":"uint128"},{"internalType":"uint128","name":"token1","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint8","name":"feeProtocol0","type":"uint8"},{"internalType":"uint8","name":"feeProtocol1","type":"uint8"}],"name":"setFeeProtocol","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"slot0","outputs":[{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"uint16","name":"observationIndex","type":"uint16"},{"internalType":"uint16","name":"observationCardinality","type":"uint16"},{"internalType":"uint16","name":"observationCardinalityNext","type":"uint16"},{"internalType":"uint8","name":"feeProtocol","type":"uint8"},{"internalType":"bool","name":"unlocked","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"}],"name":"snapshotCumulativesInside","outputs":[{"internalType":"int56","name":"tickCumulativeInside","type":"int56"},{"internalType":"uint160","name":"secondsPerLiquidityInsideX128","type":"uint160"},{"internalType":"uint32","name":"secondsInside","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"bool","name":"zeroForOne","type":"bool"},{"internalType":"int256","name":"amountSpecified","type":"int256"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[{"internalType":"int256","name":"amount0","type":"int256"},{"internalType":"int256","name":"amount1","type":"int256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"int16","name":"","type":"int16"}],"name":"tickBitmap","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tickSpacing","outputs":[{"internalType":"int24","name":"","type":"int24"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"int24","name":"","type":"int24"}],"name":"ticks","outputs":[{"internalType":"uint128","name":"liquidityGross","type":"uint128"},{"internalType":"int128","name":"liquidityNet","type":"int128"},{"internalType":"uint256","name":"feeGrowthOutside0X128","type":"uint256"},{"internalType":"uint256","name":"feeGrowthOutside1X128","type":"uint256"},{"internalType":"int56","name":"tickCumulativeOutside","type":"int56"},{"internalType":"uint160","name":"secondsPerLiquidityOutsideX128","type":"uint160"},{"internalType":"uint32","name":"secondsOutside","type":"uint32"},{"internalType":"bool","name":"initialized","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]'''
address_UniV3Pool500= web3.toChecksumAddress(pools[0])
address_UniV3Pool3000= web3.toChecksumAddress(pools[1])
address_UniV3Pool10000= web3.toChecksumAddress(pools[2])
address_UniV3Pool100= web3.toChecksumAddress(pools[3])
contract_UniV3Pool500 = web3.eth.contract(address_UniV3Pool500, abi=abi_UniV3Pool)
contract_UniV3Pool3000 = web3.eth.contract(address_UniV3Pool3000, abi=abi_UniV3Pool)
contract_UniV3Pool10000 = web3.eth.contract(address_UniV3Pool10000, abi=abi_UniV3Pool)
contract_UniV3Pool100 = web3.eth.contract(address_UniV3Pool100, abi=abi_UniV3Pool)
contracts_pools = [contract_UniV3Pool500, contract_UniV3Pool3000, contract_UniV3Pool10000, contract_UniV3Pool100]

def handle_event(blockNumber):
    last_index = 0
    index_pool = 1
    #Loops to perform
    checks = 1000000
    loop = checks
    #Create CSV file
    Path_storeCSV_first = path_start
    Table_namesSubmit_first = ["", "BLOCKNUMBER", "CURRENT INDEX"]
    #Store CSV Table 
    with open(Path_storeCSV_first, 'w') as writeFile:
        writer = csv.writer(writeFile)
        writer.writerow(Table_namesSubmit_first)
        writeFile.close()
     #Create CSV file
    Path_storeCSV_changes = path_changes
    Table_namesSubmit_changes = ["BLOCKNUMBER", "CURRENT INDEX", "TIMESTAMP", "TICK CUMULATIVE", "SECONDS LIQUIDITY CUMULATIVE", "INITIALIZED", "CONSULT_CUMULATIVE_1800_0", "CONSULT_CUMULATIVE_1800_1", "CONSULT_WEIGHT_1800_0","CONSULT_WEIGHT_1800_1"]
     #Store CSV Table 
    with open(Path_storeCSV_changes, 'w') as writeFile:
        writer = csv.writer(writeFile)
        writer.writerow(Table_namesSubmit_changes)
        writeFile.close()
    while loop > 0:
        checkBlock = blockNumber - loop
        if loop == checks:
            #Get pool observations  
            pool_slot0 = contracts_pools[index_pool].functions.slot0().call(block_identifier = checkBlock)
            last_index = pool_slot0[2]
            # Add data to CSV file
            newRow = []
            newRow.extend(["", checkBlock, pool_slot0[2]])
            with open(Path_storeCSV_first, 'a') as writeFile:
                writer = csv.writer(writeFile)
                writer.writerow(newRow)
                writeFile.close()
            # Get observation data
            Table_namesSubmit = ["INDEX", "TIMESTAMP", "TICK CUMULATIVE", "SECONDS LIQUIDITY CUMULATIVE", "INITIALIZED", "CONSULT_CUMULATIVE_1800_0", "CONSULT_CUMULATIVE_1800_1", "CONSULT_WEIGHT_1800_0","CONSULT_WEIGHT_1800_1"]
            #Store CSV Table 
            with open(Path_storeCSV_first, 'a') as writeFile:
                writer = csv.writer(writeFile)
                writer.writerow(Table_namesSubmit)
                writeFile.close()
            #Get first array
            x = 0
            while x < pool_slot0[3]:
                consult_1800 = contracts_pools[index_pool].functions.observe([1800, 0]).call(block_identifier = checkBlock)
                observation = contracts_pools[index_pool].functions.observations(x).call(block_identifier = checkBlock)
                array_observations = []
                array_observations.extend([x, observation[0], observation[1], observation[2], observation[3], consult_1800[0][0], consult_1800[0][1], consult_1800[1][0], consult_1800[1][1]])
                # Add data to CSV file
                newRow = []
                newRow.extend(array_observations)
                with open(Path_storeCSV_first, 'a') as writeFile:
                    writer = csv.writer(writeFile)
                    writer.writerow(newRow)
                    writeFile.close()
                x += 1
        else:
            #Store observation when index changes
            pool_slot0 = contracts_pools[index_pool].functions.slot0().call(block_identifier = checkBlock)
            if pool_slot0[2] != last_index:
                #Get current observation
                consult_1800 = contracts_pools[index_pool].functions.observe([1800, 0]).call(block_identifier = checkBlock)
                observation = contracts_pools[index_pool].functions.observations(pool_slot0[2]).call(block_identifier = checkBlock)
                # Add data to CSV file
                newRow = []
                newRow.extend([checkBlock, pool_slot0[2], observation[0], observation[1], observation[2], observation[3], consult_1800[0][0], consult_1800[0][1], consult_1800[1][0], consult_1800[1][1]])
                with open(Path_storeCSV_changes, 'a') as writeFile:
                    writer = csv.writer(writeFile)
                    writer.writerow(newRow)
                    writeFile.close()
                last_index = pool_slot0[2]
        
        print("Loop: {}".format(loop))
        print("Block: {}".format(checkBlock))
        print("Index: {}".format(pool_slot0[2]))
        print("")
        loop -= 1
    
def main():
    currentBlockNumber = block
    handle_event(currentBlockNumber)
        
if __name__ == '__main__':
    main()






