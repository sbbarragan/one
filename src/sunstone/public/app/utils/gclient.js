/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

define(function(require) {
  /**
   * DEPENDENCIES
   */
  require("../../bower_components/guacamole-common-js/dist/guacamole-common")
  var Config = require("sunstone-config");
  var Notifier = require("utils/notifier");
  var Locale = require("utils/locale");

  /**
   * CONSTRUCTOR
   */
  function GClient() {
    this._display = null;
    this._client = null;
    this._mouse = null;
    this._keyboard = null;
    this._scale = 1;
    this._clientErrorText = Locale.tr("The OpenNebula service for remote console is not running, please contact your administrator.")

    return this;
  };

  GClient.prototype = {
    "connect": connect,
    "mouse": mouse,
    "keyboard": keyboard,
    "snapshot": getCanvas,
    "disconnect": disconnect,
  };

  return GClient;

  function setStatus(state = "") {
    $('#guacamole-state').text(state).animate();
  }

  function setErrorText(error = "") {
    $('#guacamole-error').text(error).animate();
  }

  function setLoading(isLoading = false) {
    $('#guacamole-loading')[isLoading ? 'fadeIn' : 'fadeOut']('fast');
  }

  function connect(response) {
    var that = this;
    
    if (!response.token) {
      Notifier.notifyError(this._clientErrorText)
      return null;
    }
    else setLoading(true);

    var port = Config.guacPort || '8080';
    var host = window.location.hostname;
    var wsprotocol = (window.location.protocol == 'https:') ? 'wss:' : 'ws:';

    var tunnel = new Guacamole.WebSocketTunnel(wsprotocol + '//' + host + ':' + port + '/guacamole')
    var guac = this._client = new Guacamole.Client(tunnel);

    // Client display
    this._display = $("#guacamole-display");
    this._display.html(this._client.getDisplay().getElement());

    // client error handler
    guac.onerror = function() {
      Notifier.notifyError(that._clientErrorText)
    };

    // websoket error handler
    tunnel.onerror = function() {
      Notifier.notifyError(that._clientErrorText)
    };

    guac.onstatechange = function(state) {
      switch (state) {
        case 0:
          setStatus("Client IDLE");
          setLoading(true);
        break;
        case 1:
          setStatus("Client CONNECTING");
          setLoading(true);
          break;
        case 2:
          setStatus("Client WAITING");
          setLoading(true);
          break;
        case 3:
          setStatus("Client CONNECTED");
          setLoading(false);
          rescale(that);
          guac.getDisplay().showCursor(false);
          break;
        case 4:
          setStatus("Client DISCONNECTING");
          setLoading(true);
          break;
        case 5:
          setStatus("Client DISCONNECTED");
          setLoading(false);
          break;
        default:
          setStatus("Client ERROR");
          setLoading(false);
          break;
      }
    }

    // Connect
    var params = [
      'token=' + response.token,
      'width=' + this._display.width()
    ];

    try {
      guac.connect(params.join('&'));
    } catch (error) {
      console.log(error)
    }

    // Disconnect on close
    window.onunload = function () {
      disconnect();
    };

    // Scale display when window resize
    $(window).resize(function () {
      rescale(that);
    });
  }

  /*
    GuacamoleWrapper.mouse
    - handles mouse interaction
   */
  function mouse(enable = true) {
    var that = this;
    if (!this._client) return;

    if (enable) {
      this._mouse = new Guacamole.Mouse(this._client.getDisplay().getElement());
      
      // apply sendState function
      this._mouse.onmousedown = 
      this._mouse.onmouseup   =
      this._mouse.onmousemove = function(mouseState) {
        mouseState.y =  mouseState.y / that._scale;
        mouseState.x =  mouseState.x / that._scale;
        that._client.sendMouseState(mouseState);
      };
    }
  }

  /*
    GuacamoleWrapper.keyboard
    - handles keyboard interaction
   */
  function keyboard(enable = true) {
    var that = this;
    if (!this._client) return;

    if (enable) {
      this._keyboard = new Guacamole.Keyboard(document);
      this._keyboard.onkeydown = function(keysym) {
        that._client.sendKeyEvent(1, keysym);
      }
      this._keyboard.onkeyup = function(keysym) {
        that._client.sendKeyEvent(0, keysym);
      }
    } else {
      this._keyboard.onkeydown = null;
      this._keyboard.onkeyup = null;
      this._keyboard = null;
    }
  }

  /*
    GuacamoleWrapper.getCanvas
    - shortcut for returning default guac layer (active tunnel viewport)
   */
  function getCanvas() {
    return (this._client) ? this._client.getDisplay().getDefaultLayer().getCanvas() : false;
  }

  function disconnect() {
    if (this._client) {
      this._client.disconnect();
      this._scale = 1;
      $(window).off('resize');
      setStatus()
      setErrorText()
    }
  }

  function rescale(thisContext) {
    var gclientDisplay = thisContext._client.getDisplay();

    //Get screen resolution.
    var origHeigth = Math.max(gclientDisplay.getHeight(), 1);
    var origWidth = Math.max(gclientDisplay.getWidth(), 1);
    
    var htmlWidth = thisContext._display.width();
    var htmlHeigth = thisContext._display.height();
    
    var xscale = htmlWidth / origWidth;
    var yscale = htmlHeigth / origHeigth;
    
    // This is done to handle both X and Y axis slacing
    var scale = Math.min(yscale, xscale);

    // Limit to 1
    scale = Math.min(scale, 1);

    if (scale !== 0) {
      thisContext._scale = scale;
      gclientDisplay.scale(thisContext._scale);
      
      // Set minimum height container display
      thisContext._display.css('min-height', gclientDisplay.getHeight());
    }
  }
});
