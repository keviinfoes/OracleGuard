// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.6.0 <0.8.0;
pragma abicoder v2;

contract MockUniswapV3Pool {
    
    struct Observation {
        uint32 blockTimestamp;
        int56 tickCumulative;
        uint160 secondsPerLiquidityCumulativeX128;
        bool initialized;
    }

    struct Slot0 {
        uint160 sqrtPriceX96;
        int24 tick;
        uint16 observationIndex;
        uint16 observationCardinality;
        uint16 observationCardinalityNext;
        uint8 feeProtocol;
        bool unlocked;
    }

    Slot0 public slot0;
    Observation[] public observations;

    function changeObservations(uint32[] memory blockTimestamp, int56[] memory tickCumulative ) public {
        slot0.observationCardinality += uint16(blockTimestamp.length);
        slot0.observationIndex += slot0.observationCardinality - 1;
        for (uint256 i; i < blockTimestamp.length; i++) { 
            observations.push(Observation(blockTimestamp[i], tickCumulative[i], 0, true));
        }
    }

    function setObservationIndex(uint16 _observationIndex) public {
         slot0.observationIndex = _observationIndex;
    }

    function setObservationCardinality(uint16 _observationCardinality) public {
         slot0.observationCardinality = _observationCardinality;
    }

    function removeObservations() public {
        slot0.observationCardinality = 0;
        slot0.observationIndex = 0;
        delete observations;
    }
}
