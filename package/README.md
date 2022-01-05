# Dollar-Cost-Averaging

```analyze-dca``` is a simple node package that analyzes past stock values and concludes gains/loses based on practicing the ***Dollar Cost Averaging*** investment strategy over a set trading period.

Check out more elaborate explanation about [Dollar Cost Averaging](https://www.investopedia.com/terms/d/dollarcostaveraging.asp) for a better understanding of how this module works referenced briefly below.

# How it works
```analyze-dca``` function takes a JSON object as an input parameter, dca-request (see typescript code block below).
```typescript
type Period = 'd' | 'w' | 'm' | 'y';

interface dca_request {
    amountInvested: number // amount that the user was looking forward to invest
	stockSymbol: string // TSLA, AMZN, GOOGL, AAPL
	period: Period // daily / weekly /monthly /yearly
	numPeriods: number // how many periods, past # days/weeks/months/years
}
```

The ```amountInvested``` is divided equally into ```numPeriods``` parts which is invested on a regular ```period``` resulting in a cumulative sum of the number of shares that are bought based on the historical (open) share price on those days. Through this, the amount invested every ```period``` remains constant while the number of shares bought on recurring periods fluctuates based on market volatility.

After calculating such for every trading period, the total number of shares bought through DCA is compared against buying shares with the whole amount at the price ```numPeriods``` days/weeks/months/years ago. Monetary profits/loses are based on the share price of the most recent trading period.

Check out a sample result object shown in the comment under [usage](#usage) section.


# Installation
```javascript
$ npm install --save analyze-dca
```

# Usage
```javascript
var analyze_dca = require('analyze-dca')

analyze_dca({
    amountInvested: 5000, // Amount to be invested
    stockSymbol: 'TSLA',
    period: 'w', // 'd' (daily) / 'w' (weekly) / 'm' (monthly) / 'y' (yearly)
    numPeriods: 4 // # of periods the stock is bought for DCA
}).then((data) => {
    console.log(data)
    /*
        {
            sharesOwnedWithDCA: 2.9247167245086256,
            sharesOwnedWithDirect: 2.996733479595437,
            directProfit: 439.50,
            dcaProfit: 356.84,
            sharesData: [
                {
                    date: 2022-01-03T05:00:00.000Z,
                    open: 1147.75,
                    close: 1199.780029,
                    high: 1201.069946,
                    low: 1136.040039,
                    symbol: 'TSLA'
                },
                {
                    date: 2021-12-27T05:00:00.000Z,
                    open: 1073.670044,
                    close: 1093.939941,
                    high: 1117,
                    low: 1070.719971,
                    symbol: 'TSLA'
                },
                {
                    date: 2021-12-20T05:00:00.000Z,
                    open: 910.700012,
                    close: 899.940002,
                    high: 921.690002,
                    low: 893.390015,
                    symbol: 'TSLA'
                },
                {
                    date: 2021-12-13T05:00:00.000Z,
                    open: 1001.090027,
                    close: 966.409973,
                    high: 1005,
                    low: 951.419983,
                    symbol: 'TSLA'
                }
            ]
        }
    */
}).catch((error) => {
    console.log(error)
})

```

All dates are in ISO format. All numerical values are returned with max precision available. Round accordingly.

# License

ISC License

Copyright (c) [2022] [Shaz Momin]

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.