This project is an experimentation in using MetaMask to paywall a single blog post.  This project requires
[MetaMask](http://metamask.io/) and a [Ropsten Network Etherscan API key](https://ropsten.etherscan.io/apis).

## Running this project

In the `server` directory, run the following to install dependencies and start the server:

```
yarn install
ETHERSCAN_API_KEY={ROPSTEN_ETHERSCAN_API_KEY} yarn start
```

In the project directory, run the following to install dependencies and start the UI:

```
yarn install
yarn start
```

The UI will run on port `3000`, the server will run on port `3001`.  Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
