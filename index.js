import { ethers } from "./ethers-5.6.esm.min.js";
import { abi, contractAddress } from "./constants.js";

const connectButton = document.getElementById("connectButton");
const createCampaignButton = document.getElementById("createCampaignButton");
const donateButton = document.getElementById("donateButton");
const getCurrentCampaignsButton = document.getElementById("getCurrentCampaignsButton");
const campaignsList = document.getElementById("campaignsList");

connectButton.onclick = connect;
createCampaignButton.onclick = createCampaign;
donateButton.onclick = donate;
getCurrentCampaignsButton.onclick = getCurrentCampaigns;

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      await ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      connectButton.innerHTML = "Error Connecting";
      return;
    }
    connectButton.innerHTML = "Connected";
    const accounts = await ethereum.request({ method: "eth_accounts" });
    console.log("Connected accounts:", accounts);
  } else {
    console.error("MetaMask not found.");
    connectButton.innerHTML = "Please install MetaMask";
  }
}

async function createCampaign() {
  const title = document.getElementById("campaignTitle").value;
  const description = document.getElementById("campaignDescription").value;
  const target = document.getElementById("campaignTarget").value;
  const hours = parseInt(document.getElementById("campaignDurationHours").value);
  const image = document.getElementById("campaignImage").value;

  if (!title || !description || !target || !hours || !image) {
    console.error("Please fill out all fields.");
    return;
  }

  const deadline = Math.floor(Date.now() / 1000) + (hours * 3600); // Calculate deadline timestamp in seconds

  console.log(`Creating campaign: ${title}...`);
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.createCampaign(
        signer.getAddress(),
        title,
        description,
        ethers.utils.parseEther(target),
        deadline,
        image
      );
      await listenForTransactionMine(transactionResponse, provider);
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  } else {
    console.error("MetaMask not found.");
    createCampaignButton.innerHTML = "Please install MetaMask";
  }
}


async function donate() {
  const id = document.getElementById("donationCampaignID").value;
  const ethAmount = document.getElementById("donationAmount").value;

  if (!id || !ethAmount) {
    console.error("Please provide campaign ID and donation amount.");
    return;
  }

  console.log(`Donating to campaign ID ${id} with ${ethAmount} ETH...`);
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      // Check if the provided campaign ID exists in the current campaigns list
      const campaigns = await contract.getCampaigns();
      //const campaignIds = campaigns.map(campaign => campaign.id);
      console.log(campaigns)
      if (!campaigns[id]) {
        alert("Invalid ID")
        console.error("Invalid campaign ID.");
        return;
      }

      const donationWei = ethers.utils.parseEther(ethAmount); // Convert Ether to wei
      const transactionResponse = await contract.donateToCampaign(id, {value : donationWei});
      await listenForTransactionMine(transactionResponse, provider);
    } catch (error) {
      console.error("Error donating to campaign:", error);
    }
  } else {
    console.error("MetaMask not found.");
    donateButton.innerHTML = "Please install MetaMask";
  }
}


async function getCurrentCampaigns() {
  console.log("Fetching current campaigns...");
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, abi, provider);
    try {
      const campaigns = await contract.getCampaigns();
      console.log("Current campaigns:");
      campaigns.forEach((campaign, index) => {
        console.log(`Campaign ${index + 1}: Amount Collected - ${campaign.amountCollected}`);
      });
      displayCampaigns(campaigns);
    } catch (error) {
      console.error("Error fetching current campaigns:", error);
    }
  } else {
    console.error("MetaMask not found.");
  }
}


function displayCampaigns(campaigns) {
  campaignsList.innerHTML = ""; // Clear previous campaigns
  campaigns.forEach((campaign) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${campaign.title} - Target: ${ethers.utils.formatEther(campaign.target)} ETH, Amount Collected: ${ethers.utils.formatEther(campaign.amountCollected)} ETH`;
    campaignsList.appendChild(listItem);
  });
}


function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}`);
  return new Promise((resolve, reject) => {
    try {
      provider.once(transactionResponse.hash, (transactionReceipt) => {
        console.log(
          `Completed with ${transactionReceipt.confirmations} confirmations.`
        );
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}
