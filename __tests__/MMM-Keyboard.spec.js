/** @jest-environment jsdom */

const fs = require('node:fs');

require('../__mocks__/Module');
require('../__mocks__/globalLogger');

const name = 'MMM-Keyboard';

let MMMKeyboard;
let oldLog;

beforeEach(() => {
  jest.resetModules();
  require('../MMM-Keyboard');

  MMMKeyboard = global.Module.create(name);
  MMMKeyboard.setData({ name, identifier: `Module_1_${name}` });
  oldLog = MMMKeyboard.log;
  MMMKeyboard.log = jest.fn();
  MMMKeyboard.keyboard = {
    setOptions: jest.fn(),
    getInput: jest.fn().mockReturnValue('test-input'),
    clearInput: jest.fn(),
    options: {
      layoutName: 'default',
    },
  };
});

afterEach(() => {
  MMMKeyboard.log = oldLog;
});

describe('defaults', () => {
  it('has a default config', () => {
    expect(MMMKeyboard.defaults).toEqual({
      showAlways: false,
      layout: 'default',
      sendLabel: 'SEND!',
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
    MMMKeyboard = global.Module.create(name);
    MMMKeyboard.setData({ name, identifier: `Module_1_${name}` });

    expect(MMMKeyboard.defaults.language).toBe('de');
    global.config = previousConfig;
  });
});

describe('getStyles', () => {
  it('returns the correct styles', () => {
    expect(MMMKeyboard.getStyles()).toEqual([
      'keyboard.css',
      'node_modules/simple-keyboard/build/css/index.css',
    ]);
  });
});

describe('getScripts', () => {
  it('returns the correct scripts', () => {
    expect(MMMKeyboard.getScripts()).toEqual([
      'node_modules/simple-keyboard/build/index.js',
    ]);
  });
});

describe('start', () => {
  beforeEach(() => {
    MMMKeyboard.loadLayouts = jest.fn();
  });

  it('sets shiftState to 1 if starting uppercase', () => {
    MMMKeyboard.config.startUppercase = true;

    MMMKeyboard.start();

    expect(MMMKeyboard.shiftState).toBe(1);
  });

  it('sets shiftState to 0 if not starting uppercase', () => {
    MMMKeyboard.config.startUppercase = false;

    MMMKeyboard.start();

    expect(MMMKeyboard.shiftState).toBe(0);
  });

  it('will allow setting language to de', () => {
    MMMKeyboard.config.language = 'de';

    MMMKeyboard.start();

    expect(MMMKeyboard.config.language).toBe('de');
  });

  it('will allow setting language to en', () => {
    MMMKeyboard.config.language = 'en';

    MMMKeyboard.start();

    expect(MMMKeyboard.config.language).toBe('en');
  });

  it('will revert all other languages to en', () => {
    MMMKeyboard.config.language = 'fr';

    MMMKeyboard.start();

    expect(MMMKeyboard.config.language).toBe('en');
  });

  it('loads layouts', () => {
    MMMKeyboard.start();

    expect(MMMKeyboard.loadLayouts).toHaveBeenCalled();
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
    MMMKeyboard.buildKeyboard = jest.fn();

    MMMKeyboard.loadLayouts();

    expect(xhr.open).toHaveBeenCalledWith('GET', 'layouts.json', true);
    expect(xhr.send).toHaveBeenCalledWith(null);

    xhr.readyState = 4;
    xhr.status = 200;
    xhr.responseText = responseText;
    xhr.onreadystatechange();

    await Promise.resolve();

    expect(MMMKeyboard.layouts).toMatchSnapshot();
    expect(MMMKeyboard.buildKeyboard).toHaveBeenCalled();
  });
});

describe('getDom', () => {
  it('returns the generated dom', () => {
    expect(MMMKeyboard.getDom()).toMatchSnapshot();
  });

  it('can generate a dom for debug', () => {
    MMMKeyboard.config.debug = true;

    expect(MMMKeyboard.getDom()).toMatchSnapshot();
  });

  describe('submit button', () => {
    it('defaults to SEND!', () => {
      expect(MMMKeyboard.getDom().querySelector('.sendButton').innerText.trim())
        .toBe('SEND!');
    });

    it('can be overridden with config value', () => {
      MMMKeyboard.config.sendLabel = 'Submit';

      expect(MMMKeyboard.getDom().querySelector('.sendButton').innerText.trim())
        .toBe('Submit');
    });
  });
});

describe('notificationReceived', () => {
  it('logs a message for `DOM_OBJECTS_CREATED`', () => {
    MMMKeyboard.notificationReceived('DOM_OBJECTS_CREATED');

    expect(MMMKeyboard.log)
      .toHaveBeenCalledWith('MMM-Keyboard: Initializing keyboard');
  });

  it('activates keyboard for `KEYBOARD`', () => {
    document.body.appendChild(MMMKeyboard.getDom());

    MMMKeyboard.notificationReceived('KEYBOARD', {
      key: 'test-key',
      style: 'default',
      data: {
        test: 'data',
        foo: 'bar',
      },
    });

    expect(MMMKeyboard.log)
      .toHaveBeenCalledWith('MMM-Keyboard recognized a notification: KEYBOARD{"key":"test-key","style":"default","data":{"test":"data","foo":"bar"}}');
    expect(MMMKeyboard.log)
      .toHaveBeenCalledWith('Activating Keyboard!');
    expect(MMMKeyboard.current.key).toBe('test-key');
    expect(MMMKeyboard.current.data).toEqual({
      test: 'data',
      foo: 'bar',
    });
    expect(MMMKeyboard.keyboard.setOptions).toHaveBeenCalledWith({
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
    const oldSendNotification = MMMKeyboard.sendNotification;
    MMMKeyboard.sendNotification = jest.fn();
    MMMKeyboard.current = {
      key: 'test-key',
      data: { foo: 'bar' },
    };

    document.body.appendChild(MMMKeyboard.getDom());
    document.getElementById('kbInput').value = 'User input';

    MMMKeyboard.kbContainer.classList.add('show-keyboard');

    MMMKeyboard.sendInput();

    expect(MMMKeyboard.sendNotification)
      .toHaveBeenCalledWith('KEYBOARD_INPUT', {
        key: 'test-key',
        message: 'User input',
        data: {
          foo: 'bar',
        },
      });
    expect(MMMKeyboard.keyboard.clearInput).toHaveBeenCalled();
    expect(document.getElementById('kbInput').value).toBe('');
    expect(MMMKeyboard.shiftState).toBe(1);
    expect(MMMKeyboard.kbContainer.classList)
      .not.toContain('show-keyboard');

    MMMKeyboard.sendNotification = oldSendNotification;
  });
});

describe('onChange', () => {
  it('sets kbInput value', () => {
    document.body.appendChild(MMMKeyboard.getDom());

    MMMKeyboard.onChange('new value');

    expect(document.getElementById('kbInput').value).toBe('new value');
    expect(MMMKeyboard.log).toHaveBeenCalledWith('Input changed: new value');
  });

  it('sets shift state if input is empty', () => {
    const oldHandleShift = MMMKeyboard.handleShift;
    MMMKeyboard.handleShift = jest.fn();
    document.body.appendChild(MMMKeyboard.getDom());

    MMMKeyboard.onChange('');

    expect(MMMKeyboard.shiftState).toBe(1);
    expect(MMMKeyboard.handleShift).toHaveBeenCalled();

    MMMKeyboard.handleShift = oldHandleShift;
  });
});

describe('onKeyPress', () => {
  let oldHandleShift;
  let oldHandleNumbers;

  beforeEach(() => {
    oldHandleShift = MMMKeyboard.handleShift;
    oldHandleNumbers = MMMKeyboard.handleNumbers;
    MMMKeyboard.handleShift = jest.fn();
    MMMKeyboard.handleNumbers = jest.fn();
  });

  afterEach(() => {
    MMMKeyboard.handleShift = oldHandleShift;
    MMMKeyboard.handleNumbers = oldHandleNumbers;
  });

  describe('{shift}', () => {
    it('sets shiftState to 1 from 0', () => {
      MMMKeyboard.shiftState = 0;

      MMMKeyboard.onKeyPress('{shift}');

      expect(MMMKeyboard.shiftState).toBe(1);
      expect(MMMKeyboard.handleShift).toHaveBeenCalledWith('{shift}');
    });

    it('sets shiftState to 2 from 1', () => {
      MMMKeyboard.shiftState = 1;

      MMMKeyboard.onKeyPress('{shift}');

      expect(MMMKeyboard.shiftState).toBe(2);
      expect(MMMKeyboard.handleShift).toHaveBeenCalledWith('{shift}');
    });

    it('sets shiftState to 0 from 2', () => {
      MMMKeyboard.shiftState = 2;

      MMMKeyboard.onKeyPress('{shift}');

      expect(MMMKeyboard.shiftState).toBe(0);
      expect(MMMKeyboard.handleShift).toHaveBeenCalledWith('{shift}');
    });
  });

  describe('{lock}', () => {
    it('sets shiftState to 2 from 0', () => {
      MMMKeyboard.shiftState = 0;

      MMMKeyboard.onKeyPress('{lock}');

      expect(MMMKeyboard.shiftState).toBe(2);
      expect(MMMKeyboard.handleShift).toHaveBeenCalledWith('{lock}');
    });

    it('sets shiftState to 2 from 1', () => {
      MMMKeyboard.shiftState = 1;

      MMMKeyboard.onKeyPress('{lock}');

      expect(MMMKeyboard.shiftState).toBe(2);
      expect(MMMKeyboard.handleShift).toHaveBeenCalledWith('{lock}');
    });

    it('sets shiftState to 0 from 2', () => {
      MMMKeyboard.shiftState = 2;

      MMMKeyboard.onKeyPress('{lock}');

      expect(MMMKeyboard.shiftState).toBe(0);
      expect(MMMKeyboard.handleShift).toHaveBeenCalledWith('{lock}');
    });
  });

  describe('{numbers}', () => {
    it('calls handleNumbers', () => {
      MMMKeyboard.onKeyPress('{numbers}');

      expect(MMMKeyboard.handleNumbers).toHaveBeenCalled();
    });
  });

  describe('{backspace}', () => {
    it('calls handleNumbers', () => {
      MMMKeyboard.onKeyPress('{abc}');

      expect(MMMKeyboard.handleNumbers).toHaveBeenCalled();
    });
  });

  describe('{backspace}', () => {
    it('does nothing if there is still input', () => {
      document.getElementById('kbInput').value = 'something';

      MMMKeyboard.onKeyPress('{backspace}');

      expect(MMMKeyboard.handleShift).not.toHaveBeenCalled();
    });

    it('sets shift state and handles shift with value', () => {
      document.getElementById('kbInput').value = '';

      MMMKeyboard.onKeyPress('{backspace}');

      expect(MMMKeyboard.handleShift).toHaveBeenCalledWith('{backspace}');
      expect(MMMKeyboard.shiftState).toBe(1);
    });

    it('does nothing if not startUppercase', () => {
      MMMKeyboard.config.startUppercase = false;
      document.getElementById('kbInput').value = '';

      MMMKeyboard.onKeyPress('{backspace}');

      expect(MMMKeyboard.handleShift).not.toHaveBeenCalled();
    });
  });

  describe('anything else', () => {
    it('sets shiftState to 0 from 0', () => {
      MMMKeyboard.shiftState = 0;

      MMMKeyboard.onKeyPress('foobar');

      expect(MMMKeyboard.shiftState).toBe(0);
      expect(MMMKeyboard.handleShift).toHaveBeenCalledWith('foobar');
    });

    it('sets shiftState to 0 from 1', () => {
      MMMKeyboard.shiftState = 1;

      MMMKeyboard.onKeyPress('foobar');

      expect(MMMKeyboard.shiftState).toBe(0);
      expect(MMMKeyboard.handleShift).toHaveBeenCalledWith('foobar');
    });

    it('sets shiftState to 2 from 2', () => {
      MMMKeyboard.shiftState = 2;

      MMMKeyboard.onKeyPress('foobar');

      expect(MMMKeyboard.shiftState).toBe(2);
      expect(MMMKeyboard.handleShift).toHaveBeenCalledWith('foobar');
    });
  });
});
