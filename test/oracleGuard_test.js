const BN = require('bn.js')
const OracleGuard = artifacts.require("OracleGuard")
const MockUniswapV3Pool = artifacts.require("MockUniswapV3Pool")
const IStaticOracle = artifacts.require("IStaticOracle")

contract('oracleGuard_test', async accounts => {
	let usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
	let weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
	let base = new BN(10)
	let pow = new BN(18)
	let amount = base.pow(pow)
	let oracleGuard
	let mockPool
	let blockTimestamp = []
	let tickCumulative = [] 
	before(async() => {
		oracleGuard = await OracleGuard.deployed()
		StaticOracle = await IStaticOracle.at("0xB210CE856631EeEB767eFa666EC7C1C57738d438")
		mockPool = await MockUniswapV3Pool.new()
		//Generate mock cumulative and timestamp input
		let currentBlock = await web3.eth.getBlock("latest")
		for (let i = 150; i > 0; i--) { 
			blockTimestamp.push(currentBlock.timestamp - (12 * i)) 
			//calculate tickcumulative with detla of 12sec
			tickCumulative.push(203155 * currentBlock.timestamp - ((203155 - 2 * i) * 12 * i))  
		}	
	})
	describe('Test_uniswap_oracle_guard', function () {
		it("Should return quote mockPool observations within observationIndex", async () => {
			//Add testinput to mockpool	
			await mockPool.changeObservations(blockTimestamp, tickCumulative) 
			//Check inside of index for test
			let observations = await oracleGuard.OBSERVATIONS()
			let slot0 = await mockPool.slot0()
			assert(parseInt(slot0.observationIndex) >= parseInt(observations), "observations outside of index")
			//Check mock OAT calculation
			let SKIP = await oracleGuard.SKIP()
			let OAT = await oracleGuard.getOAT(mockPool.address) 
			let ticksum = 0
			for (let x = slot0.observationIndex; x > slot0.observationIndex - (observations * SKIP); x -= SKIP) { 
				ticksum += (tickCumulative[x] - tickCumulative[x - SKIP]) / (12 * SKIP)
			}
			let OAT_CHECK = ticksum / observations
			assert(OAT[0].toString() == OAT_CHECK.toString(), "False OAT calculation")
		})
		it("Should return quote mockPool observations outside observationIndex", async () => {	
			//Adjust observationindex
			let SKIP = await oracleGuard.SKIP()
			let observations = await oracleGuard.OBSERVATIONS()
			await mockPool.setObservationIndex(SKIP)
			//Check partly outside of index for test
			let slot0 = await mockPool.slot0()	
			assert(parseInt(slot0.observationIndex) <= parseInt(observations), "observations not outside of index")		
			assert(parseInt(slot0.observationIndex) > 0, "observations fully outside of index")	
			//Check mock OAT calculation
			let OAT = await oracleGuard.getOAT(mockPool.address) 
			let ticksum = 0
			//Get ticks after zero point - first two ticks at 3 and 0 are before/at zero point
			let start = parseInt(slot0.observationCardinality) - SKIP
			let end = parseInt(slot0.observationCardinality) - ((observations - 2) * SKIP)
			for (let x = start; x >= end; x -= SKIP) { 
				ticksum += (tickCumulative[x] - tickCumulative[x - SKIP]) / (12 * SKIP)
			}
			let OAT_CHECK = ticksum / (observations - 2)
			assert(OAT[0].toString() == OAT_CHECK.toString(), "False OAT calculation")
		})			
		it("Should fail when observations outside observationCardinality", async () => {
			//Adjust observationCardinality to below checks threshold
			let SKIP = await oracleGuard.SKIP()
			let CHECKS = await oracleGuard.CHECKS()
			await mockPool.setObservationCardinality(CHECKS * SKIP)			
			//Test quote
			basetoken = weth
			quotetoken = usdc
			let quote = await oracleGuard.getQuoteSinglePool(mockPool.address, amount, basetoken, quotetoken)
			let alive = quote[0]
			assert(alive == false, "OracleGuard dit not halt")
		})
		it("Should fail when there are more then MAX_OUTLIERS (single tick delta fail)", async () => {
			//Change array to include attack outliers > MAX_OUTLIERS 
			let SKIP = await oracleGuard.SKIP()
			let MAX_OUTLIERS = await oracleGuard.SKIP()
			let currentBlock = await web3.eth.getBlock("latest")
			let start = tickCumulative.length - 1
			let end = tickCumulative.length - (MAX_OUTLIERS + 1) * SKIP
			for (let x = start; x > end; x--){
				tickCumulative[x] = -100000 * currentBlock.timestamp - ((-100000 - 1000 * x) * 12 * x)
			}
			//Add testinput to mockpool	
			await mockPool.removeObservations()
			await mockPool.changeObservations(blockTimestamp, tickCumulative) 
			//Test quote
			basetoken = weth
			quotetoken = usdc
			let quote = await oracleGuard.getQuoteSinglePool(mockPool.address, amount, basetoken, quotetoken)
			let alive = quote[0]
			assert(alive == false, "OracleGuard dit not halt single tick delta")		
		})
		it("Should fail when total delta ticks > MAX_TOTAL_TICK_DELTA)", async () => {
			//Change array to include attack 
			let max_delta = await oracleGuard.MAX_TOTAL_TICK_DELTA()
			let observations = await oracleGuard.OBSERVATIONS()
			let SKIP = await oracleGuard.SKIP()
			let currentBlock = await web3.eth.getBlock("latest")
			blockTimestamp = []
			tickCumulative = [] 
			for (let i = 150; i > 0; i--) { 
				blockTimestamp.push(currentBlock.timestamp - (12 * i)) 
				//Change diff to > MAX_TOTAL_TICK_DELTA
				tickCumulative.push(203155 * currentBlock.timestamp - ((203155 - (parseInt(max_delta / (observations * SKIP))) * i) * 12 * i))  
			}
			//Add testinput to mockpool	
			await mockPool.removeObservations()
			await mockPool.changeObservations(blockTimestamp, tickCumulative) 
			//Test quote
			basetoken = weth
			quotetoken = usdc
			let quote = await oracleGuard.getQuoteSinglePool(mockPool.address, amount, basetoken, quotetoken)
			let alive = quote[0]
			assert(alive == false, "OracleGuard dit not halt total tick delta")
		})
		it("Check gascost and quote no OracleGuard", async () => {
			let age = 1800
			basetoken = weth
			quotetoken = usdc
			let reqularQuote = await StaticOracle.quoteAllAvailablePoolsWithTimePeriod(amount, basetoken, quotetoken, age)
				console.log("price regular weth-usdc: "+reqularQuote[0].toString())
			let gascost = await StaticOracle.quoteAllAvailablePoolsWithTimePeriod.estimateGas(amount, basetoken, quotetoken, age)
				console.log("gas regular weth-usdc: "+gascost) 
		})
		it("Check gascost and quote OracleGuard", async () => {
			basetoken = weth
			quotetoken = usdc
			pools = await oracleGuard.getAllPoolsForPair(basetoken, quotetoken)
			//Check observations WETH-USDC single pool with latest observations
			observations = await oracleGuard.getQuoteSinglePoolNewest(pools, amount, basetoken, quotetoken)
				console.log("observations protect weth-usdc: "+observations[2].toString())
				console.log("price protect weth-usdc: "+observations[1].toString())
			//gascost check
			gascost = await oracleGuard.getQuoteSinglePoolNewest.estimateGas(pools, amount, basetoken, quotetoken)
				console.log("gas protect weth-usdc: "+gascost) 
		})
	})
})





