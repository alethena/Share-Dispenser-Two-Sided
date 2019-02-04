pragma solidity 0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

interface ERC20 {
    function totalSupply() external view returns (uint256);
    function transfer(address to, uint tokens) external returns (bool success);
    function transferFrom(address from, address to, uint256 value) external returns (bool success);
    function totalShares() external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256 balance);
}

contract ShareDispenser is Ownable, Pausable {

    constructor(address initialXCHFContractAddress, address initialALEQContractAddress) public {
        XCHFContractAddress = initialXCHFContractAddress;
        ALEQContractAddress = initialALEQContractAddress;
    }

    using SafeMath for uint256;

    // Relevant Addresses

    address public XCHFContractAddress;     // Address where XCHF is deployed
    address public ALEQContractAddress;     // Address where ALEQ is deployed
 
    address public usageFeeAddress = 0xFDeda15e2922C5ed41fc1fdF36DA2FB2623666b3;         // Address where usage fee is collected

    // Definition of constants e.g. prices etc. Buy and sell always refer to the end-user view.
    // 10000 basis points = 100%

    uint256 public usageFeeBSP  = 0;   // In basis points. 0 = no usage fee
    uint256 public spreadBSP = 10000;      // In basis points. 95000 = 5% spread

    uint256 public minPriceInXCHF = 6*10**18;
    uint256 public maxPriceInXCHF = 8*10**18;
    uint256 public initialNumberOfShares = 10000;
    

    // Getters for ERC20 balances

    function getERC20Balance(address contractAddress) public view returns (uint256) {
        ERC20 contractInstance = ERC20(contractAddress);
        return contractInstance.balanceOf(address(this));
    }

    function getERC20Available(address contractAddress, address owner) public view returns (uint256) {
        ERC20 contractInstance = ERC20(contractAddress);
        uint256 allowed = contractInstance.allowance(owner, address(this));
        uint256 bal = contractInstance.balanceOf(owner);
        return (allowed <= bal) ? allowed : bal;
    }

    // Price getters

    function getCumulatedPrice(uint256 amount, uint256 supply) public view returns (uint256){
        uint256 cumulatedPrice = 0;
        if (supply <= initialNumberOfShares) {
            uint256 first = initialNumberOfShares.sub(supply);
            uint256 last = first.add(amount).sub(1);
            cumulatedPrice = helper(first,last);
        }

        else if (supply.sub(amount) >= initialNumberOfShares) {
            cumulatedPrice = minPriceInXCHF.mul(amount);
        }

        else {
            cumulatedPrice = supply.sub(initialNumberOfShares).mul(minPriceInXCHF);
            uint256 first = 0;
            uint256 last = amount.sub(supply.sub(initialNumberOfShares).add(1));
            cumulatedPrice = cumulatedPrice.add(helper(first,last));
        }
        
        return cumulatedPrice;
    }

    function getCumulatedBuyBackPrice(uint256 amount, uint256 supply) public view returns (uint256){
        return getCumulatedPrice(amount, supply+amount).mul(spreadBSP).div(10000); // For symmetry reasons
    }

    // Function for buying shares

    function buyShares(uint256 numberOfSharesToBuy) public whenNotPaused() returns (bool) {
        // Fetch the total price
        address buyer = msg.sender;
        uint256 sharesAvailable = getERC20Balance(ALEQContractAddress);
        uint256 totalPrice = getCumulatedPrice(numberOfSharesToBuy, sharesAvailable);

        // Check everything necessary
        require(sharesAvailable >= numberOfSharesToBuy, "Not enough shares available");
        require(getERC20Available(XCHFContractAddress, buyer) >= totalPrice, "Payment not authorized or funds insufficient");

        // Compute usage fee and final payment amount
        uint256 usageFee = totalPrice.mul(usageFeeBSP).div(10000);
        uint256 paymentAmount = totalPrice.sub(usageFee);

        // Instantiate contracts
        ERC20 ALEQ = ERC20(ALEQContractAddress);
        ERC20 XCHF = ERC20(XCHFContractAddress);

        // Transfer usage fee and payment amount
        require(XCHF.transferFrom(buyer, usageFeeAddress, usageFee), "Usage fee transfer failed");
        require(XCHF.transferFrom(buyer, address(this), paymentAmount), "XCHF payment failed");

        // Transfer the shares
        require(ALEQ.transfer(buyer, numberOfSharesToBuy), "Share transfer failed");

        emit SharesPurchased(buyer, numberOfSharesToBuy);
        return true;
    }

    // Function for selling shares

    function sellShares(uint256 numberOfSharesToSell) public whenNotPaused() returns (bool) {
        address seller = msg.sender;
        uint256 XCHFAvailable = getERC20Balance(XCHFContractAddress);
        uint256 sharesAvailable = getERC20Balance(ALEQContractAddress);

        uint256 buyBackPrice = getCumulatedBuyBackPrice(numberOfSharesToSell, sharesAvailable);

        // Checks
        require(XCHFAvailable >= buyBackPrice, "Reserves to small to buy back this amount of shares");
        require(getERC20Available(ALEQContractAddress, seller) >= numberOfSharesToSell, "Seller doesn't have enough shares");

        // Compute usage fee and final payment amount
        uint256 usageFee = buyBackPrice.mul(usageFeeBSP).div(10000);
        uint256 paymentAmount = buyBackPrice.sub(usageFee);

        // Instantiate contracts
        ERC20 ALEQ = ERC20(ALEQContractAddress);
        ERC20 XCHF = ERC20(XCHFContractAddress);

        // Transfer the shares
        require(ALEQ.transferFrom(seller, address(this), numberOfSharesToSell), "Share transfer failed");

        // Transfer usage fee and payment amount
        require(XCHF.transfer(usageFeeAddress, usageFee), "Usage fee transfer failed");
        require(XCHF.transfer(seller, paymentAmount), "XCHF payment failed");

        emit SharesSold(seller, numberOfSharesToSell);
        return true;
    }

    function retrieveERC20(address contractAddress, address to, uint256 amount) public onlyOwner() returns(bool) {
        ERC20 contractInstance = ERC20(contractAddress);
        require(contractInstance.transfer(to, amount), "Transfer failed");
        emit TokensRetrieved(contractAddress, to, amount);
        return true;
    }


    // Setters for addresses

    function setXCHFContractAddress(address newXCHFContractAddress) public onlyOwner() {
        require(newXCHFContractAddress != 0x0000000000000000000000000000000000000000, "XCHF does not reside at address 0x");
        XCHFContractAddress = newXCHFContractAddress;
        emit XCHFContractAddressSet(XCHFContractAddress);
    }

    function setALEQContractAddress(address newALEQContractAddress) public onlyOwner() {
        require(newALEQContractAddress != 0x0000000000000000000000000000000000000000, "ALEQ does not reside at address 0x");
        ALEQContractAddress = newALEQContractAddress;
        emit ALEQContractAddressSet(ALEQContractAddress);
    }

    function setUsageFeeAddress(address newUsageFeeAddress) public onlyOwner() {
        require(newUsageFeeAddress != 0x0000000000000000000000000000000000000000, "ALEQ does not reside at address 0x");
        usageFeeAddress = newUsageFeeAddress;
        emit UsageFeeAddressSet(usageFeeAddress);
    }

    // Setters for constants
    
    function setUsageFee(uint256 newUsageFeeInBSP) public onlyOwner() {
        require(newUsageFeeInBSP <= 10000, "Usage fee must be given in basis points");
        usageFeeBSP = newUsageFeeInBSP;
        emit UsageFeeSet(usageFeeBSP);
    }

    function setSpread(uint256 newSpreadInBSP) public onlyOwner() {
        require(newSpreadInBSP <= 10000, "Spread must be given in basis points");
        spreadBSP = newSpreadInBSP;
        emit SpreadSet(spreadBSP);
    }

    function setminPriceInXCHF(uint256 newMinPriceInRappen) public onlyOwner() {
        require(newMinPriceInRappen > 0, "Price must be positive number");
        minPriceInXCHF = newMinPriceInRappen.mul(10**16);
        emit MinPriceSet(minPriceInXCHF);
    }

    function setmaxPriceInXCHF(uint256 newMaxPriceInRappen) public onlyOwner() {
        require(newMaxPriceInRappen > 0, "Price must be positive number");
        maxPriceInXCHF = newMaxPriceInRappen.mul(10**16);
        emit MaxPriceSet(maxPriceInXCHF);
    }

    function setInitialNumberOfShares(uint256 newInitialNumberOfShares) public onlyOwner() {
        require(newInitialNumberOfShares > 0, "Initial number of shares must be positive");
        initialNumberOfShares = newInitialNumberOfShares;
        emit InitialNumberOfSharesSet(initialNumberOfShares);
    }

    // Events 

    event XCHFContractAddressSet(address newXCHFContractAddress);
    event ALEQContractAddressSet(address newALEQContractAddress);
    event UsageFeeAddressSet(address newUsageFeeAddress);

    event SharesPurchased(address indexed buyer, uint256 amount);
    event SharesSold(address indexed seller, uint256 amount);
    
    event TokensRetrieved(address contractAddress, address to, uint256 amount);

    event UsageFeeSet(uint256 usageFee);
    event SpreadSet(uint256 spread);
    event MinPriceSet(uint256 minPrice);
    event MaxPriceSet(uint256 maxPrice);
    event InitialNumberOfSharesSet(uint256 initialNumberOfShares);



    // Helper functions

    function helper(uint256 first, uint256 last) internal view returns (uint256) {
        uint256 tempa = last.sub(first).add(1).mul(minPriceInXCHF);                            // (l-m+1)*p_min
        uint256 tempb = maxPriceInXCHF.sub(minPriceInXCHF).div(initialNumberOfShares).div(2);  // (p_max-p_min)/(2N)
        uint256 tempc = last.mul(last).add(last).add(first).sub(first.mul(first));                    // l*l+l-m*m+m)
        return tempb.mul(tempc).add(tempa);
    }

}