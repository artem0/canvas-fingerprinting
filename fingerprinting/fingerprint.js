  'use strict';

  var Fingerprint = function (options) {
    var nativeForEach, nativeMap;
    nativeForEach = Array.prototype.forEach;
    nativeMap = Array.prototype.map;

    this.each = function (obj, iterator, context) {
      if (obj === null) {
        return;
      }
      if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
      } else if (obj.length === +obj.length) {
        for (var i = 0, l = obj.length; i < l; i++) {
          if (iterator.call(context, obj[i], i, obj) === {}) return;
        }
      } else {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (iterator.call(context, obj[key], key, obj) === {}) return;
          }
        }
      }
    };

    this.map = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
      this.each(obj, function(value, index, list) {
        results[results.length] = iterator.call(context, value, index, list);
      });
      return results;
    };

    if (typeof options == 'object'){
      //Overloading for passing draw or now some data on canvas - good for demonstration purposes
      this.hasher = options.hasher;
      this.canvas = options.canvas;
    } else if(typeof options == 'function'){
      //Overloading for custom hash functions
      this.hasher = options;
    }
  };

  Fingerprint.prototype = {
    get: function(){
      var keys = [];
      keys.push(navigator.userAgent);
      keys.push(navigator.language);
      keys.push(screen.colorDepth);
      keys.push(this.getScreenResolution().join('x'));
      keys.push(new Date().getTimezoneOffset());
      keys.push(this.hasSessionStorage());
      keys.push(this.hasLocalStorage());
      keys.push(this.hasIndexDb());
      //body might not be defined at this point or removed programmatically
      if(document.body){
        keys.push(typeof(document.body.addBehavior));
      } else {
        keys.push(typeof undefined);
      }
      keys.push(typeof(window.openDatabase));
      keys.push(navigator.cpuClass);
      keys.push(navigator.platform);
      keys.push(navigator.doNotTrack);
      keys.push(this.getPluginsString());
      if(this.canvas && this.isCanvasSupported()){
        keys.push(this.getCanvasFingerprint());
      }
      if(this.hasher){
        return this.hasher(keys.join('###'), 31);
      } else {
        return murmurhash3_32_gc(keys.join('###'), 31);
      }
    },

      /**
       * If catch SecurityError, it means it exists
       * @returns {boolean} has local storage
       */
    hasLocalStorage: function () {
      try{
        return !!window.localStorage;
      } catch(e) {
        return true;
      }
    },

      /**
       * If catch SecurityError, it means it exists
       * @returns {boolean} has session storage
       */
    hasSessionStorage: function () {
      try{
        return !!window.sessionStorage;
      } catch(e) {
        return true;
      }
    },

      /**
       * If catch SecurityError, it means it exists
       * @returns {boolean} has IndexDb
       */
    hasIndexDb: function () {
      try{
        return !!window.indexedDB;
      } catch(e) {
        return true;
      }
    },

    isCanvasSupported: function () {
      var elem = document.createElement('canvas');
      return !!(elem.getContext && elem.getContext('2d'));
    },

    isIE: function () {
      if(navigator.appName === 'Microsoft Internet Explorer') {
        return true;
      } else if(navigator.appName === 'Netscape' && /Trident/.test(navigator.userAgent)){
        return true;
      }
      return false;
    },

    getPluginsString: function () {
      if(this.isIE()){
        return this.getIEPluginsString();
      } else {
        return this.getRegularPluginsString();
      }
    },

    getRegularPluginsString: function () {
      return this.map(navigator.plugins, function (p) {
        var mimeTypes = this.map(p, function(mt){
          return [mt.type, mt.suffixes].join('~');
        }).join(',');
        return [p.name, p.description, mimeTypes].join('::');
      }, this).join(';');
    },

      /**
       * Fetch plugins specific to IE
       */
    getIEPluginsString: function () {
      if(window.ActiveXObject){
        var names = ['ShockwaveFlash.ShockwaveFlash',
          'AcroPDF.PDF',
          'PDF.PdfCtrl',
          'QuickTime.QuickTime',
          'rmocx.RealPlayer G2 Control',
          'rmocx.RealPlayer G2 Control.1',
          'RealPlayer.RealPlayer(tm) ActiveX Control (32-bit)',
          'RealVideo.RealVideo(tm) ActiveX Control (32-bit)',
          'RealPlayer',
          'SWCtl.SWCtl',
          'WMPlayer.OCX',
          'AgControl.AgControl', // Silverlight
          'Skype.Detection'];

        return this.map(names, function(name){
          try{
            new ActiveXObject(name);
            return name;
          } catch(e){
            return null;
          }
        }).join(';');
      } else {
        return "";
      }
    },

    getScreenResolution: function () {
        return (screen.height > screen.width) ? [screen.height, screen.width] : [screen.width, screen.height];
    },

    getCanvasFingerprint: function () {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      // https://www.browserleaks.com/canvas#how-does-it-work
      var txt = 'CANVAS_FINGERPRINT';
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125,1,62,20);
      ctx.fillStyle = "#069";
      ctx.fillText(txt, 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText(txt, 4, 17);
      return canvas.toDataURL();
    }
  };