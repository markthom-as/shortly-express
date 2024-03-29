var db = require('../config');
var Click = require('./click');
var User = require('./user');
var crypto = require('crypto');

var Link = db.Model.extend({
  tableName: 'urls',
  user_id: function () {
    return this.belongsTo(User);
  },
  hasTimestamps: true,
  defaults: {
    visits: 0
  },

  clicks: function() {
    return this.hasMany(Click);
  },
  initialize: function(){
    this.on('creating', function(model, attrs, options){
      var shasum = crypto.createHash('sha1');
      shasum.update(model.get('url') + model.get('user_id'));
      model.set('code', shasum.digest('hex').slice(0, 5));
    });
  }
});

module.exports = Link;
