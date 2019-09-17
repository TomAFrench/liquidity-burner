pragma solidity ^0.5.0;

contract YourContract {

  string public YourVar = "HELLO WORLD";
  address public owner;

  constructor() public {
    owner = msg.sender;
  }

  function updateVar(string memory newVal) public returns (bool) {
    require(msg.sender==owner,"YourContract::updateVar not owner");
    YourVar=newVal;
    return true;
  }

}
