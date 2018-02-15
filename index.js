var EtherMine = require('./ethermine.js');
var pool = new EtherMine('549f7d317A612c3279052CdDE13B732248d57C89');

pool.getAverageEarn((earn)=> {
	console.log('Earn per minute: ' + earn.perMinute 	+ '\t ETH');
	console.log('Earn per hour: ' 	+ earn.perHour 		+ '\t ETH');
	console.log('Earn per day: ' 	+ earn.perDay 		+ '\t ETH');
	console.log('\n');
});

pool.getAverageEarnPerWorker((earns)=> {
	
	var earnsTogether = 0;
	
	earns.forEach((earnPerWorker)=> {
		
		console.log('Worker: ' + earnPerWorker.worker.worker + ' Earn: ' + earnPerWorker.averageEarn.perDay);
		earnsTogether += earnPerWorker.averageEarn.perDay;
	});
	
	console.log('All per day: ' + earnsTogether);
});