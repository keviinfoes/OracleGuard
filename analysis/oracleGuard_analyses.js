const BN = require('bn.js')
const fs = require('fs')
const { parse } = require("csv-parse");
const { stringify } = require('csv-stringify')

const OracleGuard = artifacts.require("OracleGuard")
const MockRegularOracle = artifacts.require("MockUniswapV3Oracle")
const MockUniswapV3Pool = artifacts.require("MockUniswapV3Pool")

const readFileStart = async (input) => new Promise((resolve, reject) => {
	let index = []
	fs.createReadStream(input)
        .pipe(parse({ delimiter: ',', from_line: 2, relax_column_count: true}))
        .on('data', function (row) {
            index.push(row)
        })
        .on('end', function () {
            resolve(index);
        })
        .on('error', function (error) {
            reject(error)
        });
});

const readFileChanges = async (input) => new Promise((resolve, reject) => {
	let index = []
	fs.createReadStream(input)
        .pipe(parse({ delimiter: ',', from_line: 2, relax_column_count: true}))
        .on('data', function (row) {
            index.push(row)
        })
        .on('end', function () {
            resolve(index);
        })
        .on('error', function (error) {
            reject(error)
        });
});

contract('oracleGuard_analyse', async accounts => {
	let input_start = 'path to start csv'
	let input_change = 'path to change csv'
	let usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
	let weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
	let shiba = "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE"
	let base = new BN(10)
	let pow = new BN(18)
	let amount = base.pow(pow)
	//Contract used in analyses
	let oracleGuard
	let mockRegularOracle
	let mockPool
	//Observation history data 
	let data
	let changes 
	let current_index
	let timestamp = []
	let tick_cumulative = []
	let liquidity_cumulative = []
	let mock_timestamp = []
	let mock_tick_cumulative = []
	let mock_liquidity_cumulative = []
	let changes_index = []
	let changes_timestamp = []
	let changes_tick_cumulative = []
	let changes_liquidity_cumulative = []
	//Consult data for compare oracle price
	let consult_1800_cumulative = []
	let consult_1800_weight = []
	let changes_consult_1800_cumulative = []
	let changes_consult_1800_weight = []
	before(async() => {
		oracleGuard = await OracleGuard.deployed()
		mockRegularOracle = await MockRegularOracle.new()
		mockPool = await MockUniswapV3Pool.new()
		// Get initial data for array
		data = await readFileStart(input_start)
		current_index = data[0][2]
		for (let i = 2; i < data.length; i++) { 
			timestamp.push(data[i][1])
			tick_cumulative.push(data[i][2])
			liquidity_cumulative.push(data[i][3])
			consult_1800_cumulative.push([data[i][5], data[i][6]])
			consult_1800_weight.push([data[i][7], data[i][8]])
		}
		// Store initial array for mock pool
		for (let i = 0; i < timestamp.length; i++) { 
			mock_timestamp.push(timestamp[i])
			mock_tick_cumulative.push(tick_cumulative[i])
			mock_liquidity_cumulative.push(liquidity_cumulative[i])
			if(i % 200 == 0 || i == timestamp.length - 1) {
				// Update mock contract with initial array and reset array
				await mockPool.changeObservations(mock_timestamp, mock_tick_cumulative, mock_liquidity_cumulative) 
				mock_timestamp = []
				mock_tick_cumulative = []
				mock_liquidity_cumulative = []
			}
		}
		//set current consult
		await mockPool.setConsult(consult_1800_cumulative[current_index], consult_1800_weight[current_index]) 
		//Set index and cardinality
		await mockPool.setObservationIndex(current_index) 
		await mockPool.setObservationCardinality(timestamp.length) 
		// Get change data for array
		changes = await readFileChanges(input_change)
		for (let i = 0; i < changes.length; i++) { 
			changes_index.push(changes[i][1])
			changes_timestamp.push(changes[i][2])
			changes_tick_cumulative.push(changes[i][3])
			changes_liquidity_cumulative.push(changes[i][4])
			changes_consult_1800_cumulative.push([changes[i][6], changes[i][7]])
			changes_consult_1800_weight.push([changes[i][8], changes[i][9]])
		}
	})
	describe('Analyse_oracle_guard', function () {

/*	 Single Pool analyses	
		it("Use historic observations in single mockPool", async () => {			
			let data = []
			let basetoken = shiba
			let quotetoken = weth
			let OAT = await oracleGuard.getOAT(mockPool.address)
			let quote = await oracleGuard.getQuoteSinglePool(mockPool.address, amount, basetoken, quotetoken)
			let regular_quote = await mockRegularOracle._quote(amount, basetoken, quotetoken, [mockPool.address], 900)
			let delta = regular_quote.sub(quote[1])
			data.push([timestamp[current_index], OAT[0].toString(), quote[0].toString(), quote[1].toString(), quote[2].toString(), regular_quote.toString(), delta.toString()])				
			//Update tickcumulate for all changes
			let loop = changes.length 
			for (let i = 0; i < loop; i++) { 
				let index = changes_index[i]
				await mockPool.setObservation(index, changes_timestamp[i], changes_tick_cumulative[i], changes_liquidity_cumulative[i]) 
				await mockPool.setObservationIndex(index) 
				await mockPool.setConsult(changes_consult_1800_cumulative[i], changes_consult_1800_weight[i]) 
				OAT = await oracleGuard.getOAT(mockPool.address)
				quote = await oracleGuard.getQuoteSinglePool(mockPool.address, amount, basetoken, quotetoken)
				regular_quote = await mockRegularOracle._quote(amount, basetoken, quotetoken, [mockPool.address], 900)
				delta = regular_quote.sub(quote[1])
				data.push([changes_timestamp[i].toString(), OAT[0].toString(), quote[0].toString(), quote[1].toString(), quote[2].toString(), regular_quote.toString(), delta.toString()])
				//console.log(changes_timestamp[i].toString()) 
				//console.log(quote[1].toString())
				console.log(i+" from "+loop)
				console.log("")
				if(i % 100 == 0 || i == loop - 1) {
					//Write output to csv file
					let columns = {Timestamp: 'Timestamp', OAT: 'OAT', Success: 'Success', Quote: 'Quote', Observations: 'Observations', Regular_Quote: 'Regular_Quote', Difference: 'Difference'};
					stringify(data, { header: true, columns: columns }, (err, output) => {
						if (err) throw err;
						fs.writeFile('./test/output/OracleGuardAnalyses.csv', output, (err) => {
						if (err) throw err
						console.log('csv saved.')
						})
					})			
				}
			}
		})
*/

/*	Multi Pool analyses	
		it("Use historic observations in multi mockPool", async () => {
			let zero_start = "path to start csv pool 0"
			let zero_change = "path to change csv pool 0"
			let one_start = "path to start csv pool 1"
			let one_change = "path to change csv pool 1"
			let two_start = "path to start csv pool 2"
			let two_change = "path to change csv pool 2"
			//deploy mock pools
			let mockPool_0 = await MockUniswapV3Pool.new()
			let mockPool_1 = await MockUniswapV3Pool.new()
			let mockPool_2 = await MockUniswapV3Pool.new()
			//get initial data for array
			let data_0 = await readFileStart(zero_start)
			let data_1 = await readFileStart(one_start)
			let data_2 = await readFileStart(two_start)
						
			//pool 0
			let current_index_0 = data_0[0][2]
			timestamp = []
			tick_cumulative = []
			liquidity_cumulative = []
			consult_1800_cumulative = []
			consult_1800_weight = []
			mock_timestamp = []
			mock_tick_cumulative = []
			mock_liquidity_cumulative = []
			for (let i = 2; i < data_0.length; i++) { 
				timestamp.push(data_0[i][1])
				tick_cumulative.push(data_0[i][2])
				liquidity_cumulative.push(data_0[i][3])
				consult_1800_cumulative.push([data_0[i][5], data_0[i][6]])
				consult_1800_weight.push([data_0[i][7], data_0[i][8]])
			}
			// Store initial array for mock pool
			for (let i = 0; i < timestamp.length; i++) { 
				mock_timestamp.push(timestamp[i])
				mock_tick_cumulative.push(tick_cumulative[i])
				mock_liquidity_cumulative.push(liquidity_cumulative[i])
				if(i % 200 == 0 || i == timestamp.length - 1) {
					// Update mock contract with initial array and reset array
					await mockPool_0.changeObservations(mock_timestamp, mock_tick_cumulative, mock_liquidity_cumulative) 
					mock_timestamp = []
					mock_tick_cumulative = []
					mock_liquidity_cumulative = []
				}
			}
			//set current consult
			await mockPool_0.setConsult(consult_1800_cumulative[current_index_0], consult_1800_weight[current_index_0]) 
			//Set index and cardinality
			await mockPool_0.setObservationIndex(current_index_0) 
			await mockPool_0.setObservationCardinality(timestamp.length) 
			//get changes
			let zero_changes_index = []
			let zero_changes_timestamp = []
			let zero_changes_tick_cumulative = []
			let zero_changes_liquidity_cumulative = []
			let zero_changes_consult_1800_cumulative = []
			let zero_changes_consult_1800_weight = []
			changes_0 = await readFileChanges(zero_change)
			for (let i = 0; i < changes_0.length; i++) { 
				zero_changes_index.push(changes_0[i][1])
				zero_changes_timestamp.push(changes_0[i][2])
				zero_changes_tick_cumulative.push(changes_0[i][3])
				zero_changes_liquidity_cumulative.push(changes_0[i][4])
				zero_changes_consult_1800_cumulative.push([changes_0[i][6], changes_0[i][7]])
				zero_changes_consult_1800_weight.push([changes_0[i][8], changes_0[i][9]])
			}

			//pool 1
			let current_index_1 = data_1[0][2]
			timestamp = []
			tick_cumulative = []
			liquidity_cumulative = []
			consult_1800_cumulative = []
			consult_1800_weight = []
			mock_timestamp = []
			mock_tick_cumulative = []
			mock_liquidity_cumulative = []
			for (let i = 2; i < data_1.length; i++) { 
				timestamp.push(data_1[i][1])
				tick_cumulative.push(data_1[i][2])
				liquidity_cumulative.push(data_1[i][3])
				consult_1800_cumulative.push([data_1[i][5], data_1[i][6]])
				consult_1800_weight.push([data_1[i][7], data_1[i][8]])
			}
			// Store initial array for mock pool
			for (let i = 0; i < timestamp.length; i++) { 
				mock_timestamp.push(timestamp[i])
				mock_tick_cumulative.push(tick_cumulative[i])
				mock_liquidity_cumulative.push(liquidity_cumulative[i])
				if(i % 200 == 0 || i == timestamp.length - 1) {
					// Update mock contract with initial array and reset array
					await mockPool_1.changeObservations(mock_timestamp, mock_tick_cumulative, mock_liquidity_cumulative) 
					mock_timestamp = []
					mock_tick_cumulative = []
					mock_liquidity_cumulative = []
				}
			}
			//set current consult
			await mockPool_1.setConsult(consult_1800_cumulative[current_index_1], consult_1800_weight[current_index_1]) 
			//Set index and cardinality
			await mockPool_1.setObservationIndex(current_index_1) 
			await mockPool_1.setObservationCardinality(timestamp.length) 
			//get changes
			let one_changes_index = []
			let one_changes_timestamp = []
			let one_changes_tick_cumulative = []
			let one_changes_liquidity_cumulative = []
			let one_changes_consult_1800_cumulative = []
			let one_changes_consult_1800_weight = []
			changes_1 = await readFileChanges(one_change)
			for (let i = 0; i < changes_1.length; i++) { 
				one_changes_index.push(changes_1[i][1])
				one_changes_timestamp.push(changes_1[i][2])
				one_changes_tick_cumulative.push(changes_1[i][3])
				one_changes_liquidity_cumulative.push(changes_1[i][4])
				one_changes_consult_1800_cumulative.push([changes_1[i][6], changes_1[i][7]])
				one_changes_consult_1800_weight.push([changes_1[i][8], changes_1[i][9]])
			}

			//pool 2
			let current_index_2 = data_2[0][2]
			timestamp = []
			tick_cumulative = []
			liquidity_cumulative = []
			consult_1800_cumulative = []
			consult_1800_weight = []
			mock_timestamp = []
			mock_tick_cumulative = []
			mock_liquidity_cumulative = []
			for (let i = 2; i < data_2.length; i++) { 
				timestamp.push(data_2[i][1])
				tick_cumulative.push(data_2[i][2])
				liquidity_cumulative.push(data_2[i][3])
				consult_1800_cumulative.push([data_2[i][5], data_2[i][6]])
				consult_1800_weight.push([data_1[i][7], data_2[i][8]])
			}
			// Store initial array for mock pool
			for (let i = 0; i < timestamp.length; i++) { 
				mock_timestamp.push(timestamp[i])
				mock_tick_cumulative.push(tick_cumulative[i])
				mock_liquidity_cumulative.push(liquidity_cumulative[i])
				if(i % 200 == 0 || i == timestamp.length - 1) {
					// Update mock contract with initial array and reset array
					await mockPool_2.changeObservations(mock_timestamp, mock_tick_cumulative, mock_liquidity_cumulative) 
					mock_timestamp = []
					mock_tick_cumulative = []
					mock_liquidity_cumulative = []
				}
			}
			//set current consult
			await mockPool_2.setConsult(consult_1800_cumulative[current_index_2], consult_1800_weight[current_index_2]) 
			//Set index and cardinality
			await mockPool_2.setObservationIndex(current_index_2) 
			await mockPool_2.setObservationCardinality(timestamp.length) 
			//get changes
			let two_changes_index = []
			let two_changes_timestamp = []
			let two_changes_tick_cumulative = []
			let two_changes_liquidity_cumulative = []
			let two_changes_consult_1800_cumulative = []
			let two_changes_consult_1800_weight = []
			changes_2 = await readFileChanges(two_change)
			for (let i = 0; i < changes_2.length; i++) { 
				two_changes_index.push(changes_2[i][1])
				two_changes_timestamp.push(changes_2[i][2])
				two_changes_tick_cumulative.push(changes_2[i][3])
				two_changes_liquidity_cumulative.push(changes_2[i][4])
				two_changes_consult_1800_cumulative.push([changes_2[i][6], changes_2[i][7]])
				two_changes_consult_1800_weight.push([changes_2[i][8], changes_2[i][9]])
			}
			//get quote 
			let data = []
			let basetoken = weth
			let quotetoken = usdc
			let quote = await oracleGuard.getQuoteSinglePoolNewest([mockPool_0.address, mockPool_1.address, mockPool_2.address], amount, basetoken, quotetoken)
			let regular_quote = await mockRegularOracle._quote(amount, basetoken, quotetoken, [mockPool_0.address, mockPool_1.address, mockPool_2.address], 1800)
			let delta = regular_quote.sub(quote[1])
			data.push([data_0[current_index_0][1], quote[0].toString(), quote[2].toString(), quote[1].toString(), regular_quote.toString(), delta.toString()])				
			//update mockpools - changes pool 0 is the longest - most updates
			let index_one
			let index_two
			let loop = changes_0.length
			for (let i = 0; i < loop; i++) { 
				await mockPool_0.setObservation(zero_changes_index[i], zero_changes_timestamp[i], zero_changes_tick_cumulative[i], zero_changes_liquidity_cumulative[i]) 
				await mockPool_0.setObservationIndex(zero_changes_index[i]) 
				await mockPool_0.setConsult(zero_changes_consult_1800_cumulative[i], zero_changes_consult_1800_weight[i]) 
				if(one_changes_timestamp[index_one] <= zero_changes_timestamp[i]){
					await mockPool_1.setObservation(one_changes_index[index_one], one_changes_timestamp[index_one], one_changes_tick_cumulative[index_one], one_changes_liquidity_cumulative[index_one]) 
					await mockPool_1.setObservationIndex(one_changes_index[index_one]) 
					await mockPool_1.setConsult(one_changes_consult_1800_cumulative[index_one], one_changes_consult_1800_weight[index_one]) 
					index_one += 1
				}
				if(two_changes_timestamp[index_two] <= zero_changes_timestamp[i]){
					await mockPool_2.setObservation(two_changes_index[index_two], two_changes_timestamp[index_two], two_changes_tick_cumulative[index_two], two_changes_liquidity_cumulative[index_two]) 
					await mockPool_2.setObservationIndex(two_changes_index[index_two]) 
					await mockPool_2.setConsult(two_changes_consult_1800_cumulative[index_two], two_changes_consult_1800_weight[index_two]) 
					index_two += 1
				}
				let quote = await oracleGuard.getQuoteSinglePoolNewest([mockPool_0.address, mockPool_1.address, mockPool_2.address], amount, basetoken, quotetoken)
				let regular_quote = await mockRegularOracle._quote(amount, basetoken, quotetoken, [mockPool_0.address, mockPool_1.address, mockPool_2.address], 1800)
				let delta = regular_quote.sub(quote[1])
				data.push([zero_changes_timestamp[i], quote[0].toString(), quote[2].toString(), quote[1].toString(), regular_quote.toString(), delta.toString()])		
				console.log(i+" from "+loop)
				console.log("")
				if(i % 100 == 0 || i == loop - 1) {
					//Write output to csv file
					let columns = {Timestamp: 'Timestamp', Success: 'Success', Observations: 'Observations', Quote: 'Quote', Regular_Quote: 'Regular_Quote', Difference: 'Difference'};
					stringify(data, { header: true, columns: columns }, (err, output) => {
						if (err) throw err;
						fs.writeFile('./test/output/OracleGuardAnalyses_Multipool.csv', output, (err) => {
						if (err) throw err
						console.log('csv saved.')
						})
					})			
				}
			}
		})	
*/	

	})	
})


