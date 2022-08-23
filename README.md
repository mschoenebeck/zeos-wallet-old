# ZEOS Wallet

A sample wallet application for private and untraceable transactions on EOS(IO). This is the front-end of the [ZEOS Demo Application](https://zeos.one/demo).

See also:
- [ZEOS Sapling](https://github.com/mschoenebeck/zeos-sapling)
- [ZEOS Token Contract](https://github.com/mschoenebeck/thezeostoken)
- [ZAVI Token Contract](https://github.com/mschoenebeck/thezavitoken)

## Description
This application was developed as a proof-of-concept demo app for the ZEOS project. It is the user interface of the [ZEOS Sapling](https://github.com/mschoenebeck/zeos-sapling) application. The branches 'sapling' and 'zavi' contain the code of the demo app on the testnet ('zavi' is the new version based on the ZAVI token) while the 'main' branch contains the mainnet application's UI.

## Getting Started

To setup the full workspace clone the dependencies [zeos-sapling](https://github.com/mschoenebeck/zeos-sapling), [rustzeos](https://github.com/mschoenebeck/rustzeos), [bellman](https://github.com/mschoenebeck/bellman) as well:

```
mkdir zeos
cd zeos
git clone https://github.com/mschoenebeck/zeos-sapling.git
git clone https://github.com/mschoenebeck/rustzeos.git
git clone https://github.com/mschoenebeck/bellman.git
```

Clone this repository:

```
git clone https://github.com/mschoenebeck/zeos-wallet.git
cd zeos-wallet
```

Build the node project using yarn:

```
yarn install
yarn build
```

Build and install zeos-sapling as wasm32 library:

```
cd ../zeos-sapling
make install
```

Run the application on a local webserver by executing

```
cd ../zeos-wallet
yarn run example
```

Open a browser and head over to: ```http://localhost:3000/```.

### Dependencies

- [Rust Toolchain](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/en/)

## Help
If you need help join us on [Telegram](https://t.me/ZeosOnEos).

## Authors

Matthias Schönebeck

## License

It's open source. Do with it whatever you want.

## Acknowledgments

Big thanks to the Electric Coin Company for developing, documenting and maintaining this awesome open source codebase for zk-SNARKs!

* [Zcash Protocol Specification](https://zips.z.cash/protocol/protocol.pdf)