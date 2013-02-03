function App () {
  
  var onLoadHandlers = {};
  var ajaxHandlers = {};
  var domBuilders = {};
  var partialViews = {};
  var helpers = {}; 
  var messages = {
    youAreHere: 'Buradasınız.'
  };   
  var params = {
    apiEndpoint: 'http://api.istanbus.org',
    defaultZoom: 8,
    stopDetailZoom: 15,
    closestStopsZoom: 14,
    maxZoom: 18,
    styleId: 998,
    tileLayerUrl: 'http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png',
    cloudMadeApiKey: '5f9a0dab187a45cf8688a68cb55680a2',
    defaultLatLon: [0,0],
    istanbulLatLon: [41.045311,29.034548]
  };
  var map;
  var mapLayers = {
    ui: {
      marker: {},
      popup: {},
    },
    vector: {
      circle: {}
    }
  }
  var routes = {
    search: {
      bus: function(id){return params.apiEndpoint + '/search/bus/' + id},
      stop: function(id){return params.apiEndpoint + '/search/stop/' + id}
    },
    solutions: {
      howtogo: function(from, to) {return params.apiEndpoint + '/howtogo/from/' + from + '/to/' +  to}
    },
    stop: {
      detail: function(id) {return params.apiEndpoint + '/stop/' + id},
      closest: function(lat, lon) {return params.apiEndpoint + '/closest/lat/' + lat + '/lon/' + lon}
    },
    bus: {
      detail: function(id) {return params.apiEndpoint + '/bus/' + id},
      timesheet: function(id) {return params.apiEndpoint + '/bus/' + id + '/timesheet'},
      stopsGo: function(id) {return params.apiEndpoint + '/bus/' + id + '/stops/go'},
      stopsCome: function(id) {return params.apiEndpoint + '/bus/' + id + '/stops/come'}
    }
  };

  this.init = function() {
    pageType = $('body').data('page-type');
    if (onLoadHandlers[pageType]) {
      onLoadHandlers[pageType].call();
    }
    onLoadHandlers.post();    
  };
  
  onLoadHandlers.post = function() {
    //
  };
    
  onLoadHandlers.searchStop = function() {
    ajaxHandlers.searchStop();
    helpers.initializeMap();
  };
  
  onLoadHandlers.closestStop = function() {
    helpers.initializeMap();
    helpers.locateUser();
  };
  
  onLoadHandlers.searchBus = function() {
    ajaxHandlers.searchBus();
    $(document).foundationAccordion();
  };
  
  ajaxHandlers.searchBus = function() {
    $('#busKeyword').keyup(function(event) {
      if (event.which == 13) {
        event.preventDefault();
      }
      var keyword = $(this).val().trim();
      $.get(routes.search.bus(keyword), domBuilders.searchBus);  
      }
    );
  };
  
  domBuilders.searchBus = function(results) {
    if (results.length > 0) {
      $('#busResults table tbody').empty();
      $('#noResultMessage').fadeOut();
      $('#busResults').slideDown();
      $('#busDetail').fadeOut();
      $.each(results, function(index, val) {
        $('#busResults table tbody').append(partialViews.stopDetails(val));
      });
      $('#busResults table tbody tr').click(function () {
        ajaxHandlers.busDetails($(this).data('busId'));
      });
    } else {
      $('#noResultMessage').fadeIn();      
    }
  };
  
  ajaxHandlers.busDetails = function(id) {
    $.get(routes.bus.detail(id), domBuilders.busDetails);
  };
  
  domBuilders.busDetails = function(result) {
    $('#busResults').fadeOut();
    $('#noResultMessage').fadeOut();
    $('#busDetail').slideDown();
    $('#stops tbody').empty();
    $('#timetableWeekdays tbody').empty();
    $('#timetableSaturday tbody').empty();
    $('#timetableSunday tbody').empty();
    for (var i=0; i < helpers.max(result.stops.go.length, result.stops.turn.length); i++) {
      $('#stops tbody').append(
        partialViews.busStopTableRow(helpers.checkUndefinedBus(result.stops.go[i]), helpers.checkUndefinedBus(result.stops.turn[i]))
      )
    };
    for (var i=0; i < helpers.max(result.timesheet.weekdays.go.length, result.timesheet.weekdays.turn.length); i++) {
      $('#timetableWeekdays tbody').append(
        partialViews.busTimeTableRow(helpers.checkUndefined(result.timesheet.weekdays.go[i]), helpers.checkUndefined(result.timesheet.weekdays.turn[i]))
      );
    };
    for (var i=0; i < helpers.max(result.timesheet.saturday.go.length, result.timesheet.saturday.turn.length); i++) {
      $('#timetableSaturday tbody').append(
        partialViews.busTimeTableRow(helpers.checkUndefined(result.timesheet.saturday.go[i]), helpers.checkUndefined(result.timesheet.saturday.turn[i]))
      );
    };
    for (var i=0; i < helpers.max(result.timesheet.sunday.go.length, result.timesheet.sunday.turn.length); i++) {
      $('#timetableSunday tbody').append(
        partialViews.busTimeTableRow(helpers.checkUndefined(result.timesheet.sunday.go[i]), helpers.checkUndefined(result.timesheet.sunday.turn[i]))
      );
    };
  };
  
  partialViews.busStopTableRow = function(go, turn) {
    return '<tr><td>' + go.name + '<span class="district">' + go.district + '</span></td><td>' + turn.name + '<span class="district">' + turn.district + '</span></td></tr>';
  };

  partialViews.busTimeTableRow = function(go, turn) {
    return '<tr><td>' + go + '</td><td>' + turn + '</td></tr>';
  };
  
  ajaxHandlers.searchStop = function() {
    $('#stopKeyword').keyup(function(event) {
      if (event.which == 13) {
        event.preventDefault();
      }
      var keyword = $(this).val().trim();
      $.get(routes.search.stop(keyword), domBuilders.searchStop);  
      }
    );
  };
  
  domBuilders.searchStop = function(results) {
    if (results.length > 0) {
      $('#stopResults table tbody').empty();
      $('#noResultMessage').fadeOut();
      $('#stopResults').slideDown();
      $('#stopDetail').fadeOut();
      $.each(results, function(index, val) {
        $('#stopResults table tbody').append(partialViews.searchStopResult(val));
      });
      $('#stopResults table tbody tr').click(function () {
        ajaxHandlers.stopDetails($(this).data('stopId'));
      });
    } else {
      $('#noResultMessage').fadeIn();      
    }
  };

  partialViews.searchStopResult = function(stop) {
    return '<tr data-stop-id=' + stop.id + '><td>' + stop.name + '</td></tr>';
  };

  ajaxHandlers.stopDetails = function(id) {
    $.get(routes.stop.detail(id), domBuilders.stopDetails);      
  };
  
  domBuilders.stopDetails = function(result) {
    map.setView(result.location, params.stopDetailZoom);
    L.Util.requestAnimFrame(map.invalidateSize, map, false, map._container);
    L.marker(result.location).addTo(map).bindPopup(result.name);
    $('#stopDetail table tbody').empty();    
    $('#stopInfo').html(partialViews.stopInfo(result));
    if (result.bus_list.length > 0) {
      $('#stopResults').slideUp();
      $('#stopDetail').fadeIn();
      $.each(result.bus_list, function(index, val) {
        $('#stopDetail table tbody').append(partialViews.stopDetails(val));
      });    
    };
    
  };

  partialViews.stopDetails = function(bus) {
    return '<tr data-bus-id=' + bus.id + '><td>' + bus.id + '</td><td>' + bus.name + '</td></tr>';
  };
  
  partialViews.stopInfo = function(stop) {
    return '<h3 class="subheader">' + stop.name  + ' durağından geçen otobüsler</h3>'
  };
  
  ajaxHandlers.closestStop = function(latlng) {
    $.get(routes.stop.closest(latlng.lat, latlng.lng), domBuilders.closestStop);
  };
  
  domBuilders.closestStop = function(results) {
    if (results.length > 0) {
      $('#stopResults').slideDown();
      $.each(results, function(index, val) {
        $('#stopResults table tbody').append(partialViews.searchStopResult(val));
        L.marker(val.location).addTo(map).bindPopup(val.name);
      }); 
      map.setZoom(params.closestStopsZoom);
    } else {
      $('#noResultMessage').fadeIn();
    }
  };
  
  domBuilders.closestStopFound = function(latlng, accuracy) {
    $('#gettingLocationMessage').hide();
    $('#locationFoundMessage span').text(parseInt(accuracy));
    $('#locationFoundMessage').fadeIn();
    L.circle(latlng, accuracy / 2).addTo(map);
    L.popup().setLatLng(latlng).setContent(messages.youAreHere).openOn(map);
  };

  domBuilders.closestStopError = function(payload) {
    $('#gettingLocationMessage').hide();
    $('#locationErrorMessage').fadeIn();
    map.setView(params.istanbulLatLon, params.defaultZoom);
  };

  helpers.initializeMap = function() {
    map = L.map('map').setView(params.defaultLatLon, params.defaultZoom);
    L.tileLayer(params.tileLayerUrl, {
        maxZoom: params.MaxZoom,
        key: params.cloudMadeApiKey,
        styleId: params.styleId
    }).addTo(map);
  };
    
  helpers.locateUser = function() {
    $('#gettingLocationMessage').show();
    map.locate({setView:true, enableHighAccuracy:true, maxZoom: params.maxZoom});
    map.on('locationfound', helpers.onLocationFound);
    map.on('locationerror', helpers.onLocationError);
  };
  
  helpers.onLocationFound = function(payload) {
    domBuilders.closestStopFound(payload.latlng, payload.accuracy);
    ajaxHandlers.closestStop(payload.latlng);
  };
  
  helpers.onLocationError = function(payload) {
    domBuilders.closestStopError(payload);
  };

  helpers.max = function(num1, num2) {
    if (num1 > num2) {return num1};
    return num2;
  };
  
  helpers.checkUndefinedBus = function(variable) {
    if (typeof variable === 'undefined') {
      return {
        name: '',
        district: ''
      };
    };
    return variable;
  };

  helpers.checkUndefined = function(variable) {
    if (typeof variable === 'undefined') {
      return '';
    };
    return variable;
  };

}

$.ajaxSetup({
  cache: false,
  dataType: 'json'
});

var app = new App();
app.init();