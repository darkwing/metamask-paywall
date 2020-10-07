import React, { useEffect, useState } from 'react';
import MetaMaskOnboarding from '@metamask/onboarding';
import classNames from 'classnames';
import { ethers } from 'ethers';

import BlogPost from './BlogPost';

import './App.css';

// Address where payments must be made
const PAYMENT_ADDRESS = '0x54DF84884b1aFc440c661f3f6DD82C8c0987395C';
const MEMBERSHIP_PRICE_IN_ETH = '0.00001';

// Manually put this in localStorage
const ETHERSCAN_API_KEY = localStorage.getItem('ETHERSCAN_API_KEY');

const BLOG_POST = {
  title: 'How to Detect When a Sticky Element Gets Pinned',
  preview: `<p>The need for position: sticky was around for years before it was implemented natively, and I can boast that I implemented it with JavaScript and scroll events for ages. Eventually we got position: sticky, and it works well from a visual perspective, but I wondered how can we determine when the element actually became pinned due to scroll.</p>`,
  full_post: `<p>The need for <code>position: sticky</code> was around for years before it was implemented natively, and I can boast that I implemented it with JavaScript and <code>scroll</code> events for ages. Eventually we got <code>position: sticky</code>, and it works well from a visual perspective, but I wondered how can we determine when the element actually became pinned due to scroll.  </p>
  <!-- /wp:paragraph -->
  
  <!-- wp:paragraph -->
  <p>We can determine if an element has become sticky thanks to the <a href="https://davidwalsh.name/intersection-observers">IntersectionObserver API</a>!</p>
  <!-- /wp:paragraph -->
  
  <!-- wp:paragraph -->
  <p>Pinning an element to the top of its container is as easy as one CSS directive:</p>
  <!-- /wp:paragraph -->
  
  <!-- wp:html -->
  <pre class="css">
  .myElement {
    position: sticky;
  }</pre>
  <!-- /wp:html -->
  
  <!-- wp:paragraph -->
  <p>The question still remains about how we can detect an element being pinned. Ideally there would be a <code>:stuck</code> CSS directive we could use, but instead the best we can do is applying a CSS class when the element becomes sticky using a CSS trick and some JavaScript magic:</p>
  <!-- /wp:paragraph -->
  
  <!-- wp:html -->
  <pre class="css">
  .myElement {
    position: sticky;
    /* use "top" to provide threshold for hitting top of parent */
    top: -1px;
  }
  
  .is-pinned {
    color: red;
  }</pre>
  <!-- /wp:html -->
  
  <!-- wp:html -->
  <pre class="js">
  const el = document.querySelector(".myElement")
  const observer = new IntersectionObserver( 
    ([e]) => e.target.classList.toggle("is-pinned", e.intersectionRatio < 1),
    { threshold: [1] }
  );
  
  observer.observe(el);</pre>
  <!-- /wp:html -->
  
  <!-- wp:paragraph -->
  <p>As soon as <code>myElement</code> becomes stuck or unstuck, the <code>is-pinned</code> class is applied or removed.  Check out this demo:</p>
  <!-- /wp:paragraph -->
  
  <!-- wp:html -->
  <p class="codepen" data-height="300" data-theme-id="602" data-default-tab="js,result" data-user="darkwing" data-slug-hash="WNwVXKx" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;" data-pen-title="WNwVXKx">
    <span>See the Pen <a href="https://codepen.io/darkwing/pen/WNwVXKx">
    WNwVXKx</a> by David Walsh (<a href="https://codepen.io/darkwing">@darkwing</a>)
    on <a href="https://codepen.io">CodePen</a>.</span>
  </p>
  <script async src="https://static.codepen.io/assets/embed/ei.js"></script>
  <!-- /wp:html -->
  
  <!-- wp:paragraph -->
  <p>While there's not too much JavaScript involved, I hope we eventually get a CSS pseudo-class for this.  Something like <code>:sticky</code>, <code>:stuck</code>, or <code>:pinned</code> seems as reasonable as <code>:hover</code> and <code>:focus</code> do.</p>
  <!-- /wp:paragraph -->`
};

// A Web3Provider wraps a standard Web3 provider, which is
// what Metamask injects as window.ethereum into each page
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

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

function App() {
  const [accounts, setAccounts] = useState([]);
  const [isPaid, setIsPaid] = useState(false);

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
          console.log("Transaction search of etherscan produces: ", json);
          const selectedAccount = getSelectedAccount(accounts).toLowerCase();
          // Cheating a bit here; sometimes an error triggers a string result from service
          const transactions = Array.isArray(json.result) ? json.result : []
          const paidTransaction = transactions.find(transaction => transaction.from === selectedAccount);
          if(paidTransaction) {
            console.log("User has paid!");
            setIsPaid(true);
          }
        })
        .catch(e => console.log("Etherscan request error: ", e));
    }
    else {
      // We can hide the article if they removce all accounts, I guess...
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
    document.title = `${isPaid ? '' : 'Preview: '} ${BLOG_POST.title}`;
  });

  function getConnectionButtons() {
    return isMetaMaskInstalled
          ? <button onClick={() => connect(setAccounts)}>Pay to view entire article</button>
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
      <BlogPost isPaid={isPaid} post={BLOG_POST} />
      {getActionButtons()}
    </div>
  );
}

export default App;
