import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployHubFixture } from "./fixture";

describe("Hub", function () {
  describe("Create", function () {
    it("Should set app data", async function () {
      const { owner, hub } = await loadFixture(deployHubFixture);

      const fakeAppAddress = ethers.ZeroAddress;

      const tx = await hub.createApp(0, fakeAppAddress);
      const receipt = await tx.wait();

      const filter = hub.filters.Hub_AppCreated;
      const logs = await hub.queryFilter(filter, receipt?.blockHash);
      const [appId] = logs[0].args;

      const app = await hub.getApp(appId);
      const createdAt = await time.latest();

      expect({
        owner: app.owner,
        createdAt: app.createdAt,
      }).to.deep.equal({
        owner: owner.address,
        createdAt,
      });
    });
  });
});
