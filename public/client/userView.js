Shortly.UserView = Backbone.View.extend({
  className: 'user',
  model: Shortly.User,

  template: _.template("<span><%=Session['user']%></span>"),

  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});
