import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import hre from "hardhat";

describe("BeaconProxy Test", function () {
    let Version1;
    let Version2;
    
    async function deploySetupFixture() {
        Version1 = await ethers.getContractFactory("Version1");
        Version2 = await ethers.getContractFactory("Version2");
        return {Version1, Version2}
    }

    it("Test beaconProxy", async function() {
        const {Version1, Version2} = await loadFixture(deploySetupFixture);

        const beacon = await upgrades.deployBeacon(Version1);
        await beacon.deployed();
        console.log("Beacon deployed to:", beacon.address);

        // Proxies deployment
        const proxy1 = await upgrades.deployBeaconProxy(beacon, Version1, []);
        await proxy1.deployed();
        console.log("Proxy1 deployed to:", proxy1.address);

        const proxy2 = await upgrades.deployBeaconProxy(beacon, Version1, []);
        await proxy2.deployed();
        console.log("Proxy2 deployed to:", proxy2.address);

        const proxy1_accessor = Version1.attach(proxy1.address);
        const proxy2_accessor = Version1.attach(proxy2.address);

        await proxy1_accessor.setCounter(105);
        let value = await proxy1_accessor.getCounter();
        expect(value.toString()).to.equal("105");
        
        value = await proxy2_accessor.getCounter();
        expect(value.toString()).to.equal("100");
    
        // upgrading the Beacon Proxy, using the second version of the contract
        await upgrades.upgradeBeacon(beacon, Version2);

        await proxy1_accessor.setCounter(105)
        value = await proxy1_accessor.getCounter()
        expect(value.toString()).to.equal('610')  // 105 + 500 + 5
        value = await proxy2_accessor.getCounter()
        expect(value.toString()).to.equal('105')
    });
});