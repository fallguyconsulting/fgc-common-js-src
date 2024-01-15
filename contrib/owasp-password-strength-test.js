// The MIT License (MIT)

// Copyright (c) 2014 viaForensics, LLC

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// https://github.com/nowsecure/owasp-password-strength-test

/* globals define */
(function (root, factory) {
  
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.owaspPasswordStrengthTest = factory();
  }

  }(this, function () {

    var owasp = {};

    // These are configuration settings that will be used when testing password
    // strength
    owasp.configs = {
      allowPassphrases       : true,
      maxLength              : 128,
      minLength              : 10,
      minPhraseLength        : 20,
      minOptionalTestsToPass : 4,
    };

    // This method makes it more convenient to set config parameters
    owasp.config = function(params) {
      for (var prop in params) {
        if (Object.prototype.hasOwnProperty.call(params, prop) && Object.prototype.hasOwnProperty.call(this.configs, prop)) {
          this.configs[prop] = params[prop];
        }
      }
    };

    // This is an object containing the tests to run against all passwords.
    owasp.tests = {

      // An array of required tests. A password *must* pass these tests in order
      // to be considered strong.
      required: [

        // enforce a minimum length
        function(password) {
          if (password.length < owasp.configs.minLength) {
            return 'The password must be at least ' + owasp.configs.minLength + ' characters long.';
          }
        },

        // enforce a maximum length
        function(password) {
          if (password.length > owasp.configs.maxLength) {
            return 'The password must be fewer than ' + owasp.configs.maxLength + ' characters.';
          }
        },

        // forbid repeating characters
        function(password) {
          if (/(.)\1{2,}/.test(password)) {
            return 'The password may not contain sequences of three or more repeated characters.';
          }
        },

      ],

      // An array of optional tests. These tests are "optional" in two senses:
      //
      // 1. Passphrases (passwords whose length exceeds
      //    this.configs.minPhraseLength) are not obligated to pass these tests
      //    provided that this.configs.allowPassphrases is set to Boolean true
      //    (which it is by default).
      //
      // 2. A password need only to pass this.configs.minOptionalTestsToPass
      //    number of these optional tests in order to be considered strong.
      optional: [

        // require at least one lowercase letter
        function(password) {
          if (!/[a-z]/.test(password)) {
            return 'The password must contain at least one lowercase letter.';
          }
        },

        // require at least one uppercase letter
        function(password) {
          if (!/[A-Z]/.test(password)) {
            return 'The password must contain at least one uppercase letter.';
          }
        },

        // require at least one number
        function(password) {
          if (!/[0-9]/.test(password)) {
            return 'The password must contain at least one number.';
          }
        },

        // require at least one special character
        function(password) {
          if (!/[^A-Za-z0-9]/.test(password)) {
            return 'The password must contain at least one special character.';
          }
        },

      ],
    };

    // This method tests password strength
    owasp.test = function(password) {

      // create an object to store the test results
      var result = {
        errors              : [],
        failedTests         : [],
        passedTests         : [],
        requiredTestErrors  : [],
        optionalTestErrors  : [],
        isPassphrase        : false,
        strong              : true,
        optionalTestsPassed : 0,
      };

      // Always submit the password/passphrase to the required tests
      var i = 0;
      this.tests.required.forEach(function(test) {
        var err = test(password);
        if (typeof err === 'string') {
          result.strong = false;
          result.errors.push(err);
          result.requiredTestErrors.push(err);
          result.failedTests.push(i);
        } else {
          result.passedTests.push(i);
        }
        i++;
      });

      // If configured to allow passphrases, and if the password is of a
      // sufficient length to consider it a passphrase, exempt it from the
      // optional tests.
      if (
        this.configs.allowPassphrases === true &&
        password.length >= this.configs.minPhraseLength
      ) {
        result.isPassphrase = true;
      }

      if (!result.isPassphrase) {
        var j = this.tests.required.length;
        this.tests.optional.forEach(function(test) {
          var err = test(password);
          if (typeof err === 'string') {
            result.errors.push(err);
            result.optionalTestErrors.push(err);
            result.failedTests.push(j);
          } else {
            result.optionalTestsPassed++;
            result.passedTests.push(j);
          }
          j++;
        });
      }

      // If the password is not a passphrase, assert that it has passed a
      // sufficient number of the optional tests, per the configuration
      if (
        !result.isPassphrase &&
        result.optionalTestsPassed < this.configs.minOptionalTestsToPass
      ) {
        result.strong = false;
      }

      // return the result
      return result;
    };

    return owasp;
  }
));