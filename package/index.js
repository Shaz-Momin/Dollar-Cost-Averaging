// Import necessary dependencies -> stock APIs
var yahooFinance = require('yahoo-finance');
// Core function that calculates gains/loses from stocks using DCA strategy
function analyze_dca(req) {
    var curr = new Date();
    var startDate = getDatePoints(req.period, req.num_periods, curr);
    var endpoints = {
        start: startDate.toISOString().substring(0, 10),
        end: curr.toISOString().substring(0, 10)
    };
    // Using the yahooFinance api
    var result = yahooFinance.historical({
        symbol: req.stock_symbol,
        from: endpoints.start,
        to: endpoints.end
    }).then(function (quotes) {
        var obj = {
            price: quotes[0].open,
            low: quotes[0].low,
            high: quotes[0].high
        };
        return obj;
    });
    return result; // Returning a promise
}
// Returns the start & end time (ISO) of the time period over which stocks are purchased
function getDatePoints(period, num_periods, curr) {
    var start = new Date();
    switch (period) {
        case 'd':
            start.setDate(curr.getDate() - num_periods);
            break;
        case 'w':
            start.setDate(curr.getDate() - (num_periods * 7));
            break;
        case 'm':
            start.setMonth(curr.getMonth() - num_periods);
            break;
        case 'y':
            start.setFullYear(curr.getFullYear() - num_periods);
            break;
    }
    return start;
}
module.exports = analyze_dca;
