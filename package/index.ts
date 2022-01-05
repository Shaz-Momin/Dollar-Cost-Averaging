// Import necessary dependencies -> stock APIs
var yahooFinance = require('yahoo-finance');

// Special type for period (how often the user is buying the stock)
type Period = 'd' |  'w' | 'm' | 'y';

// Input argument (JSON obj) for the dollar cost averaging function
interface dca_request {
    amountInvested: number // amount that the user was looking forward to invest
	stockSymbol: string // TSLA, AMZN, GOOGL
	period: Period // day/week/month/year
	numPeriods: number // how many periods, past # days/weeks/months/years
}

// Main JSON output format
interface results {
    sharesOwnedWithDCA: number
    sharesOwnedWithDirect: number
    directProfit: number
    dcaProfit: number
    sharesData: sharesInfo
}

// Extra output object format
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
        if (quotes.length == 0) { // Handle error state
            return "No Data, Invalid input parameters (ERROR)";
        }

        // Adjust quotes to contain equal number of data to num_periods if period == day
        if (req.period == 'd') {
            quotes = quotes.slice(0, req.numPeriods);
        }

        // quotes contains all requested shares data
        var amtPerPeriod: number = req.amountInvested / req.numPeriods; // for Dollar Cost Averaging strategy
        var sharesData: sharesInfo[] = [];
        var sharesOwnedWithDCA: number = getSharesOwnedDCA(quotes, amtPerPeriod, req.period, req.numPeriods, sharesData);
        var sharesOwnedWithDirect: number = getSharesOwnedDirect(req.amountInvested, sharesData[sharesData.length - 1].open);

        var conclusion = { // Final result object that is returned
            sharesOwnedWithDCA: sharesOwnedWithDCA,
            sharesOwnedWithDirect: sharesOwnedWithDirect,
            directProfit: getGainOrLoss(req.amountInvested, quotes[0].open, sharesOwnedWithDirect),
            dcaProfit: getGainOrLoss(req.amountInvested, quotes[0].open, sharesOwnedWithDCA),
            sharesData: sharesData
        }

        return conclusion;
    })

    return result; // Returning a promise
}

// Returns the start time (ISO) when stocks are first purchased
function getDatePoints(period: Period, numPeriods: number, curr: Date) {
    var start: Date = new Date();

    switch (period) {
        case 'd':
            var actualDays = Math.ceil(numPeriods / 5) + 1
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
            Promise.reject(new Error("Invalid period parameter"))
    }

    // Adjust for startDate that falls on a weekend to the last time market was open
    getPreviousWeekday(start);

    return start;
}

// Calculate the number of shares owned by buying every period
function getSharesOwnedDCA(quotes, amount: number, period: Period, numPeriods: number, sharesData: Array<sharesInfo>) {
    var totalSharesBought: number = 0;
    
    // Offset in days for quotes array traversal
    var weekOffset: number = 5;
    var monthOffset: number = 23;
    var yearOffset: number = 257;

    var tempDate = new Date(quotes[0].date) // starting backwards from current date (in terms of market days)

    // Buy shares with a set amount every period
    for (var i = 0; i < quotes.length; ) {
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
        })
        

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
                tempDate.setMonth(tempDate.getMonth() - 1)
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

// Adjust the date to the previous weekday if this date is a weekend
function getPreviousWeekday(date: Date) {
    if ([6, 7].includes(date.getDay())) {
        date.setDate(date.getDate() - (date.getDay() - 5));
    }
}

module.exports = analyze_dca; // exports the package with this namespace
