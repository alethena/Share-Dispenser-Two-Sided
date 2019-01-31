pragma solidity 0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

interface ERC20 {
    function totalSupply() external view returns (uint256);
    function transfer(address to, uint tokens) external returns (bool success);
    function transferFrom(address from, address to, uint256 value) external returns (bool success);
    function totalShares() external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256 balance);
}

contract ShareDispenser is Ownable {

    constructor(address initialXCHFContractAddress, address initialALEQContractAddress) public {
        XCHFContractAddress = initialXCHFContractAddress;
        ALEQContractAddress = initialALEQContractAddress;
    }

    using SafeMath for uint256;


    // Relevant Addresses

    address public XCHFContractAddress;     // Address where XCHF is deployed
    address public ALEQContractAddress;     // Address where ALEQ is deployed
 
    address public usageFeeAddress;         // Address where usage fee is collected

    // Definition of constants e.g. prices etc. Buy and sell always refer to the end-user view.
    // 10000 basis points = 100%

    uint256 public usageFeeBSP  = 0;   // In basis points.
    
    uint256 public sharePriceInXCHF   = 6*10**18;
    uint256 public buyBackPriceInXCHF = 59*10**17; 

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
        return sharePriceInXCHF.mul(amount);
    }

    function getCumulatedBuyBackPrice(uint256 amount, uint256 supply) public view returns (uint256){
        return sharePriceInXCHF.mul(amount);
    }

    // Setters for contract addresses

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

    // Function for buying shares

    function buyShares(uint256 numberOfSharesToBuy) public returns (bool) {
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
        XCHF.transferFrom(buyer, usageFeeAddress, usageFee);
        XCHF.transferFrom(buyer, address(this), paymentAmount);

        // Transfer the shares
        ALEQ.transfer(buyer, numberOfSharesToBuy);

        emit SharesPurchased(buyer, numberOfSharesToBuy);
        return true;
    }

    // Function for selling shares

    function sellShares(uint256 numberOfSharesToSell) public returns (bool) {
        address seller = msg.sender;
        uint256 XCHFAvailable = getERC20Balance(XCHFContractAddress);
        uint256 buyBackPrice = getCumulatedBuyBackPrice(numberOfSharesToSell, numberOfSharesToSell);

        // Checks
        require(XCHFAvailable >= buyBackPrice, "Not enough shares available");
        require(getERC20Available(ALEQContractAddress, seller) >= numberOfSharesToSell, "Payment not authorized or funds insufficient");

        // Compute usage fee and final payment amount
        uint256 usageFee = buyBackPrice.mul(usageFeeBSP).div(10000);
        uint256 paymentAmount = buyBackPrice.sub(usageFee);

        // Instantiate contracts
        ERC20 ALEQ = ERC20(ALEQContractAddress);
        ERC20 XCHF = ERC20(XCHFContractAddress);

        // Transfer the shares
        ALEQ.transferFrom(seller, address(this), numberOfSharesToSell);

        // Transfer usage fee and payment amount
        XCHF.transfer(usageFeeAddress, usageFee);
        XCHF.transfer(seller, paymentAmount);

        emit SharesSold(seller, numberOfSharesToSell);
        return true;
    }

    // Events 

    event XCHFContractAddressSet(address newXCHFContractAddress);
    event ALEQContractAddressSet(address newALEQContractAddress);

    event SharesPurchased(address indexed buyer, uint256 amount);
    event SharesSold(address indexed seller, uint256 amount);

}