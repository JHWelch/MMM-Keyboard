/** @jest-environment jsdom */

const fs = require('node:fs');

require('../__mocks__/Module');
require('../__mocks__/globalLogger');

const name = 'MMM-Keyboard';

let MMMKKeyboard;
let oldLog;

beforeEach(() => {
  jest.resetModules();
  require('../MMM-Keyboard');

  MMMKKeyboard = global.Module.create(name);
  MMMKKeyboard.setData({ name, identifier: `Module_1_${name}` });
  oldLog = MMMKKeyboard.log;
  MMMKKeyboard.log = jest.fn();
  MMMKKeyboard.keyboard = {
    setOptions: jest.fn(),
    getInput: jest.fn().mockReturnValue('test-input'),
    clearInput: jest.fn(),
    options: {
      layoutName: 'default',
    },
  };
});

afterEach(() => {
  MMMKKeyboard.log = oldLog;
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

describe('getDom', () => {
  it('returns the generated dom', () => {
    expect(MMMKKeyboard.getDom()).toMatchSnapshot();
  });

  it('can generate a dom for debug', () => {
    MMMKKeyboard.config.debug = true;

    expect(MMMKKeyboard.getDom()).toMatchSnapshot();
  });
});

describe('notificationReceived', () => {
  it('logs a message for `DOM_OBJECTS_CREATED`', () => {
    MMMKKeyboard.notificationReceived('DOM_OBJECTS_CREATED');

    expect(MMMKKeyboard.log)
      .toHaveBeenCalledWith('MMM-Keyboard: Initializing keyboard');
  });

  it('activates keyboard for `KEYBOARD`', () => {
    document.body.appendChild(MMMKKeyboard.getDom());

    MMMKKeyboard.notificationReceived('KEYBOARD', {
      key: 'test-key',
      style: 'default',
      data: {
        test: 'data',
        foo: 'bar',
      },
    });

    expect(MMMKKeyboard.log)
      .toHaveBeenCalledWith('MMM-Keyboard recognized a notification: KEYBOARD{"key":"test-key","style":"default","data":{"test":"data","foo":"bar"}}');
    expect(MMMKKeyboard.log)
      .toHaveBeenCalledWith('Activating Keyboard!');
    expect(MMMKKeyboard.currentKey).toBe('test-key');
    expect(MMMKKeyboard.currentData).toEqual({
      test: 'data',
      foo: 'bar',
    });
    expect(MMMKKeyboard.keyboard.setOptions).toHaveBeenCalledWith({
      layoutName: 'shift',
    });
    expect(document.getElementById('kbInput').value)
      .toBe('test-input');
    expect(document.getElementById('inputDiv').style.display)
      .toBe('block');
  });
});

describe('sendInput', () => {
  it('sends KEYBOARD_INPUT with message', () => {
    const oldSendNotification = MMMKKeyboard.sendNotification;
    MMMKKeyboard.sendNotification = jest.fn();
    MMMKKeyboard.currentKey = 'test-key';
    MMMKKeyboard.currentData = { foo: 'bar' };

    document.body.appendChild(MMMKKeyboard.getDom());
    document.getElementById('kbInput').value = 'User input';

    MMMKKeyboard.kbContainer.classList.add('show-keyboard');

    MMMKKeyboard.sendInput();

    expect(MMMKKeyboard.sendNotification)
      .toHaveBeenCalledWith('KEYBOARD_INPUT', {
        key: 'test-key',
        message: 'User input',
        data: {
          foo: 'bar',
        },
      });
    expect(MMMKKeyboard.keyboard.clearInput).toHaveBeenCalled();
    expect(document.getElementById('kbInput').value).toBe('');
    expect(MMMKKeyboard.shiftState).toBe(1);
    expect(MMMKKeyboard.kbContainer.classList)
      .not.toContain('show-keyboard');

    MMMKKeyboard.sendNotification = oldSendNotification;
  });
});

describe('onChange', () => {
  it('sets kbInput value', () => {
    document.body.appendChild(MMMKKeyboard.getDom());

    MMMKKeyboard.onChange('new value');

    expect(document.getElementById('kbInput').value).toBe('new value');
    expect(MMMKKeyboard.log).toHaveBeenCalledWith('Input changed: new value');
  });

  it('sets shift state if input is empty', () => {
    const oldHandleShift = MMMKKeyboard.handleShift;
    MMMKKeyboard.handleShift = jest.fn();
    document.body.appendChild(MMMKKeyboard.getDom());

    MMMKKeyboard.onChange('');

    expect(MMMKKeyboard.shiftState).toBe(1);
    expect(MMMKKeyboard.handleShift).toHaveBeenCalled();

    MMMKKeyboard.handleShift = oldHandleShift;
  });
});
