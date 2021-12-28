// Import necessary dependencies -> stock APIs
var yahooFinance = require('yahoo-finance');

// Special type for period (how often the user is buying the stock)
type Period = /* 'd' |  */'w' | 'm' | 'y';

// Input argument (JSON obj) for the dollar cost averaging function
interface dca_request {
    amountInvested: number; // amount that the user was looking forward to invest
	stockSymbol: string; // TSLA, AMZN, GOOGL
	period: Period; // day/week/month/year
	numPeriods: number; // how many periods, past # days/weeks/months/years
}

interface sharesInfo {
    date: Date,
    open: number;
    close: number;
    high: number;
    low: number;
    symbol: string;
}


// Core function that calculates gains/loses from stocks using DCA strategy
function analyze_dca(req: dca_request) {
    var curr: Date = new Date();
    var startDate: Date = getDatePoints(req.period, req.numPeriods, curr);
    var diffInDays = (curr.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

    var endpoints = { // range of the period
        start: startDate,
        end: curr
    }

    // Using the yahooFinance api
    var result = yahooFinance.historical({
        symbol: req.stockSymbol,
        from: endpoints.start.toISOString().substring(0,10),
        to: endpoints.end.toISOString().substring(0,10)
    }).then(function (quotes) {
        if (quotes.length == 0) {
            return "No Data, Invalid input parameters (ERROR)";
        }
        var sharesOwnedWithDirect: number = getSharesOwnedDirect(req.amountInvested, quotes[quotes.length - 1].open);

        var amtPerPeriod: number = req.amountInvested / req.numPeriods; // for Dollar Cost Averaging strategy
        var sharesData: sharesInfo[] = [];
        var sharesOwnedWithDCA: number = getSharesOwnedDCA(quotes, amtPerPeriod, req.period, req.numPeriods, sharesData);

        var conclusion = { // Final result object that is returned
            sharesOwnedWithDCA: sharesOwnedWithDCA,
            sharesOwnedWithDirect: sharesOwnedWithDirect,
            directProfit: getGainOrLoss(req.amountInvested, quotes[0].open, sharesOwnedWithDirect),
            dcaProfit: getGainOrLoss(req.amountInvested, quotes[0].open, sharesOwnedWithDCA),
            sharesData: sharesData
        }

        console.log("Diff in days: " + Math.round(diffInDays));
        console.log("Actual data for days: " + quotes.length);

        return conclusion;
    })

    return result; // Returning a promise
}

// Returns the start time (ISO) when stocks are first purchased
function getDatePoints(period: Period, numPeriods: number, curr: Date) {
    var start: Date = new Date();
    start.setDate(start.getDate() - 1);

    switch (period) {
        /* case 'd': // start.setDate(curr.getDate() - numPeriods);
            var temp = new Date(curr);
            for (var i = 0; i < numPeriods; i++) {
                var day = temp.getDay();
                if ([6,7].includes(day)) {
                    i--;
                }
                temp.setDate(temp.getDate() - 1);
            }
            start.setDate(temp.getDate());
            break; */
        case 'w':
            start.setDate(curr.getDate() - ((numPeriods - 1) * 7));
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
    }

    return start;
}

// Calculate the number of shares owned by buying every period
function getSharesOwnedDCA(quotes, amount: number, period: Period, numPeriods: number, sharesData: Array<sharesInfo>) {
    var totalSharesBought: number = 0;
    
    // Offset in days for quotes array traversal
    var weekOffset: number = 5;
    var monthOffset: number = 23;
    var yearOffset: number = 257;

    var tempDate = new Date(); 
    tempDate.setDate(tempDate.getDate() - 1); // starting backwards from yesterday

    // Buy shares with a set amount every period
    for (var i = 0; i < quotes.length; ) {
        // array access, should mostly be constant O(#) time
        var j = i;
        while (quotes[j].date.toISOString().substring(0,10) != tempDate.toISOString().substring(0,10)) {
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
            symbol: quotes[i].symbol
        })
        

        // Update tempDate for next iteration
        switch (period) {
            case 'w': 
                i += weekOffset;
                tempDate.setDate(tempDate.getDate() - 7);
                break;
            case 'm': 
                i += monthOffset;
                tempDate.setDate(tempDate.getMonth() - 1);
                break;
            case 'y':
                i += yearOffset;
                tempDate.setDate(tempDate.getFullYear() - 1);
                break;
        }
    }

    // For any extra leftover date missed out due to miscalculations
    if (sharesData.length != numPeriods) {
        var k = quotes.length - 1;
        while (quotes[k].date.toISOString().substring(0,10) != tempDate.toISOString().substring(0,10)) {
            k--;
        }

        totalSharesBought += getSharesOwnedDirect(amount, quotes[j].open); // for cumulative sum

        sharesData.push({ // add this last piece of data
            date: quotes[k].date,
            open: quotes[k].open,
            close: quotes[k].close,
            high: quotes[k].high,
            low: quotes[k].low,
            symbol: quotes[k].symbol
        })
    }

    return totalSharesBought;
}

// Returns the number of stocks owned using direct investment 
function getSharesOwnedDirect(amount: number, price: number) {
    return amount/price;
}

// Returns the value that was gained/losed from buying the stock at old price & selling it at new price
function getGainOrLoss(amount: number, currPrice: number, shares: number) {
    return (shares * currPrice) - amount;
}

// Adjust the date to the next weekday if this date is a weekend
function getNextWeekday(date: Date) {
    if ([6, 7].includes(date.getDay())) {
        date.setDate(date.getDate() + (8 - date.getDay()));
    }
}

module.exports = analyze_dca; // exports the package with this namespace
