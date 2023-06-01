// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.6.0 <0.8.0;

import "./libraries/OracleLibrary.sol";
import "./interfaces/IUniswapV3Factory.sol";
import "./interfaces/IUniswapV3Pool.sol";

/// @title OracleGuard - oracle extension favoring safety over liveness
/// @notice Guard removes outliers and returns the Observed Average Price (OAT)
contract OracleGuard {
    IUniswapV3Factory public constant UNISWAP_V3_FACTORY = IUniswapV3Factory(0x1F98431c8aD98523631AE4a59f267346ea31F984);
    
    uint8 public immutable OBSERVATIONS; 
    uint8 public immutable MAX_OUTLIERS;
    uint8 public immutable SKIP;
    // Check OBSERVATIONS + 1 tickCumulatives to calculate OBSERVATION number of ticks
    uint8 public immutable CHECKS; 
    // Cap on the total change of ticks (cap on price change)
    int56 public immutable MAX_TICK_DELTA; 

    struct TickData {
        int56 tick_latest;
        int56 tick_diff_sum;
        int256 ticksum; 
        uint32 observed;
    }

    constructor(uint8 observations, uint8 max_outliers, uint8 skip, int56 max_delta) {
        OBSERVATIONS = observations;
        MAX_OUTLIERS = max_outliers;
        SKIP = skip;
        MAX_TICK_DELTA = max_delta;
        CHECKS = observations + 1;
    }

    function getQuotePoolNewest(address[] memory pools, uint128 baseAmount, address baseToken, address quoteToken) public view returns (uint256, uint32, string memory) {
        uint32 newest;
        address poolNewest;
        for (uint256 i; i < pools.length; i++){      
            // Check oldest observed tickCumulative per pool
            (, , uint16 observationIndex, uint16 observationCardinality, , , ) = IUniswapV3Pool(pools[i]).slot0();
            (uint32 timestamp, ) = getObservations(pools[i], CHECKS * SKIP, observationIndex, observationCardinality);
            if (timestamp > newest){
                newest = timestamp;
                poolNewest = pools[i];
            }
        }
        require(poolNewest != address(0), "No pool available");
        (uint256 quote, uint32 observed, string memory _error) = getQuoteSinglePool(poolNewest, baseAmount, baseToken, quoteToken);
        return(quote, observed, _error);
    }

    function getQuoteSinglePool(address pool, uint128 baseAmount, address baseToken, address quoteToken) public view returns (uint256, uint32, string memory) {
        (int56 OAT, uint32 observed, string memory _error) = getOAT(pool);
        // Get the quote based on OAT
        require(OAT == int24(OAT), "OAT int24 overflow");
        uint256 quote = OracleLibrary.getQuoteAtTick(int24(OAT), baseAmount, baseToken, quoteToken);
        return(quote, observed, _error);
    }   

    function getOAT(address pool) public view returns (int56, uint32, string memory){        
        TickData[] memory ticksArrays = new TickData[](MAX_OUTLIERS);
        (, , uint16 observationIndex, uint16 observationCardinality, , , ) = IUniswapV3Pool(pool).slot0();
        // Error -> cardinality to low
        if(observationCardinality <= CHECKS * SKIP) {return (0, 0, "out of range observationCardinality");}
        int56 previousCumulative;
        uint32 previousTimestamp;
        for (uint256 i = CHECKS; i > 0; i--) {
            (uint32 timestamp, int56 tickCumulative) = getObservations(pool, (i - 1) * SKIP, observationIndex, observationCardinality);
            // Loop to check for outliers - Skip oldest observation because of unknown first cumulative
            for(uint256 x; i < CHECKS && x < MAX_OUTLIERS; x++) {
                int56 tick = isub56(tickCumulative, previousCumulative) / (timestamp - previousTimestamp);
                int56 delta = isub56(tick, ticksArrays[x].tick_latest);
                // Check if the current tick is in range of any stored ticks
                if(ticksArrays[x].observed > 0 && delta <= MAX_TICK_DELTA && delta >= -MAX_TICK_DELTA){
                    // When current storage used and tick within range add to data
                    ticksArrays[x].tick_latest = tick;
                    ticksArrays[x].tick_diff_sum = iadd56(ticksArrays[x].tick_diff_sum, delta);
                    ticksArrays[x].ticksum += tick;
                    ticksArrays[x].observed += 1;
                    break;
                } else if (ticksArrays[x].observed > 0) {
                    // Error -> no storage available
                    if(x == MAX_OUTLIERS - 1) {return (0, 0, "out of range MAX_OUTLIERS");}
                    //When current storage used and storage available continue
                    continue;
                } else if (ticksArrays[x].observed == 0) {
                    // When current storage unused add new datapoint
                    ticksArrays[x].tick_latest = tick;
                    ticksArrays[x].ticksum = tick;
                    ticksArrays[x].observed += 1;
                    break;
                } 
            }  
            previousCumulative = tickCumulative;
            previousTimestamp = timestamp;
        }
        // Loop to check most observed
        uint32 observed;
        int256 ticksum;
        int256 tickdeltasum;
        for(uint256 x; x < MAX_OUTLIERS; x++) {
            if(ticksArrays[x].observed > observed){
                observed = ticksArrays[x].observed;
                ticksum = ticksArrays[x].ticksum;
                tickdeltasum = ticksArrays[x].tick_diff_sum;
            }
        }
        // Error -> not enough observations
        if(observed < OBSERVATIONS - MAX_OUTLIERS) {return (0, 0, "out of range MIN_OBSERVATIONS");}
        // Error -> outside max tick delta
        if(tickdeltasum >= MAX_TICK_DELTA || tickdeltasum <= -MAX_TICK_DELTA) {return (0, 0, "out of range MAX_TICK_DELTA");}
        // Calculate the mean OAT over all the observations
        int56 totalOAT = observed > 1 ? int56(ticksum / observed): 0;
        return (totalOAT, observed, "success");
    }

    function getObservations(address pool, uint256 index, uint16 observationIndex, uint16 observationCardinality) public view returns (uint32, int56){ 
        uint32 blockTimestamp; 
        int56 tickCumulative;
        if (observationIndex >= index) {
            // No pass of zero point index is withing observationIndex
            (blockTimestamp, tickCumulative, , ) = IUniswapV3Pool(pool).observations(observationIndex - index);
        } else if (observationCardinality > index) {
            // Pass of zero point get the latest value from observationCardinality
            bool initialized;
            (blockTimestamp, tickCumulative, , initialized) = IUniswapV3Pool(pool).observations(observationCardinality - (index - observationIndex));
            require(initialized == true, "Uninitialized observation");
        }
        return (blockTimestamp, tickCumulative);
    }

    function increaseCardinality(address _tokenA, address _tokenB, uint24[] memory _feeTiers) public {    
        address[] memory pools = getAllPoolsForPair(_tokenA, _tokenB, _feeTiers);
        for (uint256 i; i < pools.length; i++) {
            IUniswapV3Pool(pools[i]).increaseObservationCardinalityNext(CHECKS * SKIP + 1);
        }
    }

    function getAllPoolsForPair(address _tokenA, address _tokenB, uint24[] memory _feeTiers) public view returns (address[] memory _pools) {
        _pools = new address[](_feeTiers.length);
        uint256 _validPools;
        for (uint256 i; i < _feeTiers.length; i++) {
            address _pool = UNISWAP_V3_FACTORY.getPool(_tokenA, _tokenB, _feeTiers[i]);
            if (_pool != address(0)) {
                _pools[_validPools++] = _pool;
            }
        }
        _resizeArray(_pools, _validPools);
    }
    
    function _resizeArray(address[] memory _array, uint256 _amountOfValidElements) internal pure {
        // If all elements are valid, then nothing to do here
        if (_array.length == _amountOfValidElements) return;
        // If not, then resize the array
        assembly {
            mstore(_array, _amountOfValidElements)
        }
    }

    // Safemath for int calculations
    function iadd56(int56 a, int56 b) internal pure returns (int56) {
        int56 c = a + b;
        require((b >= 0 && c >= a) || (b < 0 && c < a));
        return c;
    }

    function isub56(int56 a, int56 b) internal pure returns (int56) {
        int56 c = a - b;
        require((b >= 0 && c <= a) || (b < 0 && c > a));
        return c;
    }
}

