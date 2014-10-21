// inicializacion

document.addEventListener("deviceready", onDeviceReady, false);

var $$ = Dom7;
var myApp = new Framework7({
  //modal para el chat plugin
  modalTitle: 'Welcome',
  animateNavBackIcon: true //swipePanel: 'left'
});

//Esta variable es usada tanto por el plugin de login como por el plugin de chat
var username, avatar = false,
  social = "";

initLogin();
initViews();
initLogout();




function initViews() {
  //vista latest tweets
  var view1 = myApp.addView('#view-tweets');
  //vista mapa
  var view2 = myApp.addView('#view-mapa');
  //Vista de speakers
  var view3 = myApp.addView('#view-speakers', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    /*Necesito que la navbar sea dinamica en esta view para poder cambiarla al entrar en las subpaginas*/
    dynamicNavbar: true
  });
  //vista de Chat
  var view4 = myApp.addView('#view-chat');
  //vista agenda
  var view5 = myApp.addView('#view-agenda', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    /*Necesito que la navbar sea dinamica en esta view para poder cambiarla al entrar en las subpaginas*/
    dynamicNavbar: true
  });
  //vista about
  var view6 = myApp.addView('#view-about');
  //vista homepage
  var view7 = myApp.addView('#view-home');

  var view8 = myApp.addView('#view-chatRooms');

  initChat();
  initAgenda(view5);
  initSpeakers(view3);
  initMapa();
  initTweetFeed();
}

function initChat() {
  /*JS CHAT*/

  //instancio la base de datos de mensajes
  var currentRoomDB;
  var roomsDB = new Firebase("https://shovelChat.firebaseio.com/Rooms");
  var lastDate,
    roomsList, roomsLoaded = false,
    currentRoom;

  // Format date
  function formatDay(d) {
    var date = new Date(d);
    var weekDay = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' ')[date.getDay()];
    var day = date.getDate();
    var month = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[date.getMonth()];
    return weekDay + ', ' + month + ' ' + day;
  }

  function formatTime(d) {
    var date = new Date(d);
    var hours = date.getHours();
    if (hours < 10) hours = '0' + hours;
    var mins = date.getMinutes();
    if (mins < 10) mins = '0' + mins;
    return hours + ':' + mins;
  }

  function formatDate(d) {
    return formatDay(d) + ', <span>' + formatTime(d) + '</span>';
  }


  function stripMessage(messageText) {
    if (!(messageText.indexOf('<img') === 0 && messageText.split('<').length === 2)) {
      messageText = messageText.replace(/>/g, '&gt;').replace(/</g, '&lt;');
    }
    messageText.replace(/script/g, 'scr\bipt');
    return messageText;
  }

  // Receive message
  function receiveMessage(snapshot) {

    var message = snapshot.val();
    if (message.name === username) return;
    var date = new Date();
    var offset = date.getTimezoneOffset() * 60 * 1000;
    date = date.getTime() + offset;

    var day, time;

    if (!lastDate || (lastDate && date - lastDate > 1000 * 60 * 5)) {
      day = formatDay(date);
      time = formatTime(date);
      lastDate = date;
    }

    myApp.addMessage({
      text: stripMessage(message.message),
      type: 'received',
      name: message.name,
      avatar: message.avatar,
      day: day,
      time: time
    });

  }

  //Load message
  function loadMessages(snapshot) {
    var messages = snapshot.val();
    var html = '',
      messageId, message;
    for (messageId in messages) {
      message = messages[messageId];
      if (message.date && lastDate) {
        if (message.date - lastDate > 1000 * 60 * 5) {
          html += '<div class="messages-date">' + formatDate(message.date) + '</div>';
        }
      }
      var messageText = stripMessage(message.message);
      if (message.name === username) {
        html += '<div class="message message-sent"><div class="message-name">' + message.name + '</div><div class="message-text">' + messageText + '</div>' + (message.avatar ? '<div class="message-avatar" style="background-image:url(' + (message.avatar) + ')"></div>' : '') + '</div>';
      } else {
        html += '<div class="message message-received"><div class="message-name">' + message.name + '</div><div class="message-text">' + messageText + '</div>' + (message.avatar ? '<div class="message-avatar" style="background-image:url(' + (message.avatar) + ')"></div>' : '') + '</div>';
      }
      if (message.date) lastDate = message.date;
    }
    $('.messages-content .messages').html(html);
    myApp.initMessages('.page[data-page="messages"]');
  }


  // Send message
  $$('.messagebar a.link').on('click', function() {
    var textarea = $$('.messagebar textarea');
    var messageText = textarea.val();
    if (messageText.length === 0) return;
    textarea.val('').trigger('change');
    var date = new Date();
    var offset = date.getTimezoneOffset() * 60 * 1000;
    date = date.getTime() + offset;
    var day, time;
    if (!lastDate || (lastDate && date - lastDate > 1000 * 60 * 5)) {
      day = formatDay(date);
      time = formatTime(date);
      lastDate = date;
    }
    currentRoomDB.push({
      name: username,
      message: messageText,
      avatar: avatar,
      date: date
    });

    // Add Message
    myApp.addMessage({
      text: stripMessage(messageText),
      type: 'sent',
      name: username,
      avatar: avatar,
      day: day,
      time: time
    });

  });

  //Send photo
  $$('#sendPhoto').on('click', function() {
    myApp.prompt('Enter your image URL', function(data) {
      var messageText = '<img src="' + data + '">';
      var date = new Date();
      var offset = date.getTimezoneOffset() * 60 * 1000;
      date = date.getTime() + offset;
      var day, time;
      if (!lastDate || (lastDate && date - lastDate > 1000 * 60 * 5)) {
        day = formatDay(date);
        time = formatTime(date);
        lastDate = date;
      }
      currentRoomDB.push({
        name: username,
        message: messageText,
        avatar: avatar,
        date: date
      });
      myApp.addMessage({
        text: messageText,
        type: 'sent',
        name: username,
        avatar: avatar,
        day: day,
        time: time
      });
      lastDate = date;
    });
  });


  /*En el evento show de la pantalla de chat muestro un alert con los datos del usuario*/
  $$('#view-chat').on('show', function() {
    if (username === undefined) {
      myApp.alert('please log in');
    } else {
      myApp.alert('you are logged in as ' + username);
      var messagesLoaded = false; //controlo con esta variable por que funcion paso el msj (carga inicial vs carga individual)
      if (currentRoomDB) {
        //limpio los listeners para que no se me acumulen cada vez que muestro la pantalla
        currentRoomDB.off();
      }
      //establesco la sala actual
      currentRoomDB = new Firebase("https://shovelChat.firebaseio.com/Rooms/" + currentRoom);
      //limito los mensajes que traigo a 10
      var queryLimited = currentRoomDB.limit(10);
      //por cada msj que traiga despues de la carga inicial 
      queryLimited.on("child_added", function(snapshot) {
        if (!messagesLoaded) return;
        receiveMessage(snapshot);
      });
      //realizo el render de los msj traidos al inicio
      queryLimited.on("value", function(snapshot) {
        if (messagesLoaded) return;
        loadMessages(snapshot);
        messagesLoaded = true;
      });
      //scrolleo hasta el ultimo msj
      myApp.scrollMessagesContainer();
      return;
    }
    myApp.loginScreen();
  });


  //Armado de listado de salas

  roomsDB.on("value", function(snapshot) {
    //solo lo realizo una vez (carga desde la base)
    if (!roomsLoaded) {
      roomsList = Object.keys(snapshot.val());
      for (var index in roomsList) {
        var li =
          '<li>' +
          '   <a href="#view-chat" data-src=' + roomsList[index] + ' class="item-link tab-link chatRoomItem">' +
          '       <div class="item-content">' +
          '           <div class="item-inner">' +
          '                   <div class="item-title">' + roomsList[index] + '</div>' +
          '           </div>' +
          '        </div>' +
          '    </a>' +
          '</li>';
        $$('.roomsList').append(li);
      }
      $$('.chatRoomItem').on('click', function() {
        if (currentRoom !== this.getAttribute("data-src")) {
          currentRoom = (this.getAttribute("data-src"));
          $$('.messages').html("");
          $$('.roomTitle').html(currentRoom);
        }
      });
      roomsLoaded = true;
    }

  });


}




function initSpeakers(view) {
  /*JS SPEAKERS*/

  //Cargo el listado de speakers
  var speakers = [];
  $.getJSON("./speakers.json", function(data) {
    speakers = data;

    armarListaSpeakers();
  });

  //Armo la lista de speakers
  function armarListaSpeakers() {
    for (var index in speakers) {
      var li =
        '<li class="contact-item">' +
        '   <a href="#" data-src=' + speakers[index].Id + ' class="item-link create-page-speaker">' +
        '       <div class="item-content">' +
        '            <div class="item-media">' +
        '                <img src=' + speakers[index].ProfilePic + ' width="44">' +
        '           </div>' +
        '           <div class="item-inner">' +
        '               <div class="item-title-row">' +
        '                   <div class="item-title">' + speakers[index].Name + '</div>' +
        '                </div>' +
        '                <div class="item-subtitle">' + speakers[index].Company + '</div>' +
        '            </div>' +
        '        </div>' +
        '    </a>' +
        '</li>';
      $$('.listaSpeakers').append(li);
    }
    //Agrego la funcion de crear la página con el detalle del speaker al clickear en el mismo
    $$('.create-page-speaker').on('click', function() {
      createContentPageSpeaker(this.getAttribute("data-src"));
    });
  }

  // GENERO LA PAGINA CON EL DETALLE DEL SPEAKER DINAMICAMENTE
  function createContentPageSpeaker(id) {
    //index-1 porque en el json arranco los id desde el 1
    var index = id - 1;
    //Cargo la página dinamica en la vista correspondiente
    view.loadContent(
      //le agrego un nuevo navbar que contenga boton back.
      '<!-- Top Navbar-->' +
      '<div class="navbar">' +
      '  <div class="navbar-inner">' +
      '    <div class="left"><a href="#" class="back link"><i class="icon icon-back"></i><span>Back</span></a></div>' +
      '    <div class="center">Speakers</div>' +
      '  </div>' +
      '</div>' +
      '<div class="pages">' +
      '  <div data-page="dynamic-pages" class="page contact-page">' +
      '    <div class="page-content">' +
      '      <div class="contact-header">' +
      '        <div class="header-text">' +
      '          <img src="' + speakers[index].ProfilePic + '">' +
      '          <h3>' + speakers[index].Name + '</h3>' +
      '          <p>' + speakers[index].Company + '</p>' +
      '        </div>' +
      '      </div>' +
      '      <div class="content-block">' +
      '        <div class="content-block-inner">' +
      '          <p>' + speakers[index].Bio + '</p>' +
      '        </div>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>'
    );
    return;
  }
}

function initMapa() {
  //JS MAPA

  function initializeMap() {
    var myLatlng = new google.maps.LatLng(-34.585667, -58.393478);
    var mapCanvas = document.getElementById('map_canvas');
    var mapOptions = {
      center: myLatlng,
      zoom: 16,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    var map = new google.maps.Map(mapCanvas, mapOptions);

    var marker = new google.maps.Marker({
      position: myLatlng,
      map: map,
      title: 'JSConf',
      icon: {
        url: "img/sprite.png",
        size: new google.maps.Size(53, 58),
        anchor: new google.maps.Point(27, 58),
        origin: new google.maps.Point(230, 0),
        scaledSize: new google.maps.Size(500, 250)
      }
    });

  }


  $$('#view-mapa').on('show', function() {
    if ($$('#map_canvas').html() === "") {
      initializeMap();
    }

  });

}

function initTweetFeed() {
  // JS TWITTER FEED

  //paso los parametros
  var hashtag = "jsconfar";
  var query = encodeURIComponent("#" + hashtag + "OR" + "from:" + hashtag + "OR" + "@" + hashtag);
  var widgetId = "514153581134360576";
  $$('#tweetContainer-inner').attr('href', "https://twitter.com/search?q=" + query);
  $$('#tweetContainer-inner').attr('data-widget-id', widgetId);

  //incluye asincronicamente el widgets.js
  function initTwitter(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0],
      p = /^http:/.test(d.location) ? 'http' : 'https';
    if (!d.getElementById(id)) {
      js = d.createElement(s);
      js.id = id;
      js.src = p + "://platform.twitter.com/widgets.js";
      fjs.parentNode.insertBefore(js, fjs);
    }
  }

  //inicializo el script de twitter al cargar la vista por primera vez para evitar problemas de resize.
  $$('#view-tweets').on('show', function() {
    if (window.twttr) {
      return;
    }
    initTwitter(document, "script", "twitter-wjs");
  });


}

function initAgenda(view) {
  //JS agenda

  var agenda = [];
  $.getJSON("./agenda.json", function(data) {
    agenda = data;

    armarListaAgenda();
  });



  function armarListaAgenda() {
    for (var index in agenda) {
      var li =
        '<li class="contact-item">' +
        '   <a href="#" data-src=' + agenda[index].Id + ' class="item-link create-page-agenda">' +
        '       <div class="item-content">' +
        '            <div class="item-media">' +
        '                <div class="item-time">' + agenda[index].Time + '</div>' +
        '           </div>' +
        '           <div class="item-inner">' +
        '                <div class="item-title-row">' +
        '                   <div class="item-title">' + agenda[index].Title + '</div>' +
        '                </div>' +
        '                <div class="item-subtitle">' + agenda[index].Speaker + '</div>' +
        '            </div>' +
        '        </div>' +
        '    </a>' +
        '</li>';
      $$('.listaAgenda').append(li);
    }
    //Agrego la funcion de crear la página con el detalle del speaker al clickear en el mismo
    $$('.create-page-agenda').on('click', function() {
      createContentPageAgenda(this.getAttribute("data-src"));
    });
  }


  // GENERO LA PAGINA CON EL DETALLE DE LA CHARLA DINAMICAMENTE
  function createContentPageAgenda(id) {
    //index-1 porque en el json arranco los id desde el 1
    var index = id - 1;
    //Cargo la página dinamica en la vista correspondiente 
    view.loadContent(
      //le agrego un nuevo navbar que contenga boton back.
      '<!-- Top Navbar-->' +
      '<div class="navbar">' +
      '  <div class="navbar-inner">' +
      '    <div class="left"><a href="#" class="back link"><i class="icon icon-back"></i><span>Back</span></a></div>' +
      '    <div class="center">Agenda</div>' +
      '  </div>' +
      '</div>' +
      '<div class="pages">' +
      '  <div data-page="dynamic-pages" class="page contact-page">' +
      '    <div class="page-content">' +
      '      <div class="contact-header">' +
      '        <div class="header-text">' +
      '          <img src="' + agenda[index].SpeakerProfilePic + '">' +
      '          <h3>' + agenda[index].Title + '</h3>' +
      '          <h3>' + agenda[index].Time + '</h3>' +
      '          <p>' + agenda[index].Speaker + '</p>' +
      '        </div>' +
      '      </div>' +
      '      <div class="content-block">' +
      '        <div class="content-block-inner">' +
      '          <p>' + agenda[index].Resumen + '</p>' +
      '        </div>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>'
    );
    return;
  }

}

function initLogin() {
  //TWITTER HELLO.JS LOGIN

  var twitter_app_id = '3QMDGlsd7JHiCOnMt1PlmcDTV';
  var facebook_app_id = '281748475355273';
  var google_app_id = '153292884918-o0ejmc2dq5aa8hppl49u633ulgih9flu.apps.googleusercontent.com';
  var app_login_url = 'http://shovelapps.com/redirect/redirect.html';

  hello.on('auth.login', function(response) {
    // Get Profile

    hello.api(response.network + ':/me', function(profile) {
      username = profile.name;
      avatar = profile.thumbnail;
      social = response.network;
      myApp.closeModal();
    });
  });

  hello.init({
    'twitter': twitter_app_id,
    'facebook': facebook_app_id,
    'google': google_app_id
  }, {
    redirect_uri: app_login_url,
    oauth_proxy: 'https://shovel-login.herokuapp.com/oauthproxy'
  });

}

function initLogout() {
  //LOGOUT

  $$('#logout').on('click', function() {
    hello(social).logout();
    myApp.loginScreen();
    return false;
  });
}


//CONNECTION STATUS (necesita el plugin org.apache.cordova.network-information)

function onDeviceReady() {
  document.addEventListener("online", onOnline, false);
  document.addEventListener("offline", onOffline, false);
}

// Handle the online event
//
function onOnline() {
  $$('.needs-conn').removeClass('disabled');
}

//Handle the offline event
//
function onOffline() {
  $$('.needs-conn').addClass('disabled');
}