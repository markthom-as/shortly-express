var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  login: function(password) {
    return bcrypt.compare(this.get('password'), password);
  }
});


module.exports = User;
