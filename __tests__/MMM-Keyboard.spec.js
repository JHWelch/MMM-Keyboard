/** @jest-environment jsdom */

const fs = require('node:fs');

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

describe('getStyles', () => {
  it('returns the correct styles', () => {
    expect(MMMKKeyboard.getStyles()).toEqual([
      'keyboard.css',
      'node_modules/simple-keyboard/build/css/index.css',
    ]);
  });
});

describe('getScripts', () => {
  it('returns the correct scripts', () => {
    expect(MMMKKeyboard.getScripts()).toEqual([
      'node_modules/simple-keyboard/build/index.js',
    ]);
  });
});

describe('start', () => {
  it('sets shiftState to 1 if starting uppercase', () => {
    MMMKKeyboard.config.startUppercase = true;

    MMMKKeyboard.start();

    expect(MMMKKeyboard.shiftState).toBe(1);
  });

  it('sets shiftState to 0 if not starting uppercase', () => {
    MMMKKeyboard.config.startUppercase = false;

    MMMKKeyboard.start();

    expect(MMMKKeyboard.shiftState).toBe(0);
  });

  it('will allow setting language to de', () => {
    MMMKKeyboard.config.language = 'de';

    MMMKKeyboard.start();

    expect(MMMKKeyboard.config.language).toBe('de');
  });

  it('will allow setting language to en', () => {
    MMMKKeyboard.config.language = 'en';

    MMMKKeyboard.start();

    expect(MMMKKeyboard.config.language).toBe('en');
  });

  it('will revert all other languages to en', () => {
    MMMKKeyboard.config.language = 'fr';

    MMMKKeyboard.start();

    expect(MMMKKeyboard.config.language).toBe('en');
  });

  it('loads layouts', () => {
    const originalLoadLayouts = MMMKKeyboard.loadLayouts;
    MMMKKeyboard.loadLayouts = jest.fn();

    MMMKKeyboard.start();

    expect(MMMKKeyboard.loadLayouts).toHaveBeenCalled();

    MMMKKeyboard.loadLayouts = originalLoadLayouts;
  });
});

describe('loadLayouts', () => {
  it('loads the layouts into memory', async () => {
    const responseText = fs.readFileSync(require.resolve('../layouts.json'), 'utf8');
    const xhr = {
      readyState: 0,
      status: 0,
      responseText: '',
      overrideMimeType: jest.fn(),
      open: jest.fn(),
      send: jest.fn(),
    };
    global.XMLHttpRequest = jest.fn(() => xhr);
    MMMKKeyboard.buildKeyboard = jest.fn();

    MMMKKeyboard.loadLayouts();

    expect(xhr.open).toHaveBeenCalledWith('GET', 'layouts.json', true);
    expect(xhr.send).toHaveBeenCalledWith(null);

    xhr.readyState = 4;
    xhr.status = 200;
    xhr.responseText = responseText;
    xhr.onreadystatechange();

    await Promise.resolve();

    expect(MMMKKeyboard.layouts).toMatchSnapshot();
    expect(MMMKKeyboard.buildKeyboard).toHaveBeenCalled();
  });
});
