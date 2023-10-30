import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseContract, ContractEventName } from "ethers";
import { HubInterface } from "../typechain-types/Hub";
import { Hub__factory } from "../typechain-types";

describe("Hub", function () {
  async function deployHubFixture() {
    const [owner] = await ethers.getSigners();

    const Hub = await ethers.getContractFactory("Hub");
    const hub = await Hub.deploy();

    return { hub, owner };
  }

  describe("Create", function () {
    it("Should set app owner", async function () {
      const { owner, hub } = await loadFixture(deployHubFixture);

      const tx = await hub.createApp();
      const receipt = await tx.wait();
      const filter = hub.filters.Hub_AppCreated;
      const logs = await hub.queryFilter(filter, receipt?.blockHash);
      const appId = logs[0].args[0];
      const app = await hub.getApp(appId);

      expect(app.owner).to.equal(owner.address);
    });
  });
});
