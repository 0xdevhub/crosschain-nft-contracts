import { ethers } from "hardhat";

export async function deployHubFixture() {
  const [owner] = await ethers.getSigners();

  const Hub = await ethers.getContractFactory("Hub");
  const hub = await Hub.deploy();

  return { hub, owner };
}
