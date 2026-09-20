# MMM-Keyboard

![Example image](screenshot.png)

A module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/) that creates a virtual keyboard to be used to send commands or text to other modules

## Features
 * Touch Support
 * Locale Support (en and de)

## Installing

### Step 1 - Install the module

```js
cd ~/MagicMirror/modules
git clone https://github.com/JHWelch/MMM-Keyboard.git
cd MMM-Keyboard
npm install
```

### Step 2 - Add module to `config.js`

Add this configuration into your `config.js` file

```js
{
    module: "MMM-Keyboard",
    position: "fullscreen_above",
    config: {
        startWithNumbers: false,
        startUppercase: true,
        debug: false
    }
}
```

## Dependencies

* [simple-keyboard](https://www.npmjs.com/package/simple-keyboard)

## Updating

Go to the module’s folder `/MagicMirror/modules/MMM-Keyboard` and pull the latest version from GitHub:

```sh
git pull
npm install
```

## Configuration options

| Option             | type                   | default         | Description                                                                                            |
| ------------------ | ---------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `language`         | string                 | config.language | The language. You can override the MM settings here.                                                   |
| `alwaysShow`       | boolean                | false           | Always show keyboard.  **(not implemented yet)**                                                       |
| `startWithNumbers` | boolean                | false           | Start keyboard with 'numbers' layout                                                                   |
| `startUppercase`   | boolean                | true            | Always start with uppercase letters                                                                    |
| `debug`            | boolean                | false           | Debug mode for additional console output. Will also create a keyboard button to activate the keyboard. |
| `sendLabel`        | string                 | `'SEND!'`       | The label on the send button that will send the input back to the module.                              |
| `theme`            | `'default'\|'classic'` | `'default'`     | Keyboard theme to use. `'default'` is dark to match mirror, `'classic'` is the old repository theme.   |


# Working with the Keyboard

## Opening the keyboard

The keyboard works with MagicMirror's notification system. You can broadcast notifications from another module using the following parameters

```js
this.sendNotification("KEYBOARD", {
    key: "uniqueKey",
    style: "default",
    data: {},
});
```

The payload of the notification must be an object containing two parameters:  
`key`: You can use any unique key, it is advised to use the module name. MMM-Keyboard will take the key and send it back for the module to understand it.  
`style`: Use "default" or "numbers" here.  
`data`: Any data you want to transfer. E.g. if the keyboard input should be allocated to a certain element.  

## Receiving data

As soon as you hit the "SEND!"-Button the keyboard sends back the written content using the format

```js
this.sendNotification("KEYBOARD_INPUT", {
    key: "uniqueKey",
    message: "test",
    data: {}
});
```

The data object is the same you have send with your notification.  
You can fetch the message by checking for the `key` component. Here an example:

```js
notificationReceived : function (notification, payload) {
    if (notification == "KEYBOARD_INPUT" && payload.key === "uniqueKey") {
        console.log(payload.message);
    }
},
```

## THANKS

Thanks go to
- Francisco Hodge for his beautiful simple-keyboard npm module
- @jheyman for alpha testing :-)
- @lavolp3 for the original module
