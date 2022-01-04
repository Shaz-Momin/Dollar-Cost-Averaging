const { performance } = require('perf_hooks');

var analyze_dca = require("analyze-dca");

var startTime = performance.now() // for measuing how long it took to execute the function

let result = analyze_dca({
    amountInvested: 3000,
    stockSymbol: 'TSLA',
    period: 'w',
    numPeriods: 4
});

var endTime = performance.now()

result.then((data) => {
    console.log(data);
}).catch((error) => {
    console.log(error)
})

console.log(`Call to analyze_dca took ${((endTime - startTime)/1000).toFixed(3)} seconds`)

