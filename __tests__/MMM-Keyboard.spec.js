/** @jest-environment jsdom */

require('../__mocks__/Module');
require('../__mocks__/globalLogger');

const name = 'MMM-Keyboard';

let MMMKKeyboard;

beforeEach(() => {
  jest.resetModules();
  require('../MMM-Keyboard');

  MMMKKeyboard = global.Module.create(name);
  MMMKKeyboard.setData({ name, identifier: `Module_1_${name}` });
});

it('has a default config', () => {
  expect(MMMKKeyboard.defaults).toEqual({
    showAlways: false,
    layout: 'default',
    language: 'en',
    startUppercase: true,
    startWithNumbers: false,
    debug: false,
  });
});
