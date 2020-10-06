/*
  TODO - MAJOR
  ==========================
    * Show content only if smart contract / paid
      *  


  TODO - MINOR
  ==========================
    * Style the blog post properly
*/

import React, { useEffect, useState } from 'react';
import MetaMaskOnboarding from '@metamask/onboarding';
import classNames from "classnames";

import BlogPost from './BlogPost';

import './App.css';

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
  }
  </pre>
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
  }
  </pre>
  <!-- /wp:html -->
  
  <!-- wp:html -->
  <pre class="js">
  const el = document.querySelector(".myElement")
  const observer = new IntersectionObserver( 
    ([e]) => e.target.classList.toggle("is-pinned", e.intersectionRatio < 1),
    { threshold: [1] }
  );
  
  observer.observe(el);
  </pre>
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

function connect(setAccounts) {
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
  const onboarding = new MetaMaskOnboarding();
  onboarding.startOnboarding();
}

function onChainChanged() {
  window.location.reload();
}

function App() {
  const [accounts, setAccounts] = useState([]);

  const isConnected = accounts?.[0];
  const isMetaMaskInstalled = window?.ethereum?.isConnected;

  // Registration for event listeners
  function onAccountsChanged(accounts) {
    console.log('onAccountsChanged: ', accounts);
    setAccounts(accounts);
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
    document.title = `${isConnected ? '' : 'Preview: '} ${BLOG_POST.title}`;
  });

  return (
    <div className="App">
      <div className={classNames('indicator', { active: isConnected })} />
      <BlogPost isConnected={isConnected} post={BLOG_POST} />
      {
        isConnected ? null : (
          isMetaMaskInstalled
            ? <button onClick={() => connect(setAccounts)}>Connect to MetaMask to view the entire article!</button> 
            : <button onClick={() => onboard()}>Install MetaMask!</button>
        )
      }
    </div>
  );
}

export default App;
