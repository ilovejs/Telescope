Template.post_item.preserve({
  '.post': function (node) {return node.id; }
});


Template.post_item.helpers({
  currentPost: function(){
    console.log(this);
    return this;
  },
  rank: function() {
    return this._rank + 1;
  },
  showRank: function(){
    return Session.get('isPostsList');
  },
  domain: function(){
    var a = document.createElement('a');
    a.href = this.url;
    return a.hostname;
  },
  current_domain: function(){
    return "http://"+document.domain;
  },
  can_edit: function(){
    return canEdit(Meteor.user(), this);
  },
  authorName: function(){
    return getAuthorName(this);
  },
  short_score: function(){
    return Math.floor(this.score*1000)/1000;
  },
  body_formatted: function(){
    var converter = new Markdown.Converter();
    var html_body=converter.makeHtml(this.body);
    return html_body.autoLink();
  },
  ago: function(){
    // if post is approved show submission time, else show creation time. 
    time = this.status == STATUS_APPROVED ? this.submitted : this.createdAt;
    return moment(time).fromNow();
  },
  timestamp: function(){
    time = this.status == STATUS_APPROVED ? this.submitted : this.createdAt;
    return moment(time).format("MMMM Do, h:mm:ss a");
  },
  voted: function(){
    var user = Meteor.user();
    if(!user) return false; 
    return _.include(this.upvoters, user._id);
  },
  userAvatar: function(){
    if(author=Meteor.users.findOne(this.userId))
      return getAvatarUrl(author);
  },
  inactiveClass: function(){
    return (isAdmin(Meteor.user()) && this.inactive) ? "inactive" : "";
  }
});

Template.post_item.rendered = function(){
  var self = this;
  var rank = self.data._rank;
  var $this = $(this.find(".post"));

  if(self.data){
    var distanceFromTop= 0;
    for(var i=1; i<=rank; i++){
      distanceFromTop+= $('.post-'+i).height();
    }
    
    // if this is the first rendering, just go straight to the correct spot,
    // and don't animate our way there.
    if (_.isUndefined(self.current_distance)) {
      self.current_distance = distanceFromTop;
      $this.css("top", self.current_distance + "px");
      
    // otherwise, stay in the old spot, but once the browser has rendered
    // us there, animate to a new spot
    } else {
      $this.css("top", self.current_distance + "px");
      
      Meteor.defer(function() {
        self.current_distance = distanceFromTop;
        $this.addClass('animate').css("top", self.current_distance + "px");
      });
    }
  }
};

Template.post_item.events = {
  'click .upvote-link': function(e, instance){
    var post = this;
    e.preventDefault();
      if(!Meteor.user()){
        Meteor.Router.to('/signin');
        throwError("Please log in first");
      }
      Meteor.call('upvotePost', post._id, function(error, result){
        trackEvent("post upvoted", {'_id': post._id});
      });
  }
  , 'click .share-link': function(e){
      var $this = $(e.target).parents('.post-share').find('.share-link');
      var $share = $this.parents('.post-share').find('.share-options');
      e.preventDefault();
      $('.share-link').not($this).removeClass("active");
      $(".share-options").not($share).addClass("hidden");
      $this.toggleClass("active");
      $share.toggleClass("hidden");
      $share.find('.share-replace').sharrre(SharrreOptions);
  }
};