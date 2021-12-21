var analyze_dca = require("analyze-dca")

let result = analyze_dca({
    stock_symbol: 'TSLA',
    period: 'd',
    num_periods: 5
});

result.then((data) => {
    console.log(data);
})

/* var date = new Date();
console.log(date.toISOString().substring(0,10)); */