var request = require('request');

/* 
* Constants
*/
const ETHER_MINE_API_URL 	= 'https://api.ethermine.org/';
const COIN_MARKET_API_URL 	= 'https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=EUR';

/* 
* Simple method for making requests
*/
function fetchAsnych(url, callback) {
	request.get(url, (err, request, body)=> {
		callback(body);
	});
}

module.exports = class EtherMine {
	
	constructor(minerKey) {
		
		var _this 			= this;
		this.minerKey 		= minerKey;
		this.urlParseList 	= [
			{':miner': this.minerKey},
		];
		
		fetchAsnych(COIN_MARKET_API_URL, (data)=> {
			_this.coinMarketCap = JSON.parse(data);
		});
	}
	
	parseUrl(toParse) {
		
		/*NODE(DavoSK): Meybe regex later*/
		for(var i in this.urlParseList) {
			var object 	= this.urlParseList[i];
			var key 	= Object.keys(object)[0];	
			
			if(toParse.indexOf(key) > -1) {
				return ETHER_MINE_API_URL + toParse.replace(key, object[key]);
			}
		}
		return ETHER_MINE_API_URL + toParse;
	}
	
	//-------------------------------------------------------------------
	// SIMPLE GETTERS FROM REST API 
	//-------------------------------------------------------------------
	getPayouts(callback) {
		fetchAsnych(this.parseUrl('miner/:miner/payouts'), (payouts)=> {
			callback(JSON.parse(payouts).data);
		});
	}
	
	getHistory(callback) {
		fetchAsnych(this.parseUrl('miner/:miner/history'), (history)=> {
			callback(JSON.parse(history).data);
		});
	}
	
	getBlocksHistory(callback) {
		fetchAsnych(this.parseUrl('blocks/history'), (history)=> {
			callback(JSON.parse(history).data);
		});
	}
	
	getCurrentStats(callback) {
		fetchAsnych(this.parseUrl('miner/:miner/currentStats'), (stats)=> {
			callback(JSON.parse(stats).data);
		});			
	}
	
	getWorkers(callback) {
		fetchAsnych(this.parseUrl('miner/:miner/workers'), (workers)=> {
			callback(JSON.parse(workers).data);
		});	
	}
	
	getNetworkStats(callback) {
		fetchAsnych(this.parseUrl('networkStats'), (stats)=> {
			callback(JSON.parse(stats).data);
		});
	}
	//-------------------------------------------------------------------
	
	/*
	*	Function wich computes earn in ethcoins from 
	*	hahsrate blocktime and other stuff from status of the network 
	* 	TODO(DavoSK): Make it more accurate 
	*/
	getWorkerEarn(worker, stats) {
	
		const blockReward 		= 3;
		const diffTH 			= stats.difficulty / 1e12;
		
		return (worker.averageHashrate / ((diffTH / stats.blockTime) * 1000 * 1e9)) * ((60 / stats.blockTime ) * blockReward);
	}
	
	/* 
	* Returns array of worker and his average earn per minute, hour, day 
	*/
	getAverageEarnPerWorker(callback) {
		
		var _this = this;
		_this.getNetworkStats((stats) => {
			
			_this.getAverageEarn((earn)=> {
			
				_this.getWorkers((workers)=> {
						
					var returnEarns 	= [];
					var notFixed 		= [];
					var coinsTogether 	= 0;
					
					//Gets earn for each worker
					workers.forEach((worker)=> {
							
						var workerEarn = _this.getWorkerEarn(worker, stats);
						coinsTogether += workerEarn;
						notFixed.push(workerEarn);						
					});
						
					var error 				=  earn.perMinute / coinsTogether;
					var finalReturnObject 	= [];
					
					for(var i in workers) {
						var fixedCoinsEarnPerMin = notFixed[i] * error;
						var currentWorker 		 = workers[i];

						finalReturnObject.push({
							averageEarn: {
								perMinute: 	fixedCoinsEarnPerMin,
								perHour: 	fixedCoinsEarnPerMin * 60,
								perDay: 	fixedCoinsEarnPerMin * 60 * 24
							},
							worker: currentWorker
						});
					}
					
					if(callback)
						callback(finalReturnObject);
				});
			});
		});
	}
	
	/*
	* Function for returning avarage earn of entire miner
	*/
	getAverageEarn(callback) {
	
		this.getCurrentStats((stats)=> {
			
			var data = {
				perMinute: 	stats.coinsPerMin,
				perHour: 	stats.coinsPerMin * 60,
				perDay: 	stats.coinsPerMin * 60 * 24
			};
			
			if(callback)
				callback(data);
		});
	}
	
	/* 
	* Functions for converting currencies
	*/
	toUSD(toConvert) {
		return this.coinMarketCap[0].price_usd * toConvert;
	}
	
	toEUR(toConvert) {
		return this.coinMarketCap[0].price_eur * toConvert;
	}
};