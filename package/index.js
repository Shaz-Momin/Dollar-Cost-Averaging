// Import necessary dependencies -> stock APIs
var yahooFinance = require('yahoo-finance');
// Core function that calculates gains/loses from stocks using DCA strategy
function analyze_dca(req) {
    var curr = new Date();
    var startDate = getDatePoints(req.period, req.numPeriods, curr);
    var diffInDays = (curr.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    var endpoints = {
        start: startDate,
        end: curr
    };
    // Using the yahooFinance api
    var result = yahooFinance.historical({
        symbol: req.stockSymbol,
        from: endpoints.start.toISOString().substring(0, 10),
        to: endpoints.end.toISOString().substring(0, 10)
    }).then(function (quotes) {
        if (quotes.length == 0) { // Handle error state
            return "No Data, Invalid input parameters (ERROR)";
        }
        // Adjust quotes to contain equal number of data to num_periods if period == day
        if (req.period == 'd') {
            quotes = quotes.slice(0, req.numPeriods);
        }
        // quotes contains all requested shares data
        var amtPerPeriod = req.amountInvested / req.numPeriods; // for Dollar Cost Averaging strategy
        var sharesData = [];
        var sharesOwnedWithDCA = getSharesOwnedDCA(quotes, amtPerPeriod, req.period, req.numPeriods, sharesData);
        var sharesOwnedWithDirect = getSharesOwnedDirect(req.amountInvested, sharesData[sharesData.length - 1].open);
        var conclusion = {
            sharesOwnedWithDCA: sharesOwnedWithDCA,
            sharesOwnedWithDirect: sharesOwnedWithDirect,
            directProfit: getGainOrLoss(req.amountInvested, quotes[0].open, sharesOwnedWithDirect),
            dcaProfit: getGainOrLoss(req.amountInvested, quotes[0].open, sharesOwnedWithDCA),
            sharesData: sharesData
        };
        return conclusion;
    });
    return result; // Returning a promise
}
// Returns the start time (ISO) when stocks are first purchased
function getDatePoints(period, numPeriods, curr) {
    var start = new Date();
    switch (period) {
        case 'd':
            var actualDays = Math.ceil(numPeriods / 5) + 1;
            start.setDate(curr.getDate() - (actualDays * 7));
            break;
        case 'w':
            start.setDate(curr.getDate() - (numPeriods * 7));
            start.setDate(start.getDate() - 1);
            break;
        case 'm':
            start.setMonth(curr.getMonth() - numPeriods);
            start.setDate(start.getDate() - 1);
            break;
        case 'y':
            start.setFullYear(curr.getFullYear() - (numPeriods - 1));
            start.setDate(start.getDate() - 1);
            break;
        default:
            Promise.reject(new Error("Invalid period parameter"));
    }
    // Adjust for startDate that falls on a weekend to the last time market was open
    getPreviousWeekday(start);
    return start;
}
// Calculate the number of shares owned by buying every period
function getSharesOwnedDCA(quotes, amount, period, numPeriods, sharesData) {
    var totalSharesBought = 0;
    // Offset in days for quotes array traversal
    var weekOffset = 5;
    var monthOffset = 23;
    var yearOffset = 257;
    var tempDate = new Date(quotes[0].date); // starting backwards from current date (in terms of market days)
    // Buy shares with a set amount every period
    for (var i = 0; i < quotes.length;) {
        var j = i;
        // array access, should mostly be constant O(#) time
        while (Date.parse(quotes[j].date) < Date.parse(tempDate.toISOString())) {
            j--;
        }
        // Calculate # of stocks you can buy with the amount & add it to the cumulative sum
        totalSharesBought += getSharesOwnedDirect(amount, quotes[j].open);
        // Store the correct data (open, high, low)
        sharesData.push({
            date: quotes[j].date,
            open: quotes[j].open,
            close: quotes[j].close,
            high: quotes[j].high,
            low: quotes[j].low,
            symbol: quotes[j].symbol
        });
        // Update tempDate for next iteration
        switch (period) {
            case 'd':
                i += 1;
                if (i < quotes.length) {
                    tempDate = new Date(quotes[i].date.getDate());
                }
                break;
            case 'w':
                i += weekOffset;
                tempDate.setDate(tempDate.getDate() - 7);
                break;
            case 'm':
                i += monthOffset;
                tempDate.setMonth(tempDate.getMonth() - 1);
                break;
            case 'y':
                i += yearOffset;
                tempDate.setFullYear(tempDate.getFullYear() - 1);
                break;
        }
    }
    // For any extra leftover date missed out due to miscalculations
    if (sharesData.length != numPeriods) {
        var k = quotes.length - 1;
        while (Date.parse(quotes[k].date) < Date.parse(tempDate.toISOString())) {
            k--;
        }
        totalSharesBought += getSharesOwnedDirect(amount, quotes[j].open); // for cumulative sum
        sharesData.push({
            date: quotes[k].date,
            open: quotes[k].open,
            close: quotes[k].close,
            high: quotes[k].high,
            low: quotes[k].low,
            symbol: quotes[k].symbol
        });
    }
    return totalSharesBought;
}
// Returns the number of stocks owned using direct investment 
function getSharesOwnedDirect(amount, price) {
    return amount / price;
}
// Returns the value that was gained/losed from buying the stock at old price & selling it at new price
function getGainOrLoss(amount, currPrice, shares) {
    return (shares * currPrice) - amount;
}
// Adjust the date to the next weekday if this date is a weekend
function getNextWeekday(date) {
    if ([6, 7].includes(date.getDay())) {
        date.setDate(date.getDate() + (8 - date.getDay()));
    }
}
// Adjust the date to the previous weekday if this date is a weekend
function getPreviousWeekday(date) {
    if ([6, 7].includes(date.getDay())) {
        date.setDate(date.getDate() - (date.getDay() - 5));
    }
}
module.exports = analyze_dca; // exports the package with this namespace
