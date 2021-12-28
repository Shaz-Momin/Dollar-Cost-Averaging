var analyze_dca = require("analyze-dca");

let result = analyze_dca({
    amountInvested: 4000,
    stockSymbol: 'AAPL',
    period: 'w',
    numPeriods: 4
});

result.then((data) => {
    console.log(data);
})



/* var date = new Date()
date = new Date(date.setDate(date.getDate()))
console.log(date + " " + new Date(date.setDate(date.getDate() - 8)).toISOString() 
    + " " + new Date(date.setDate(date.getDate() - 7)).toISOString() + " " +
    new Date(date.setDate(date.getDate() - 7)).toISOString()); */

/* var date = new Date();
console.log(date.toISOString().substring(0,10)); */