isInline = [];

$.each(cargo, function(key, value){
  if(value.iframe === false){
    isInline.push(value.airline);
  }
});

//might need to use this soon: http://www.cargoupdate.com/tracktrace/loaddata.aspx?carrier=CX&awb=160-42079892

tracePrefix ="http://cargoserv.champ.aero/trace/trace.asp?",
carrierCode = '',
carrierQS = '',
trace = '',
shipmentText = '',
myHistory = JSON.parse(localStorage.getItem('myHistoryInfo')) || [];


$('.test').on('click', function(e){
  e.preventDefault();
  $('.trackingForm').trigger('submit');
  var $frame = $('#tracking-frame'),
      $load = $('#load');

  $load.removeClass('active');
  $frame.addClass('active');
});


$('#search').on('submit', function(e){
  e.preventDefault();

      var $this = $('.search'),
          $fullNumber = $this.val(),
          $load = $('#load'),
          $frame = $('#tracking-frame'),
          $firstThree = $this.val().slice(0,3),
          $lastEight = $this.val().slice(3,11),
          $code = '';

          //_gaq.push(['_trackEvent', 'Tracking Number', $fullNumber]);
          window.ga('send', 'event', 'Submit', 'Tracking Number', $fullNumber, { 'nonInteraction': 1 });

          $('.page-loader').addClass('active');

      if($.inArray($firstThree, isInline) > -1){
        console.log('inline');

        $.each(cargo, function(key, value){
          if(value.airline === $firstThree){
            $code = value.code;
            $('.friendly-name').text(value.name);
          }
        });

        carrierQS = "Carrier=" + $code;
        shipmentText = "&Shipment_text=" + $this.val();

        path = tracePrefix + carrierQS + shipmentText + "&Header=no&Site=CservWidth=800&Height=400";

        requestCrossDomain(path, $code, $firstThree, $lastEight, function(results){
          $load.addClass('active');
          $frame.removeClass('active');

          $('#load').html(results);
          $('.page-loader').removeClass('active');
        });

      } else{
        console.log('iframe');
        var airlineCode = $fullNumber.slice(0,3),
            cargoNumber = $fullNumber.slice(3,11);
        lookupIframe(airlineCode, cargoNumber);
      }



      //save to local storage...
      if(typeof(Storage) !== "undefined") {

        myHistory.push({fullNumber: $fullNumber});

        localStorage.setItem('myHistoryInfo', JSON.stringify(myHistory));


        var addToMyHistory = function ($fullNumber){
          var myHistory = JSON.parse(localStorage.getItem('myHistoryInfo') || []);
          myHistory.push({
            fullNumber: $fullNumber
          });

          localStorage.setItem('myHistoryInfo', JSON.stringify(myHistory));
        }

      } else {
        // Sorry! No Web Storage support..
      }

      //Now retreive and display it...
      getHistory();

});

$(document).on('click', '#myHistory span', function(e){
  var $this = $(this);
  $('.search').val($this.text());
  lookupAirlines($this.text().slice(0,3));
  $('#search').trigger('submit');

  $('.recent-container').slideUp(function(){

  });
});




$('.searchHistoryNav').off('click').on('click', function (e) {
  e.preventDefault();
  $('.recent-container').slideToggle(function(){

  });
});



function getHistory(){
  $('#myHistory').empty();

  var getMyHistory  = localStorage.getItem("myHistoryInfo"),
      retrievedHistory = JSON.parse(getMyHistory),
      historyText = '';

      $.each(retrievedHistory, function(key, value){
        if(key === 0){
          $('#myHistory').append('<span>'+ value.fullNumber + '</span>');
        } else{
          $('#myHistory').append(', <span>'+ value.fullNumber + '</span>');
        }
      });

      $('#myHistory').text().slice(2);

}


function requestCrossDomain(site, code, airlineCode, cargoNumber, callback){


  if(!site){
    alert('No site was passed.');
    return false;
  }

  //https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D'www.google.com'&diagnostics=true

  var yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + site + '"') + '&format=xml&callback=?';

  console.log('yql:', yql);
  //https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Fcargoserv.champ.aero%2Ftrace%2Ftrace.asp%3FCarrier%3DAA%26Shipment_text%3D00179938935%26Header%3Dno%26Site%3DCserv%22&format=xml&callback=


  $.getJSON(yql, function(data){

    console.log('data.results[0]:', data.results[0]);

    if(data.results[0]){
      data = data.results[0].replace(/<script[^>]*>[\s\S]*?<\/script>/, '');

      if(typeof callback === 'function'){
        callback(data);
      }
    }

    else{
      console.log('Nothing returned from getJSON.');

      var $frame = $('#tracking-frame'),
          $load = $('#load');

      $('.trackingForm').remove();

      $load.removeClass('active');

      //load the iframe of the site since there's problems with the damn service...
      //$('.data-container').appendTo()
      //first load the html file... aa.html, then when done, trigger submit.
      $.ajax({
        url: 'forms/'+code+'.html',
        success: function(data){
          console.log('inside load...');
          console.log('data...', data);
          $(data).appendTo('.data-container');
          $('.data-container').find('.airlineCode').val(airlineCode);
          $('.data-container').find('.cargoNumber').val(cargoNumber);
          $('.trackingForm').trigger('submit');
          $frame.addClass('active');
        }
      });

    }

    $('.page-loader').removeClass('active');

  });
}



function lookupIframe(airlineCode, cargoNumber){
  console.log('ac:', airlineCode);
  console.log('cn:', cargoNumber);

  var $frame = $('#tracking-frame'),
      $load = $('#load');

  $('.trackingForm').remove();

  $.each(cargo, function(key,value) {
    if(value.airline === airlineCode){
      var $code = value.code,
          $direct = (value.direct),
          $combinedCodes = (value.combined),
          $combinedCodesConcat = (value.combinedConcat);
          console.log('DIRECT?', $direct);
          console.log('COMBINED?', $combinedCodes);
          console.log('COMBINED CONCAT?', $combinedCodesConcat);

      //if directiframe=true, then this and return
      if($direct){
        $frame.attr('src', value.url1 + airlineCode + value.url2 + cargoNumber);
        $load.removeClass('active');
        $frame.addClass('active');
        $('.friendly-name').text(value.name);
        return;
      }


      $.ajax({
        url: 'forms/'+$code+'.html',
        success: function(data){
          console.log('inside load...');
          console.log('data...', data);
          $(data).appendTo('.data-container');

          //if combinedvalues
          if($combinedCodes){
            $('.data-container').find('.combined').val(airlineCode+'-'+cargoNumber);
          } else if($combinedCodesConcat){
            $('.data-container').find('.combinedConcat').val(airlineCode+cargoNumber);
          }else{
            //input airlinecode and cargonumber in place, then submit...
            $('.data-container').find('.airlineCode').val(airlineCode);
            $('.data-container').find('.cargoNumber').val(cargoNumber);
          }

          $('.trackingForm').trigger('submit');
        }
      });

      $load.removeClass('active');
      $frame.addClass('active');
      $('.friendly-name').text(value.name);
      return;
    }
  });

  $('.page-loader').removeClass('active');

}


$('.search').off('keyup').on('keyup', function(e){
  var $this = $(this);

  if ($this.val().length >= 3){
    lookupAirlines($this.val().slice(0,3));
  }

});



function lookupAirlines(code3){
  $.each(cargo, function(key, value){
    if(code3 === value.airline){

      $('.search').css({
          'background-image': 'url('+value.img+')'
      });
    }
  });

}

$(function(){
  if(typeof(Storage) !== "undefined") {
    getHistory();
  }
});
