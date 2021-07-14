const { expect } = require('chai');
const { BigNumber } = require("ethers");

// Main function that is executed during the test
describe("Monkey Contract, testing", () => {
  // Global variable declarations
  let _contractInstance, monkeyContract, accounts

  // 11 genes0
  const genes0 = [
    1214131111989211,
    2821812836412724,
    8637321863927066,
    4196818943246071,
    8934327613363924,
    7763776642816647,
    5248231223637872,
    4778887573779531,
    2578926622376651,
    5867697316113337,
    4688246721977031    
  ] 

  //set contracts instances
  before(async function() {
    // Deploy MonkeyContract to testnet
    _contractInstance = await ethers.getContractFactory('MonkeyContract');
    monkeyContract = await _contractInstance.deploy(); 
    //get all accounts from hardhat
    accounts = await ethers.getSigners();
  })

  it("1: create 11 additional gen 0 monkeys (constructor created first one), then expect revert above 12 (after GEN0_Limit = 12)", async () => {
    
    // REVERT: create a gen 0 monkey from account[1]
    await expect(monkeyContract.connect(accounts[1]).createGen0Monkey(genes0[0])).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    // creating 11 additional gen 0 monkeys
    for(_i in genes0){
     await monkeyContract.createGen0Monkey(genes0[_i]);
    }
    // NFT totalSupply should be 12, 11 gen0 plus 1 burnt Zero Monkey
    const _totalSupply = await monkeyContract.showTotalSupply();
    expect(_totalSupply).to.equal(12); 

    // testing getting data from mapping
    for (let i = 0; i < _totalSupply; i++) {
      let _monkeyMapping = await monkeyContract.allMonkeysArray(i);
      // skip monkey created by constructor
      if(i > 0){
      // verify monkey genes are the same from our genes0 array      
      //console.log("_monkeyMapping[3]", ethers.utils.formatUnits(_monkeyMapping[3], 0), "loop", i)
      // _monkeyMapping[3] shows genes  attribute inside the returning CryptoMonkey object
      // i-1 because first Crypto Monkey was done by constructor, not from genes0
      expect(_monkeyMapping[3]).to.equal(genes0[i-1]);
      }
    } 

    // GEN0_Limit reached, next creation should fail
    await expect(monkeyContract.createGen0Monkey(genes0[0])).to.be.revertedWith(
      "Maximum amount of gen 0 monkeys reached"
    );    

  });

  it("2. BREED Monkey", async () => {
    // breeding monkey from mapping results
    await monkeyContract.breed(1, 2);
    // balanceOf accounts[0] should be 12
    expect(await monkeyContract.balanceOf(accounts[0].address)).to.equal(12);
    // NFT totalSupply should be 13
    expect(await monkeyContract.totalSupply()).to.equal(13);
  });

  it("3. Checking tokenId ", async () =>{
    let _monkeyId = await monkeyContract.findMonkeyIdsOfAddress(accounts[0].address);
    for(i in _monkeyId){
      let _result = ethers.utils.formatUnits(_monkeyId[i], 0);
      console.log("tokenArray", _result);
    }
    let _monkeyPosition = await monkeyContract.findNFTposition(accounts[0].address, _monkeyId[1]);
    console.log("monkey Position", ethers.utils.formatUnits(_monkeyPosition, 0))
  });

  it("4. TRANSFER 2 gen0 monkeys from account[0] to account[1]", async () => {
    const _totalSupply = await monkeyContract.totalSupply();
    console.log(`total#[${_totalSupply}]`)
    await monkeyContract.transferFrom(accounts[0].address, accounts[1].address, 2);
    expect(await monkeyContract.balanceOf(accounts[1].address)).to.equal(1);
    // REVERT: transfer a non-owned monkey
    await expect(monkeyContract.transferFrom(accounts[1].address, accounts[2].address, 1)).to.be.revertedWith(
      "ERC721: transfer of token that is not own"
    );
    
    // accounts[0] should own 11 monkeys
    expect(await monkeyContract.balanceOf(accounts[0].address)).to.equal(11);
  });
})