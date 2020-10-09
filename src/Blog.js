import React, { useEffect, useState } from 'react';
import MetaMaskOnboarding from '@metamask/onboarding';
import classNames from 'classnames';
import { ethers } from 'ethers';

import Article from './Article';

import './Blog.css';

// Address where payments must be made and the price
// Payment address is also kept on the server side to verify payment
const PAYMENT_ADDRESS = '0x54DF84884b1aFc440c661f3f6DD82C8c0987395C';
const MEMBERSHIP_PRICE_IN_ETH = '0.00001';

// A Web3Provider wraps a standard Web3 provider, which is
// what Metamask injects as window.ethereum into each page
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Open new window to show user how to install MetaMask
function onboard() {
  new MetaMaskOnboarding().startOnboarding();
}

// Recommendation is to reload the page if the chain changes
function onChainChanged() {
  window.location.reload();
}

function Blog(props) {
  // Let's not fuss about keeping track of all accounts, let's keep selected
  const [selectedAddress, setSelectedAddress] = useState(window.ethereum.selectedAddress);
  // Payment will be changed as the user completes the payment process
  const [isPaid, setIsPaid] = useState(false);
  // Post could get updated at the end of payment process, containing full post
  const [post, setPost] = useState(null);
  // Is there currently a payment in process that the user should wait for?
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Set the initial post data (preview)
  if(!post) {
    setPost(props.post);
  }

  // Required to know which buttons we should show the user
  const isConnected = !!selectedAddress;
  const isMetaMaskInstalled = window?.ethereum?.isConnected;

  async function connect() {
    // Not using provider method here because it doesn't 
    // open metamask when there are no connected accounts :/
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const selectedAddress = window.selectedAddress || accounts[0] || null;

    console.log('Initial accounts received: ', accounts, selectedAddress);
    setSelectedAddress(selectedAddress);
  }

  async function getUpdatedPostBasedOnPayment(address, signature) {
    const paymentCheckResponse = await fetch(`http://localhost:3001/?address=${address}&signature=${signature}`);
    const post = await paymentCheckResponse.json();
    return post;
  }

  async function startPayment() {
    console.info('startPayment() called to begin signing and payment...');

    // Get a valid signature for this address and message
    const agreementText = `I hereby agree that I will not share this article with anyone under penalty of being added to the wall of shame.`;
    const signature = await provider.send('personal_sign', [agreementText, selectedAddress]);

    // Hit our server to get a payment hash
    console.log('Hitting server to get payment hash!');
    const hashResponse = await fetch('http://localhost:3001/', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        address: selectedAddress,
        signature
      })
    });
    const json = await hashResponse.json();
    console.log('Hash response is: ', json);

    // Check to see if the user has paid for this article,
    // providing the hash, selectedAddress, and signature
    const post = await getUpdatedPostBasedOnPayment(selectedAddress, signature);
    // If we've received the full post, the server is telling us they've paid! Yay!
    if(post.full_post) {
      setPost(post);
      setIsPaid(true);
      return;
    }
    
    const value = ethers.utils.parseEther(MEMBERSHIP_PRICE_IN_ETH);
    const transaction = await signer.sendTransaction({ to: PAYMENT_ADDRESS, data: json.hash, value });
    transaction.wait().then(async waitResult => {
      console.log('The result from waiting for the transaction is: ', waitResult);

      // NOTE: I loathe doing this but let's give a moment for Etherscan to see this new transaction
      // Otherwise, despite this wait, Etherscan apparently isn't finding the transaction
      setTimeout(async () => {
        // Check to see if the user has paid for this article,
        // providing the hash, selectedAddress, and signature
        console.log('Arbitrary timeout has expired!  Asking server for result: ', selectedAddress, signature);
        const post = await getUpdatedPostBasedOnPayment(selectedAddress, signature);
        console.log('Post received from server after payment is: ', post);

        // If we've received the full post, the server is telling us they've paid! Yay!
        if(post.full_post) {
          setPost(post);
          setIsPaid(true);
        }
        setPaymentProcessing(false);
      }, 10000); // FML

    });
    setPaymentProcessing(true);
  }

  // Registration for event listeners
  function onAccountsChanged(accounts) {
    console.log('onAccountsChanged: ', accounts);
    setSelectedAddress(window.ethereum.selectedAddress || accounts[0] || null);
    
    // NOTE: This is naive, because the next account *may have* paid,
    // but we want them to sign again for this
    setIsPaid(false);
  }
  
  // Manages events for account and chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled) {
      return;
    }

    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);
    return () => {
      window.ethereum.off('accountsChanged', onAccountsChanged);
      window.ethereum.off('chainChanged', onChainChanged);
    };
  });

  // Manage page title
  useEffect(() => {
    document.title = `${isPaid ? '' : 'Preview: '} ${post.title}`;
  });

  // UI function: returns busttons to install or connect MetaMask
  function getConnectionButtons() {
    return isMetaMaskInstalled
          ? <button onClick={() => connect()}>Connect MetaMask to pay to view entire article</button>
          : <button onClick={() => onboard()}>Install MetaMask!</button>;
  }

  // Returns a button to pay or buttons to connect MetaMask
  function getActionButtons() {
    if(isConnected) {
      return <button onClick={() => startPayment(setIsPaid)}>Use MetaMask to sign for, pay, and view this article</button>;
    }
    
    return getConnectionButtons();
  }

  return (
    <div className="App">
      <div className={classNames('indicator', { active: isConnected })} />
      { paymentProcessing && <div className="processing">We're currently processing your payment, one moment please.</div> }
      <Article isPaid={isPaid} post={post} />
      {!isPaid && !paymentProcessing && getActionButtons()}
    </div>
  );
}

export default Blog;