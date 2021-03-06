// Copyright 2017-2018 @polkadot/api-rx authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

jest.mock('@polkadot/api-provider/ws', () => class {
  isConnected = () => true;
  on = () => true;
  send = () => true;
});
jest.mock('./interface', () => (api, sectionName) => sectionName);

const createApi = require('./index').default;

describe('createApi', () => {
  it('creates an instance with all sections', () => {
    expect(
      Object.keys(createApi())
    ).toEqual([
      'isConnected', 'author', 'chain', 'state', 'system'
    ]);
  });
});
