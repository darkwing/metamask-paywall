import React, { useEffect, useState } from 'react';
import MetaMaskOnboarding from '@metamask/onboarding';
import classNames from 'classnames';
import { ethers, utils } from 'ethers';

import Article from './Article';

// Address where payments must be made
const PAYMENT_ADDRESS = '0x54DF84884b1aFc440c661f3f6DD82C8c0987395C';
const MEMBERSHIP_PRICE_IN_ETH = '0.00001';

// Manually put this in localStorage
const ETHERSCAN_API_KEY = localStorage.getItem('ETHERSCAN_API_KEY');

// A Web3Provider wraps a standard Web3 provider, which is
// what Metamask injects as window.ethereum into each page
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// DEBUG!
// 0xcc0850b4d6daef1da3fbbb0c6bb1fd5273a593452c633e58dc8e6b0d7dd7d8c403b74b7cdfca6f09f156914b75c926a96d48896815858d1a144a3b2793d5cc541c
window.utils = utils;
window.provider = provider;
window.signer = signer;

/*
const agreement = `I hereby agree that I will not share this article with anyone under penalty of being added to the wall of shame.`;
const agree = provider.send('personal_sign', [agreement, '0x2e6a2cb1cadeddde14cccd6627ffcf70d934605f']);
agree.then(result => console.log("agreement result: ", result)).catch(e => console.error("agreement catch: ", e));
*/

function connect(setAccounts) {
  // Not using provider method here because it doesn't 
  // open metamask when there are no connected accounts :/
  window.ethereum
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

function onboard() {
  new MetaMaskOnboarding().startOnboarding();
}

function onChainChanged() {
  window.location.reload();
}

async function startPayment(setIsPaid) {
  console.warn('Opening MetaMask to initiate payment...');
  const value = ethers.utils.parseEther(MEMBERSHIP_PRICE_IN_ETH);
  return signer.sendTransaction({ to: PAYMENT_ADDRESS, value })
        // Assumes a valid result; in a production environment, where we want to be completely sure
        // we got paid, and were willing to wait, we'd poll the ETHERSCAN API to ensure the transaction was complete
        .then(result => {
          console.log("Payment completed, assuming all is well", result);
          setIsPaid(true);
        })
        .catch(e => console.error("Payment error! ", e));
}

function getSelectedAccount(accounts) {
  return (window.ethereum.selectedAddress || accounts[0]).toLowerCase();
}

function Blog(props) {
  const [accounts, setAccounts] = useState([]);
  const [isPaid, setIsPaid] = useState(false);

  const { post } = props;

  const isConnected = !!accounts?.[0];
  const isMetaMaskInstalled = window?.ethereum?.isConnected;

  // Registration for event listeners
  function onAccountsChanged(accounts) {
    console.log('onAccountsChanged: ', accounts);
    setAccounts(accounts);

    if(accounts.length) {
      // Check to see if they've paid
      fetch(`http://ropsten.etherscan.io/api?module=account&action=txlist&address=${PAYMENT_ADDRESS}&startblock=0&endblock=9999999999999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`)
        .then(result => result.json())
        .then(json => {
          console.log('Transaction search of etherscan produces: ', json);
          const selectedAccount = getSelectedAccount(accounts).toLowerCase();
          // Cheating a bit here; sometimes an error triggers a string result from service
          const transactions = Array.isArray(json.result) ? json.result : []
          const paidTransaction = transactions.find(transaction => transaction.from === selectedAccount);
          if(paidTransaction) {
            console.log('User has paid!');
            setIsPaid(true);
          }
        })
        .catch(e => console.log('Etherscan request error: ', e));
    }
    else {
      // We can hide the article if they remove all accounts, I guess...
      setIsPaid(false);
    }
  }
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

  function getConnectionButtons() {
    return isMetaMaskInstalled
          ? <button onClick={() => connect(setAccounts)}>Connect MetaMask to pay to view entire article</button>
          : <button onClick={() => onboard()}>Install MetaMask!</button>;
  }

  function getActionButtons() {
    if(isPaid) {
      return null;
    }

    if(isConnected) {
      return <button onClick={() => startPayment(setIsPaid)}>Use MetaMask to pay for this article</button>;
    }
    else {
      return getConnectionButtons();
    }
  }

  return (
    <div className="App">
      <div className={classNames('indicator', { active: isConnected })} />
      <Article isPaid={isPaid} post={post} />
      {getActionButtons()}
    </div>
  );
}

export default Blog;