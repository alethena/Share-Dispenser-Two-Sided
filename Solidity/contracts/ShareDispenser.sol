pragma solidity ^0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

interface ERC20 {
    function totalSupply() external view returns (uint256);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
    function totalShares() external view returns (uint256);
    function allowance(address _owner, address _spender) external view returns (uint256);
    function balanceOf(address _owner) external view returns (uint256 balance);
}

contract ShareDispenser is Ownable {

    constructor(address initialXCHFContractAddress, address initialALEQContractAddress) public {
        XCHFContractAddress = initialXCHFContractAddress;
        ALEQContractAddress = initialALEQContractAddress;
    }

    using SafeMath for uint256;


    // Relevant Addresses

    address public XCHFContractAddress;     // Address where XCHF is deployed
    address public XCHFPayInAddress;        // User pays XCHF to this address when buying shares
    address public XCHFSupplyAddress;       // User gets XCHF from this address when selling shares

    address public ALEQContractAddress;     // Address where ALEQ is deployed
    address public ALEQPayInAddress;        // User transfers ALEQ to this address when selling shares
    address public ALEQSupplyAddress;       // User gets ALEQ from this address when buying shares

    address public usageFeeAddress;         // Address where usage fee is collected

    // Definition of constants e.g. prices etc. Buy and sell always refer to the end-user view.
    // 10000 basis points = 100%

    uint256 public usageFeeBuy  = 0;   // In basis points.
    uint256 public usageFeeSell = 0;  // In basis points.
    uint256 public reserveRate  = 0;   // In basis points.
    uint256 public spreadRate   = 0;    // In basis points.
    
    uint256 public sharePriceInXCHF   = 6*10**18;
    uint256 public buyBackPriceInXCHF = 59*10**17; 

    
    // Implementing all the setters

    function setXCHFContractAddress(address newXCHFContractAddress) public onlyOwner() {
        require(newXCHFContractAddress != 0x0000000000000000000000000000000000000000, "XCHF does not reside at address 0x");
        XCHFContractAddress = newXCHFContractAddress;
        emit XCHFContractAddressSet(XCHFContractAddress);
    }

    function setXCHFPayInAddress(address newXCHFPayInAddress) public onlyOwner() {
        require(newXCHFPayInAddress != 0x0000000000000000000000000000000000000000, "Not a valid pay-in address");
        XCHFPayInAddress = newXCHFPayInAddress;
        emit XCHFPayInAddressSet(XCHFPayInAddress);
    }
    
    function setXCHFSupplyAddress(address newXCHFSupplyAddress) public onlyOwner() {
        require(newXCHFSupplyAddress != 0x0000000000000000000000000000000000000000, "Not a valid supply address");
        XCHFSupplyAddress = newXCHFSupplyAddress;
        emit XCHFSupplyAddressSet(XCHFSupplyAddress);
    }

    function setALEQPayInAddress(address newALEQPayInAddress) public onlyOwner() {
        require(newALEQPayInAddress != 0x0000000000000000000000000000000000000000, "Not a valid pay-in address");
        ALEQPayInAddress = newALEQPayInAddress;
        emit ALEQPayInAddressSet(ALEQPayInAddress);
    }

    function setALEQContractAddress(address newALEQContractAddress) public onlyOwner() {
        require(newALEQContractAddress != 0x0000000000000000000000000000000000000000, "ALEQ does not reside at address 0x");
        ALEQContractAddress = newALEQContractAddress;
        emit ALEQContractAddressSet(ALEQContractAddress);
    }

    function setALEQSupplyAddress(address newALEQSupplyAddress) public onlyOwner() {
        require(newALEQSupplyAddress != 0x0000000000000000000000000000000000000000, "Not a valid supply address");
        ALEQSupplyAddress = newALEQSupplyAddress;
        emit ALEQSupplyAddressSet(ALEQSupplyAddress);
    }

    function setSharePrice(uint256 newSharePriceInRappen) public onlyOwner() {
        require(newSharePriceInRappen > 0, "Share price cannot be zero");
        sharePriceInXCHF = newSharePriceInRappen.mul(10**16);
        emit sharePriceInXCHFSet(sharePriceInXCHF);
    }

    // Non-trivial getters (cross-contract)

    function getSharePriceInXCHF() public view returns(uint256){
        return sharePriceInXCHF;
    }

    function getCumulativeBuyPrice(uint256 numberToBuy, uint256 availableShares) public view returns(uint256){
        return sharePriceInXCHF*numberToBuy;
    }

    function getBuyBackPriceInXCHF() public view returns(uint256){
        return buyBackPriceInXCHF;
    }

    function getAvailableSupply() public view returns(uint256) {
        ERC20 a = ERC20(ALEQContractAddress);
        uint256 temp = a.allowance(ALEQSupplyAddress, address(this));
        uint256 supply = a.balanceOf(ALEQSupplyAddress);

        return (temp <= supply) ? temp : supply;
        // if (temp <= supply){
        //     return temp;
        // } else{
        //     return supply;
        // }
    }


    function getTotalSupply() public view returns (uint256) {
        ERC20 a = ERC20(ALEQContractAddress);
        return a.totalSupply();
    }

    function getTotalNumberOfShares() public view returns(uint256) {
        ERC20 a = ERC20(ALEQContractAddress);
        return a.totalShares();
    }


    // Buy/Sell functions

    function buyShares(uint256 numberOfSharesToBuy) public returns(bool) {

        uint256 availableSupply = getAvailableSupply();
        uint256 priceInXCHF = getCumulativeBuyPrice(numberOfSharesToBuy, availableSupply);
        
        ERC20 xchf = ERC20(XCHFContractAddress);

        // What checks need to be done?
        require(xchf.balanceOf(msg.sender) >= priceInXCHF, "XCHF balance insufficient");
        require(xchf.allowance(msg.sender, address(this)) >= priceInXCHF, "Payment not authorized");
        require(availableSupply >= numberOfSharesToBuy, "Not enough shares available");
        
        // Calculate usage fee, reserve amount and subtract it from payment amount
        uint256 usageFee = priceInXCHF.mul(usageFeeBuy).div(10000);
        uint256 reserveAmount = priceInXCHF.mul(reserveRate).div(10000);
        uint256 paymentAmount = priceInXCHF.sub(usageFee).sub(reserveAmount);

        // Transfer XCHF to specified account
        xchf.transferFrom(msg.sender, XCHFPayInAddress, paymentAmount);

        // Transfer usage fee
        if (usageFee != 0) xchf.transferFrom(msg.sender, usageFeeAddress, usageFee);
        
        // Transfer reserve amount
        if (reserveAmount != 0) xchf.transferFrom(msg.sender, XCHFSupplyAddress, reserveAmount);

        //Transfer ALEQ to specified account
        ERC20 a = ERC20(ALEQContractAddress);
        a.transferFrom(ALEQSupplyAddress, msg.sender, numberOfSharesToBuy);
        emit sharesPurchased(msg.sender, numberOfSharesToBuy);
    }

    // function sellShares(uint256 numberOfSharesToSell) public returns(bool) {
    //     uint256 priceInXCHF = numberOfSharesToSell*buyBackPriceInXCHF;
    //     ERC20 a = ERC20(ALEQContractAddress);
    // }



    // EVENTS:

    event XCHFContractAddressSet(address newXCHFContractAddress);
    event XCHFPayInAddressSet(address newXCHFPayInAddress);
    event XCHFSupplyAddressSet(address newXCHFSupplyAddressSet);

    event ALEQContractAddressSet(address newALEQContractAddress);
    event ALEQPayInAddressSet(address newALEQPayInAddress);
    event ALEQSupplyAddressSet(address newALEQSupplyAddress);

    event sharesPurchased(address indexed buyer, uint256 amount);
    event sharesSold(address indexed seller, uint256 amount);

    event sharePriceInXCHFSet(uint256 newSharePriceInXCHF);
    event buyBackPriceInXCHFSet(uint256 newBuyBackPriceInXCHF);

    // Function to give back foreign tokens?
    // FALLBACK FUNCTION not implemented. Contract will not accept Ether.
    // Pausable function

}