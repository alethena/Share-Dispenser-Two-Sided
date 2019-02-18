This is the repository for the two sided share dispenser. It allows the user to swap ALEQ shares for XCHF and vice versa.

To run locally:
- cd into folder
- run `./init.sh` (on Windows use `sh .\init`)


Attention: 
There is a breaking change in the npm module `truffle-contract` from version 4.x.x onwards (breaks bignumber dependencies).


**Documentation Share Dispenser Smart Contract:**

The share dispenser allows a company to provide a certain degree of liquidity to their shares. The company 

**State Variables**

The contract uses the following variables:

* `address public XCHFContractAddress` is the contract address where the Crypto Franc is deployed

* `address public ALEQContractAddress` is the contract address where the Alethena Shares Token is deployed

* `address public usageFeeAddress` is a (non-contract) address where the usage fees are collected

The three addresses above have to be supplied to the constructor function (allows for easy cascaded deployment).

* `uint256 public usageFeeBSP`  This is the usage fee expressed in basis points. When shares are bought or sold, this fraction of the XCHF payment is transferred to the `usageFeeAddress`. A value of zero corresponds to no usage fee, a value of 500 corresponds to 5% usage fee.

* `uint256 public spreadBSP` The company can decide to fix a spread between bid and ask prices. This is again expressed in basis points. Example: A value of 9500 corresponds to a spread of 5%, which means that the buyback price (i.e. the amount of XCHF a shareholder selling their shares to the company) will be reduced by 5%. 

**Pricing Model**
The price is adjusted according to the available supply.
Initially a total of `uint256 public initialNumberOfShares` shares are allocated (i.e. sent to) the share dispenser contract.
The first share is to be sold at price `uint256 public minPriceInXCHF` and the last at price `uint256 public initialNumberOfShares`. Inbetween a linear interpolation is used, please see the pricing documentation for details and formulas.
This is implemented in the `getCumulatedPrice` and `getCumulatedBuyBackPrice` functions which both take two arguments, namely the number of shares to be bought/sold and the number of shares currently available. There is a relation between buy and sell prices in the sense that, assuming zero spread, buying shares and subsequently selling them straight away should have no effect apart from transactions fees spent.

If the company additionally supplies XCHF or if a spread is set, a situation can occur where the number of shares held by the contract exceeds `initialNumberOfShares`. In this case, the share surplus will be sold at price `minPriceInXCHF`.

The buy and sell sides can be separately enabled/disabled through the variables `bool public buyEnabled` and `bool public sellEnabled`.

**Additonal Functions**
* The XCHF or ALEQ balance held by the dispenser contract can be retrieved through `getERC20Balance` which takes the corresponding contract address as an argument. 
* To check that a share purchase can happen, the user needs to hold a sufficient amount of XCHF (or ALEQ) but they also need to give a sufficient allowance to the dispenser contract. This is checked using the `getERC20Available` function which takes two arguments, the contract address (ALEQ or XCHF) as well as the potential buyer/seller.
* In order for the company to retrieve XCHF or ALEQ from the dispenser contract the `retrieveERC20` function is implemented. It expects three arguments, the contract address (ALEQ or XCHF), the address to send the tokens to as well as the amount. This function can only be called by the contract owner.


**A note on decimals**
XCHF has 18 decimals, ALEQ has zero decimals.
Share prices are entered by the user in Rappen (0.01 XCHF). Hence we need a factor of 10**16 inbetween.

**The buy process**

To buy shares the user first grants a sufficient XCHF allowance to the dispenser smart contract.
Then the user calls the function `buyShares` with one argument, the number of shares to buy.

1. It is checked that buying is enabled
2. The number of shares available is fetched and the totalPrice is computed using `getCumulatedPrice`.
3. It is checked that the dispenser has enough shares and the buyer has sufficient XCHF balance and allowance set.
4. The usage fee is computed and subtracted from the total price.
5. Usage fee is transferred to the corresponding address
6. The remaining XCHF is transferred to the dispenser contract.
7. The shares are transferred to the buyer.
8. An event is emitted and the function returns `true`.

Any user can call `buyShares`.

**The sell process**

To buy shares the user first grants a sufficient ALEQ allowance to the dispenser smart contract.
Then the user calls the function `sellShares` with one argument, the number of shares to sell.

1. It is checked that selling is enabled
2. The number of XCHF available is fetched and the totalPrice is computed using `getCumulatedBuyBackPrice`.
3. It is checked that the dispenser has enough XCHF and the seller has sufficient ALEQ balance and allowance set.
4. The usage fee is computed and subtracted from the total price.
5. The shares are transferred from the seller to the dispenser contract.
6. Usage fee is transferred to the corresponding address
7. The remaining XCHF is transferred to the dispenser seller.
8. An event is emitted and the function returns `true`.

Any user can call `sellShares`.


**Permissions**