[![polkadotjs](https://img.shields.io/badge/polkadot-js-orange.svg?style=flat-square)](https://polkadot.js.org)
![isc](https://img.shields.io/badge/license-ISC-lightgrey.svg?style=flat-square)
[![style](https://img.shields.io/badge/code%20style-semistandard-lightgrey.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![npm](https://img.shields.io/npm/v/@polkadot/api-provider.svg?style=flat-square)](https://www.npmjs.com/package/@polkadot/api-provider)
[![travis](https://img.shields.io/travis/polkadot-js/api.svg?style=flat-square)](https://travis-ci.org/polkadot-js/api)
[![maintainability](https://img.shields.io/codeclimate/maintainability/polkadot-js/api.svg?style=flat-square)](https://codeclimate.com/github/polkadot-js/api/maintainability)
[![coverage](https://img.shields.io/coveralls/polkadot-js/api.svg?style=flat-square)](https://coveralls.io/github/polkadot-js/api?branch=master)
[![dependency](https://david-dm.org/polkadot-js/api.svg?style=flat-square&path=packages/api-provider)](https://david-dm.org/polkadot-js/api?path=packages/api-provider)
[![devDependency](https://david-dm.org/polkadot-js/api/dev-status.svg?style=flat-square&path=packages/api-provider)](https://david-dm.org/polkadot-js/api?path=packages/api-provider#info=devDependencies)

# @polkadot/api-provider

Generic transport providers to handle the transport of method calls to and from Polkadot clients from applications interacting with it. Generally, unless you are operating at a low-level and taking care of encoding and decoding of parameters/results, it won't be directly used. API interfaces building on top these providers can support various transports with the same underlying interfaces.

## Usage

### Installation

```
npm install --save @polkadot/api-provider
```

### Initialisation

```js
import WsProvider from '@polkadot/api-provider/ws';

const provider = new WsProvider('http://127.0.0.1:9944');
```

Parameters
1. `String` - `endpoint`: A valid websocket endpoint, should start with `ws://`
2. `Boolean` - `autoConnect`:(optional) Defines whether connection should be automatically established. Default true

Returns

`Object`: The webservice provider instance


### Usage

#### connect

```js
provider.connect()
```

Establish connection with a websocket endpoint

#### isConnected

```js
provider.isConnected()
```

Check if connection is established with a provider

Returns

`Boolean`

#### on

```js
provider.on('connected', callback)
```

Event emitter interface - callback functions can be attached when `connected` and `disconnected` events are fired

Parameters
1. `type` - `String`: Event name
2. `callback` - Callback function

Returns

`Object` - current WsProvider instance

#### send

```js
provider.send('methodName', [params])
```

Relay instructions to provider node

Parameters
1. `method` - `String`: Method name
2. `params` - `Array`
3. `subscription` - `Object`:(optional) Subscription handler

Returns

`Promise` returns any type

#### subscribe

```js
provider.subscribe('eventType', 'methodName', [params], callback)
```

Parameters
1. `type` - `String`: Event type
2. `method` - `String`: Method name
3. `params` - `Array`
4. `callback`

Returns

`Promise` returns Number

#### unsubscribe

```js
provider.unsubscribe('eventType', 'methodName', id)
```

Parameters
1. `type` - `String`: Event type
2. `method` - `String`: Method name
3. `id` - `Number`

Returns

`Promise` returns Boolean

