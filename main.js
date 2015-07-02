"use strict";

var wpcom = require('wpcom'),
    oauth = require('wpcom-oauth-cors')('41347'),
    googleMaps = require('google-maps-api')('AIzaSyA2kZ5n41fm5NaBSvdcCXSWO_Exq0smQRI'),
		_     = require('lodash'),
		q     = require('q'),
		mapCanvas,
		mapMarkers = [],
		mapBounds = false,
		mapInfoWindow;

// Request auth to a blog so we can get posts and map them
oauth.get(function(auth) {
	var wpc = wpcom(auth.access_token),
		  mySite = wpc.site(auth.site_id),
			posts = [],
			mapsReady = q.defer();

	// Start loading the maps, because they're slow
	googleMaps().then( function() {
		// Initiate fullscreen map
		var mapOptions = {
			zoom: 3,
			center: new google.maps.LatLng(39.7391500, -104.9847000) // Hey, Denver!
	  };
	  mapCanvas = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

		// Indicate our map is ready for markers
		mapsReady.resolve();
	} );

	// Get a batch of postsList
  mySite.postsList({ number: 50, fields: "author,URL,title,geo" }, function(err, list) {
		if (!err) {
			// Extract out just the posts with geo data
			posts  = _.filter(list.posts, function(p){
				return _.has(p, "geo.latitude") && _.has(p, "geo.longitude");
			});

			mapsReady.promise.then(function(){
				// Map each post, dropping them into place on a staggered timescale
				_.each(posts, function(post,i){
					setTimeout(function(){
						addPostMarkerWithInfo(post,mapCanvas);
					}, i * 100);
				});

				// Create an InfoWindow that we can reference later
				mapInfoWindow = new google.maps.InfoWindow();
			});
		}
	});
});

function addPostMarkerWithInfo(post, map) {
	var marker = new google.maps.Marker({
    map: map,
    animation: google.maps.Animation.DROP,
    position: new google.maps.LatLng(post.geo.latitude, post.geo.longitude)
  });
	mapMarkers.push(marker);

	// Create an infowindow with the details for the post (marker) that was clicked
	google.maps.event.addListener(marker, 'click', function(){
		mapInfoWindow.setContent(getInfoStringFromPost(post));
		mapInfoWindow.open(map, marker);
	});
}

function getInfoStringFromPost(post) {
	return '<div class="infowin">'+
					'<img src="' + post.author.avatar_URL + '" width="96" height="96" style="border-radius: 50%; margin-right: 1em;" align="left" />'+
					'<h1><a href="' + post.URL + '" target="_blank">' + post.title + '</a></h1>'+
					'<h2>' + post.geo.address + '</h2>'+
				'</div>';
}
