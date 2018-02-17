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
		if(err != null) return console.log('[*] request failed: ' + err);
		callback(body);
	});
}

module.exports = class EtherMine {
	
	constructor(minerKey) {
		
		const _this 		= this;
		this.minerKey 		= minerKey;
		this.urlParseList 	= [
			{':miner': this.minerKey},
		];
		
		fetchAsnych(COIN_MARKET_API_URL, (data)=> {
			_this.coinMarketCap = JSON.parse(data)[0];
		});
	}
	
	parseUrl(toParse) {
		
		for(var i in this.urlParseList) {
			var object 	= this.urlParseList[i];
			const key 	= Object.keys(object)[0];	
			
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
	* Return object with precalculated earn per minute, hour, day
	*/
	getAverageEarnsFromCoinsPerMin(coins) {
		return {
			ETH: {
				perMinute: 	coins,
				perHour: 	coins * 60,
				perDay: 	coins * 60 * 24
			}, 
			EUR: {
				perMinute: this.toEUR(coins),
				perHour:   this.toEUR(coins * 60),
				perDay:    this.toEUR(coins * 60 * 24)
			}, 
			USD: {
				perMinute: this.toUSD(coins),
				perHour:   this.toUSD(coins * 60),
				perDay:    this.toUSD(coins * 60 * 24)
			}
		}
	}
	
	/* 
	* Returns array of worker and his average earn per minute, hour, day 
	*/
	getAverageEarnPerWorker(callback) {
		
		const _this = this;
		_this.getNetworkStats((stats) => {
			
			_this.getAverageEarn((earn)=> {
			
				_this.getWorkers((workers)=> {
						
					var returnEarns 	= [];
					var notFixed 		= [];
					var coinsTogether 	= 0;
					
					workers.forEach((worker)=> {
							
						const workerEarn = _this.getWorkerEarn(worker, stats);
						coinsTogether += workerEarn;
						notFixed.push(workerEarn);						
					});
						
					const error 			=  earn.ETH.perMinute / coinsTogether;
					var finalReturnObject 	= [];
					
					for(var i in workers) {
						const fixedCoinsEarnPerMin = notFixed[i] * error;
						const currentWorker 		 = workers[i];

						finalReturnObject.push({
							averageEarn: _this.getAverageEarnsFromCoinsPerMin(fixedCoinsEarnPerMin),
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
	
		const _this = this;
		_this.getCurrentStats((stats)=> {
			
			if(callback)
				callback(_this.getAverageEarnsFromCoinsPerMin(stats.coinsPerMin));
		});
	}
	
	/* 
	* Functions for converting currencies
	*/
	toUSD(toConvert) {
		return this.coinMarketCap.price_usd * toConvert;
	}
	
	toEUR(toConvert) {
		return this.coinMarketCap.price_eur * toConvert;
	}
};