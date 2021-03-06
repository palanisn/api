// Copyright 2017-2018 @polkadot/api-provider authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { Logger } from '@polkadot/util/types';
import { RpcCoder } from '../coder/json/types';
import { JsonRpcResponse, ProviderInterface, ProviderInterface$Callback, ProviderInterface$Emitted, ProviderInterface$EmitCb } from '../types';

import './polyfill';

import E3 from 'eventemitter3';
import assert from '@polkadot/util/assert';
import isNull from '@polkadot/util/is/null';
import isUndefined from '@polkadot/util/is/undefined';
import logger from '@polkadot/util/logger';

import coder from '../coder/json';

type SubscriptionHandler = {
  callback: ProviderInterface$Callback,
  type: string
};

type WsState$Awaiting = {
  callback: ProviderInterface$Callback,
  method: string,
  params: Array<any>,
  subscription?: SubscriptionHandler
};

type WsState$Subscription = SubscriptionHandler & {
  method: string,
  params: Array<any>
};

interface WSProviderInterface extends ProviderInterface {
  connect (): void;
}

export default class WsProvider extends E3.EventEmitter implements WSProviderInterface {
  private autoConnect: boolean;
  private coder: RpcCoder;
  private endpoint: string;
  private handlers: {
    [index: number]: WsState$Awaiting
  };
  private _isConnected: boolean;
  private l: Logger;
  private queued: {
    [index: string]: string
  };
  private subscriptions: {
    [index: string]: WsState$Subscription
  };
  private websocket: WebSocket | null;

  constructor (endpoint: string, autoConnect: boolean = true) {
    super();

    assert(/^(wss|ws):\/\//.test(endpoint), `Endpoint should start with 'ws://', received '${endpoint}'`);

    this.autoConnect = autoConnect;
    this.coder = coder();
    this.endpoint = endpoint;
    this._isConnected = false;
    this.handlers = {};
    this.l = logger('api-ws');
    this.queued = {};
    this.subscriptions = {};
    this.websocket = null;

    if (autoConnect) {
      this.connect();
    }
  }

  connect (): void {
    try {
      this.websocket = new WebSocket(this.endpoint);

      this.websocket.onclose = this.onSocketClose;
      this.websocket.onerror = this.onSocketError;
      this.websocket.onmessage = this.onSocketMessage;
      this.websocket.onopen = this.onSocketOpen;
    } catch (error) {
      this.l.error(error);
    }
  }

  isConnected (): boolean {
    return this._isConnected;
  }

  on (type: ProviderInterface$Emitted, sub: ProviderInterface$EmitCb): this {
    return super.on(type, sub);
  }

  async send (method: string, params: Array<any>, subscription?: SubscriptionHandler): Promise<any> {
    return new Promise((resolve, reject): void => {
      try {
        const json = this.coder.encodeJson(method, params);
        const id = this.coder.getId();
        const callback = (error: Error | null, result: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        };

        this.l.debug(() => ['calling', method, params, json, !!subscription]);

        this.handlers[id] = {
          callback,
          method,
          params,
          subscription
        };

        if (this.isConnected() && !isNull(this.websocket)) {
          this.websocket.send(json);
        } else {
          this.queued[id] = json;
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  async subscribe (type: string, method: string, params: Array<any>, callback: ProviderInterface$Callback): Promise<number> {
    const id = await this.send(method, params, { callback, type });

    return id as number;
  }

  async unsubscribe (type: string, method: string, id: number): Promise<boolean> {
    const subscription = `${type}::${id}`;

    assert(!isUndefined(this.subscriptions[subscription]), `Unable to find active subscription=${subscription}`);

    delete this.subscriptions[subscription];

    const result = await this.send(method, [id]);

    return result as boolean;
  }

  private onSocketClose = (): void => {
    this.l.debug(() => ['disconnected from', this.endpoint]);

    this._isConnected = false;
    this.emit('disconnected');

    if (this.autoConnect) {
      setTimeout(() => {
        this.connect();
      }, 1000);
    }
  }

  private onSocketError = (error: Event): void => {
    this.l.error(error);
  }

  private onSocketMessage = (message: MessageEvent): void => {
    this.l.debug(() => ['received', message.data]);

    const response: JsonRpcResponse = JSON.parse(message.data as string);

    return isUndefined(response.method)
      ? this.onSocketMessageResult(response)
      : this.onSocketMessageSubscribe(response);
  }

  private onSocketMessageResult = (response: JsonRpcResponse): void => {
    this.l.debug(() => ['handling: response =', response, 'id =', response.id]);

    const handler = this.handlers[response.id];

    if (!handler) {
      this.l.error(`Unable to find handler for id=${response.id}`);
      return;
    }

    try {
      const { method, params, subscription } = handler;
      const result = this.coder.decodeResponse(response);

      if (subscription) {
        this.subscriptions[`${subscription.type}::${result}`] = {
          ...subscription,
          method,
          params
        };
      }

      handler.callback(null, result);
    } catch (error) {
      handler.callback(error, undefined);
    }

    delete this.handlers[response.id];
  }

  private onSocketMessageSubscribe = (response: JsonRpcResponse): void => {
    const subscription = `${response.method}::${response.params.subscription}`;

    this.l.debug(() => ['handling: response =', response, 'subscription =', subscription]);

    const handler = this.subscriptions[subscription];

    if (!handler) {
      this.l.error(`Unable to find handler for subscription=${subscription}`);
      return;
    }

    try {
      const result = this.coder.decodeResponse(response);

      handler.callback(null, result);
    } catch (error) {
      handler.callback(error, undefined);
    }
  }

  private onSocketOpen = (): boolean => {
    assert(!isNull(this.websocket), 'WebSocket cannot be null in onOpen');

    this.l.debug(() => ['connected to', this.endpoint]);

    this._isConnected = true;
    this.emit('connected');

    Object.keys(this.queued).forEach((id) => {
      try {
        // @ts-ignore checked above
        this.websocket.send(
          this.queued[id]
        );

        delete this.queued[id];
      } catch (error) {
        this.l.error(error);
      }
    });

    return true;
  }
}
