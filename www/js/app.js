// inicializacion

document.addEventListener("deviceready", onDeviceReady, false);

var $$ = Dom7;
var myApp = new Framework7({
  //modal para el chat plugin
  modalTitle: 'Welcome',
  animateNavBackIcon: true, //swipePanel: 'left'
  fastClicks: true
});

//Esta variable es usada tanto por el plugin de login como por el plugin de chat
var username, avatar = false,
  social = "",
  pushNotification;

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
  // inicializo el script de twitter al cargar la vista por primera vez para evitar problemas de resize.

  $$('#view-tweets').on('show', function() {
    if (window.twttr) {
      return;
    }
    initTwitter(document, "script", "twitter-wjs");
  });

}
//incluye asincronicamente el widgets.js


function initAgenda(view) {
  //JS agenda

  var agenda = [];
  $.getJSON("./agenda.json", function(data) {
    agenda = data;

    armarListaAgenda();
  });



  function armarListaAgenda() {

    for (var index in agenda) {
      var div =

        '<div class="content-block-agenda">' +
        ' <div class="content-block-title"><b>' + agenda[index].Title + '</b></div>' +
        '  <div class="content-block-inner">' +
        '    <div class="content-block-agenda-alt">' +
        '      <div class="row no-gutter">' +
        '        <div class="col-33">' +
        '          <img class="speakerPic" src=' + agenda[index].SpeakerProfilePic + ' />' +
        '        </div>' +
        '        <div class="col-66 speakerInfo" >' +
        '          <div>' + agenda[index].Speaker + '</div>' +
        '          </br>' +
        '          <div>' + agenda[index].Company + '</div>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '    <div class="content-block-title-alt"><b>' + agenda[index].Time + '-' + agenda[index].Place + '</b></div>' +
        '  </div>' +
        '</div>';

      $$('.listaAgenda').append(div);
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
  // var app_login_url = 'http://shovelapps.com/redirect/redirect.html';

  hello.on('auth.login', function(response) {
    // Get Profile

    hello.api(response.network + ':/me', function(profile) {
      username = profile.name;
      $$('.userName').html('<b>' + username + '</b>');
      avatar = profile.thumbnail;
      $$('.userPic').attr('src', avatar);
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

  //EXIT
  $$('#exit').on('click', function() {
    navigator.app.exitApp();
  });
}


//CONNECTION STATUS (necesita el plugin org.apache.cordova.network-information)

function onDeviceReady() {

  document.addEventListener("online", onOnline, false);
  document.addEventListener("offline", onOffline, false);

  //agrego el listener del evento del back button para android
  document.addEventListener("backbutton", weNeedToGoBack, false);


  //oculto la splashscreen 
  navigator.splashscreen.hide();

  // $("#app-status-ul").append('<li>deviceready event received</li>');
  //preparo para recibir push notifications
  try {
    pushNotification = window.plugins.pushNotification;
    // $("#app-status-ul").append('<li>registering ' + device.platform + '</li>');
    if (device.platform == 'android' || device.platform == 'Android' ||
      device.platform == 'amazon-fireos') {

      pushNotification.register(successHandler, errorHandler, {
        "senderID": "153292884918", //id de mi proyecto en Google developer console
        "ecb": "onNotification" //funcion a ejecutar si estoy en android
      }); // required!
    } else {
      pushNotification.register(tokenHandler, errorHandler, {
        "badge": "true",
        "sound": "true",
        "alert": "true",
        "ecb": "onNotificationAPN"
      }); // required!
    }
  } catch (err) {
    txt = "There was an error on this page.\n\n";
    txt += "Error description: " + err.message + "\n\n";
    alert(txt);
  }

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

function weNeedToGoBack() {

}

//FUNCIONES DE PUSH NOTIFICATION


// handle APNS notifications for iOS
function onNotificationAPN(e) {
  if (e.alert) {
    // $("#app-status-ul").append('<li>push-notification: ' + e.alert + '</li>');
    // showing an alert also requires the org.apache.cordova.dialogs plugin
    navigator.notification.alert(e.alert);
  }

  if (e.sound) {
    // playing a sound also requires the org.apache.cordova.media plugin
    var snd = new Media(e.sound);
    snd.play();
  }

  if (e.badge) {
    pushNotification.setApplicationIconBadgeNumber(successHandler, e.badge);
  }
}

// handle GCM notifications for Android
function onNotification(e) {

  var registerDB = new Firebase("https://shovelChat.firebaseio.com/register");
  // $("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');

  switch (e.event) {
    case 'registered':
      if (e.regid.length > 0) {


        //checkeo si esta instancia de la app ya esta dada de alta para las push notif.
        registerDB.once('value', function(snapshot) {
          if (!snapshot.hasChild(e.regid)) {
            registerDB.child(e.regid).set({
              name: e.regid
            });
          }
        });

        // $("#app-status-ul").append('<li>REGISTERED -> REGID:' + e.regid + "</li>");
        // Your GCM push server needs to know the regID before it can push to this device
        // here is where you might want to send it the regID for later use.
        // console.log("regID = " + e.regid);
      }
      break;

    case 'message':
      // if this flag is set, this notification happened while we were in the foreground.
      // you might want to play a sound to get the user's attention, throw up a dialog, etc.
      // alert(e.data);
      // if (e.foreground) {
      // $("#app-status-ul").append('<li>--INLINE NOTIFICATION--' + '</li>');

      // on Android soundname is outside the payload. 
      // On Amazon FireOS all custom attributes are contained within payload
      var soundfile = e.payload.sound;

      var path = window.location.pathname;
      //-10 porque remueve index.html
      path = path.substr(path, path.length - 10);
      path = 'file://' + path;
      // if the notification contains a soundname, play it.
      // playing a sound also requires the org.apache.cordova.media plugin
      var my_media = new Media(path + 'sounds/' + soundfile);
      my_media.play();

      // }
      // else { // otherwise we were launched because the user touched a notification in the notification tray.
      //   if (e.coldstart)
      //     $("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
      //   else
      //     $("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
      // }

      myApp.addNotification({
        title: e.payload.title,
        message: e.payload.message
      });
      break;

    case 'error':
      // $("#app-status-ul").append('<li>ERROR -> MSG:' + e.msg + '</li>');
      break;

    default:
      // $("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
      break;
  }
}

function tokenHandler(result) {
  // $("#app-status-ul").append('<li>token: ' + result + '</li>');
  // Your iOS push server needs to know the token before it can push to this device
  // here is where you might want to send it the token for later use.
}

function successHandler(result) {
  // $("#app-status-ul").append('<li>success:' + result + '</li>');
}

function errorHandler(error) {
  // $("#app-status-ul").append('<li>error:' + error + '</li>');
}