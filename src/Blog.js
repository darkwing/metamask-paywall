/*
  TODO:
    
    * Why doesn't the `accountsChanged` event always fire upon connection?
*/

import React, { useEffect, useState } from 'react';
import MetaMaskOnboarding from '@metamask/onboarding';
import classNames from 'classnames';
import { ethers } from 'ethers';

import Article from './Article';

// Address where payments must be made and the price
// Payment address is also kept on the server side to verify payment
const PAYMENT_ADDRESS = '0x54DF84884b1aFc440c661f3f6DD82C8c0987395C';
const MEMBERSHIP_PRICE_IN_ETH = '0.00001';

// A Web3Provider wraps a standard Web3 provider, which is
// what Metamask injects as window.ethereum into each page
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

function onboard() {
  new MetaMaskOnboarding().startOnboarding();
}

function onChainChanged() {
  window.location.reload();
}

function getSelectedAccount(accounts) {
  return (window.ethereum.selectedAddress || accounts[0]).toLowerCase();
}

function Blog(props) {
  // The accounts array will be modified as the user connects and disconnects
  const [accounts, setAccounts] = useState([]);
  // Payment will be changed as the user completes the payment process
  const [isPaid, setIsPaid] = useState(false);
  // Post could get updated at the end of payment process, containing full post
  const [post, setPost] = useState(null);

  // Set the initial post data (preview)
  if(!post) {
    setPost(props.post);
  }

  const isConnected = !!accounts?.[0];
  const isMetaMaskInstalled = window?.ethereum?.isConnected;

  async function connect() {
    // Not using provider method here because it doesn't 
    // open metamask when there are no connected accounts :/
    return window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(result => {
          console.log('Received eth_requestAccounts result: ', result);
          if(result.length > 0) {
            setAccounts(result);
          }
        })
        .catch(error => {
          if (error.code === 4001) {
            // EIP-1193 userRejectedRequest error
            console.error('Please connect to MetaMask.');
          } else {
            console.error(error);
          }
        });
  }

  async function startPayment() {
    console.info('Opening MetaMask to initiate payment...');
    const value = ethers.utils.parseEther(MEMBERSHIP_PRICE_IN_ETH);

    console.log('Hitting server to get payment hash!');
    const hashResponse = await fetch('http://localhost:3001/', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address: getSelectedAccount(accounts) })
    });
    const json = await hashResponse.json();
    console.log('Hash response is: ', json);

    return signer.sendTransaction({ to: PAYMENT_ADDRESS, data: json.hash, value })
          // Assumes a valid result; in a production environment, where we want to be completely sure
          // we got paid, and were willing to wait, we'd poll the ETHERSCAN API to ensure the transaction was complete
          .then(result => {
            console.log("Payment completed, assuming all is well", result);
            setIsPaid(true);
          })
          .catch(e => console.error("Payment error! ", e));
  }

  // Registration for event listeners
  function onAccountsChanged(accounts) {
    console.log('onAccountsChanged: ', accounts);
    setAccounts(accounts);

    if(accounts.length) {
      // Check to see if they've paid
      
    }
    else {
      // Probably disconnected, hide article
      setIsPaid(false);
    }
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
          ? <button onClick={() => connect(setAccounts)}>Connect MetaMask to pay to view entire article</button>
          : <button onClick={() => onboard()}>Install MetaMask!</button>;
  }

  // Returns a button to pay or buttons to connect MetaMask
  function getActionButtons() {
    if(isConnected) {
      return <button onClick={() => startPayment(setIsPaid)}>Use MetaMask to pay for this article</button>;
    }
    
    return getConnectionButtons();
  }

  return (
    <div className="App">
      <div className={classNames('indicator', { active: isConnected })} />
      <Article isPaid={isPaid} post={post} />
      {!isPaid && getActionButtons()}
    </div>
  );
}

export default Blog;