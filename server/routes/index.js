const express = require('express');
const router = express.Router();

const { ETHERSCAN_API_KEY } = process.env;
const PAYMENT_ADDRESS = '0x54DF84884b1aFc440c661f3f6DD82C8c0987395C';

const { ethers } = require('ethers');
const axios = require('axios');
const sigUtil = require('eth-sig-util');
const ethUtil = require('ethereumjs-util');

const POST_ID = 1182;
const TITLE = 'How to Detect When a Sticky Element Gets Pinned';
const PREVIEW = `<p>The need for position: sticky was around for years before it was implemented natively, and I can boast that I implemented it with JavaScript and scroll events for ages. Eventually we got position: sticky, and it works well from a visual perspective, but I wondered how can we determine when the element actually became pinned due to scroll.</p>`;
const FULL_POST = `<p>The need for <code>position: sticky</code> was around for years before it was implemented natively, and I can boast that I implemented it with JavaScript and <code>scroll</code> events for ages. Eventually we got <code>position: sticky</code>, and it works well from a visual perspective, but I wondered how can we determine when the element actually became pinned due to scroll.  </p>
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
<!-- /wp:paragraph -->`;

function getHashForPost(postId, address) {
  const key = `${postId}-${address}`;
  return ethers.utils.id(key);
}

function getPostJson(sendFull = false) {
  return { 
    title: TITLE, 
    preview: PREVIEW,
    full_post: sendFull ? FULL_POST : ''
  };
}

const agreementText = ethUtil.bufferToHex(
  new Buffer(`I hereby agree that I will not share this article with anyone under penalty of being added to the wall of shame.`, 'utf8')
);

/* GET home page. */
router.get('/', async function(req, res, next) {
  // If no address and signature are present, simply pass back the post preview
  if(!req.query.address && !req.query.signature) {
    console.log('No address and signature, passing back post preview only');
    return res.json(getPostJson());
  }

  console.log('Signature and address present, going to use axios to check for payment on Etherscan');

  // TODO: Verify the signature received
  const recovered = sigUtil.recoverPersonalSignature({
    data: agreementText,
    sig: req.query.signature
  });
  console.log('The result of sigUtil.recoverPersonalSignature is: ', recovered);
  if (recovered !== req.query.address) {
    return res.json({ ...getPostJson(), error: 'The signature is incorrect' });
  }

  const url = `http://ropsten.etherscan.io/api?module=account&action=txlist&address=${PAYMENT_ADDRESS}&startblock=0&endblock=9999999999999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
  const axiosResponse = await axios.get(url); 
  console.log('Etherscan response is: ', axiosResponse);

  if(axiosResponse.data && axiosResponse.data.result) {
    console.log('We have axios data and result, looking for purchase of this specific post');
    const paidTransaction = axiosResponse.data.result.find(({ from, input }) =>
      from === req.query.address && input === getHashForPost(POST_ID, req.query.address)
    );

    console.log('Paid transaction is: ', paidTransaction);

    // We've found a transaction with matching payer address and hash
    // They've paid!  Give them this post!
    if(paidTransaction) {
      console.log("Sending post from found transaction!")
      return res.json(getPostJson(true));
    }
    else {
      // Hasn't paid yet!
      console.log("Sending post from axios else!")
      return res.json(getPostJson());
    }
  }

  // No response data found, just provide the preview
  console.log("Incomplete request data found, simply passing back preview again");
  return res.json(getPostJson());
});

// When we receive an address to this POST, send back the payment hash
// We'll check that the transaction's payment hash matches this
router.post('/', function(req, res, next) {
  console.log('Request parameters: ', req.body);

  if(!req.body.address) {
    return res.json({ hash: null, error: 'No address was received.' });
  }
  
  return res.json({ hash: getHashForPost(POST_ID, req.body.address) });
});

module.exports = router;
