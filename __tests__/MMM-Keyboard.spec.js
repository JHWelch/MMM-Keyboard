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

describe('defaults', () => {
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

  it('uses the config language override when set', () => {
    const previousConfig = global.config;
    global.config = { language: 'de' };

    jest.resetModules();
    require('../MMM-Keyboard');
    MMMKKeyboard = global.Module.create(name);
    MMMKKeyboard.setData({ name, identifier: `Module_1_${name}` });

    expect(MMMKKeyboard.defaults.language).toBe('de');
    global.config = previousConfig;
  });
});
