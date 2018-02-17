var EtherMine 	= require('./ethermine.js');
var express 	= require('express');
var app 		= express();

//Create new ethermine wrapper 
var pool = new EtherMine('549f7d317A612c3279052CdDE13B732248d57C89');
var	dataToSend = {};

//Get payouts from miner
pool.getPayouts((payouts)=> {
	dataToSend.minerPayouts = payouts;
});

//Get average earn for entire miner 
pool.getAverageEarn((earn)=> {
	dataToSend.minerEarn = earn;
});

//Get average earns from every worker
pool.getAverageEarnPerWorker((earns)=> {
	dataToSend.workersEarns = earns;
});

app.set('json spaces', 30);
app.get('/', (req, res)=> {
	res.setHeader('Content-Type', 'application/json');
	res.json(dataToSend);
})

var server = app.listen(8080, ()=> {
	console.log("[Klondike API] listening 8080");
});