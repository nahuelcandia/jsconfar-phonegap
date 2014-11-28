// inicializacion
'use strict';

document.addEventListener("deviceready", onDeviceReady, false);

var $$ = Dom7;
var myApp = new Framework7({
  //modal para el chat plugin
  modalTitle: 'Welcome',
  animateNavBackIcon: true, //swipePanel: 'left'
  fastClicks: true,
  swipePanel: 'left'

});

//Esta variable es usada tanto por el plugin de login como por el plugin de chat
var organizers = [];
var username, twitterName, avatar = false,
  social = "",
  pushNotification, mensajesCargados = false;

var passwords = [];
var lat, lng, mapPH, markerPH;

var loadScreen, lastDate;

var jsConfChat, currentChatRoom, currentView;

initLogin();

$(document).ready(function() {
  setInterval(function() {
    $('.time').map(function(idx, element) {
      $(element).text(moment($(element).data().time).fromNow());
    })
  }, 1000);
});

function initSuscriptions(){
  if(!store.get('suscriptions')) store.set('suscriptions',{});
  jsConfChat = new Suscriber();
  var s = store.get('suscriptions');
  $.each(s, function(i,e){
    jsConfChat.suscribe(i,e.unread);
    // console.log(e);
  });
}
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

  var view9 = myApp.addView('#view-help');
  var view10 = myApp.addView('#view-mapaPH');
  var view11 = myApp.addView('#view-wifi');
  var view12 = myApp.addView('#view-hospitals');
  var view13 = myApp.addView('#view-police');


  var view14 = myApp.addView('#view-mapaInterno');

  var view15 = myApp.addView('#view-mensajes');
  var view16 = myApp.addView('#view-privateChatRooms');


  $$('.view').on('show', function(){
    currentView = this.getAttribute('id');
  });

  $$('#view-chatRooms').once('show', function(){
    initSuscriptions();
  });


  initChat();
  initAgenda(view5);
  initSpeakers(view3);
  initMapa();
  initMapaPH();
  initTweetFeed();
  initWifi();
  initPolice();
  initHospitals();
  initMensajes();

}


function initMensajes() {
  var mensajesDB = new Firebase("https://shovelChat.firebaseio.com/mensajes");

  //carga inicial
  mensajesDB.on("child_added", function(snapshot) {

    var mensaje = snapshot.val();
    var time = new Date(mensaje.date);
    if (mensaje.tipo == 1) {
      var div =
        '       <div class="content-block-inner blockMensajes">' +
        '         <p>' + mensaje.mensaje + '</p>' +
        '           <div class="content-block-title timeMensajes">' +
        '             <i class="icon iconTimey"></i>' + '<span class="time" data-time="' + moment(time) +
        '">' + moment(time).fromNow(); + '</span>'
      '           </div>' +
        '       </div>';
    } else if (mensaje.tipo == 2) {
      var div =
        '       <div class="content-block-inner blockMensajesBis">' +
        '         <p>' + mensaje.mensaje + '</p>' +
        '           <div class="content-block-title timeMensajesBis">' +
        '             <i class="icon iconTimeg"></i>' + moment(time).fromNow(); +
        '           </div>' +
        '       </div>';
    }

    $$('.listaMensajes').prepend(div);

    //al cargar uno remuevo el preloader (spiner)

    $('#contenedorMensajes').find('.preloaderContainer').first().remove();


  });



}

function initWifi() {
  var wifiDB = new Firebase("https://shovelChat.firebaseio.com/wifi");
  wifiDB.once("value", function(snapshot) {
    var array = snapshot.val();
    for (var key in array) {
      var li =
        '<li>' +
        '       <div class="item-content">' +
        '         <div class="item-media"><i class="icon ion-wifi"></i></div>' +
        '           <div class="item-inner">' +
        '                   <div class="item-title">' + array[key] + '</div>' +
        '           </div>' +
        '        </div>' +
        '</li>';
      $$('.wifiList').append(li);
    }

  });

}

function initMapaPH() {
  //JS MAPA

  function initializeMapPH() {
    var myLatlng = new google.maps.LatLng(-34.585667, -58.393478);
    var mapCanvasPH = document.getElementById('map_canvasPH');
    var mapOptions = {
      center: myLatlng,
      zoom: 16,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    mapPH = new google.maps.Map(mapCanvasPH, mapOptions);

    markerPH = new google.maps.Marker({
      position: myLatlng,
      map: mapPH
    });
  }

  $$('#view-mapaPH').on('show', function() {

    if ($$('#map_canvasPH').html() === "") {
      initializeMapPH();
    }
    markerPH.setPosition(new google.maps.LatLng(lat, lng));
    mapPH.setCenter(new google.maps.LatLng(lat, lng));
  });

}

function initPolice() {
  /*JS POLICE MAP*/

  //Cargo el listado de police
  var police = [];
  $.getJSON("./comisarias.json", function(data) {
    police = data;

    armarListaPolice();
  });

  //Armo la lista de police
  function armarListaPolice() {
    for (var index in police) {
      var li =
        '<li class="contact-item">' +
        '   <a href="#view-mapaPH" data-lat=' + police[index].lat + ' data-lng=' + police[index].lng + ' class="item-link tab-link itemPH1">' +
        '       <div class="item-content">' +
        '           <div class="item-inner">' +
        '               <div class="item-title-row">' +
        '                   <div class="item-title">' + police[index].Nombre + '</div>' +
        '                </div>' +
        '                <div class="item-subtitle">' + police[index].Direccion + '</div>' +
        '                <div class="item-subtitle">' + police[index].Telefono + '</div>' +
        '            </div>' +
        '        </div>' +
        '    </a>' +
        '</li>';
      $$('.listPolice').append(li);
    }

    $$('.itemPH1').on('click', function() {
      lat = this.getAttribute("data-lat");
      lng = this.getAttribute("data-lng");
    });
  }
}

function initHospitals() {
  /*JS POLICE MAP*/

  //Cargo el listado de police
  var hospitals = [];
  $.getJSON("./hospitales.json", function(data) {
    hospitals = data;

    armarListaHospitals();
  });

  //Armo la lista de police
  function armarListaHospitals() {
    for (var index in hospitals) {
      var li =
        '<li class="contact-item">' +
        '   <a href="#view-mapaPH" data-lat=' + hospitals[index].lat + ' data-lng=' + hospitals[index].lng + ' class="item-link tab-link itemPH">' +
        '       <div class="item-content">' +
        '           <div class="item-inner">' +
        '               <div class="item-title-row">' +
        '                   <div class="item-title">' + hospitals[index].Nombre + '</div>' +
        '                </div>' +
        '                <div class="item-subtitle">' + hospitals[index].Direccion + '</div>' +
        '                <div class="item-subtitle">' + hospitals[index].Telefono + '</div>' +
        '            </div>' +
        '        </div>' +
        '    </a>' +
        '</li>';
      $$('.listHospitals').append(li);
    }

    $$('.itemPH').on('click', function() {
      lat = this.getAttribute("data-lat");
      lng = this.getAttribute("data-lng");
    });
  }
}

function initChat() {
  /*JS CHAT*/
  var listaOrg;
  var organizersDB = new Firebase("https://shovelChat.firebaseio.com/Organizers");
  organizersDB.once("value", function(snapshot) {
    listaOrg = snapshot.val();
    for (var index in listaOrg) {
      organizers.push(listaOrg[index].name);
    }

  });

  //instancio la base de datos de mensajes
  var currentRoomDB;
  var roomsDB = new Firebase("https://shovelChat.firebaseio.com/Rooms");
  var roomsList, roomsLoaded = false,
    currentRoom, currentRoomID;


  /*En el evento show de la pantalla de chat muestro un alert con los datos del usuario*/
  $$('#view-chat').on('show', function() {
    // currentChatRoom = currentRoomID;
    if (username === undefined) {} else {
      var messagesLoaded = false; //controlo con esta variable por que funcion paso el msj (carga inicial vs carga individual)

      var db = $('#sendPhoto').data('db');
      if (db && db.off) {
        //limpio los listeners para que no se me acumulen cada vez que muestro la pantalla
        db.off();
      }

      //establesco la sala actual
      db = new Firebase("https://shovelChat.firebaseio.com/Rooms/" + currentChatRoom + "/mensajes");
      //limito los mensajes que traigo a 10

      var queryLimited = db.limit(30);

      $('.sendPhoto').data('db', db);
      $('.messagebar a.link').data('db', db);

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
      setTimeout(function() {
        $('.botonChat').addClass('active');
      }, 10);

      return;
    }
    myApp.loginScreen();
  });


  //SALAS

  //agregar nueva sala
  $$('.prompt-newRoom').on('click', function() {
    myApp.prompt('New chat title', 'New Chat', function(value) {
      if (value.trim() != "") {
        roomsDB.push({
          title: value.trim()
        });
      }
    });
  });

  $$('.prompt-newPrivateRoom').on('click', function() {
    myApp.prompt('New chat with the organizers', 'New Chat', function(value) {
      if (value.trim() != "") {
        roomsDB.push({
          title: value.trim(),
          isPrivate: true,
          owner: username
        });
      }
    });
  });


  //Armado de listado de salas

  roomsDB.on("value", function(snapshot) {
    //solo lo realizo una vez (carga desde la base)
    if (!roomsLoaded) {
      roomsList = snapshot.val();
      for (var index in roomsList) {
        var li =
          '<li>' +
          '   <a href="#view-chat" data-id=' + index + ' data-src="' + roomsList[index].title + '" class="item-link tab-link chatRoomItem">' +
          '       <div class="item-content">' +
          '           <div class="item-inner">' +
          '                   <div class="item-title">' + roomsList[index].title + '</div>' +
          '                   <div class="item-after"></div>' +
          '           </div>' +
          '        </div>' +
          '    </a>' +
          '</li>';
        if (roomsList[index].isPrivate == true) {
          if (roomsList[index].owner == username || organizers.indexOf(twitterName) > -1) {
            $$('.privateRoomsList').append(li);
          }
        } else {
          $$('.roomsList').append(li);
        }

      }


      roomsLoaded = true;
    }


  });

  roomsDB.on("child_added", function(snapshot) {
    //solo lo realizo una vez (carga desde la base)
    if (roomsLoaded) {
      var roomAdded = snapshot.val();
      var li =
        '<li>' +
        '   <a href="#view-chat" data-id=' + snapshot.name() + ' data-src="' + roomAdded.title + '" class="item-link tab-link chatRoomItem">' +
        '       <div class="item-content">' +
        '           <div class="item-inner">' +
        '                   <div class="item-title">' + roomAdded.title + '</div>' +
        '                   <div class="item-after"></div>' +
        '           </div>' +
        '        </div>' +
        '    </a>' +
        '</li>';
      if (roomAdded.isPrivate == true) {
        if (roomAdded.owner == username || organizers.indexOf(twitterName) > -1) {
          $$('.privateRoomsList').append(li);
        }
      } else {
        $$('.roomsList').append(li);
      }
    }

  });

}
function Suscriber(){
  this.rooms = {};
}
Suscriber.prototype = {
  suscribed: function(room) {
    return this.rooms[room] !== undefined;
  },
  suscribe: function(room, force) {
    var _this = this;
    if(_this.rooms[room]) return;

    var s = store.get('suscriptions');
    s[room] = {
      unread: force || 0
    };
    store.set('suscriptions', s);

    _this.addBadge(room);

    _this.rooms[room] = {
      dbRef: new Firebase("https://shovelChat.firebaseio.com/Rooms/"+room+"/mensajes")
    };

    this.rooms[room].dbRef.once('value', function(sn){
      if(currentView == "view-chat" && currentChatRoom == room) return;
      if(sn.val()){
        var s = store.get('suscriptions');
        s[room].unread -= Object.keys(sn.val()).length;
        store.set('suscriptions', s);
      }
    });

    this.rooms[room].dbRef.on('child_added', function(sn){
      if(currentView == "view-chat" && currentChatRoom == room) return;

      var s = store.get('suscriptions');
      s[room].unread++;
      store.set('suscriptions', s);

      _this.updateDom(room);
    });
  },
  unsuscribe: function(room) {
    var _this = this;
    if(!_this.rooms[room]) return;

    var s = store.get('suscriptions');
    delete s[room];
    store.set('suscriptions', s);

    _this.rooms[room].dbRef.off();
    delete _this.rooms[room];

    _this.removeBadge(room);
  },
  addBadge: function(room) {
    this.removeBadge(room);
    $('.item-after','a[data-id='+room+']').append('<span id="'+room+'" class="badge">0</span>');
  },
  removeBadge: function(room) {
    $('span#'+room).remove();
  },
  resetSuscription: function(room) {
    var s = store.get('suscriptions');
    s[room].unread = 0;
    store.set('suscriptions',s);
    this.resetBadge(room);
  },
  resetBadge: function(room) {
    $('span#'+room).text("0");
  },
  updateDom: function(room) {
    // console.log('updating dom badge for '+room+' with '+store.get('suscriptions')[room].unread);
    if(currentView == "view-chat" && currentChatRoom == room) return;
    $('span#'+room).text(store.get('suscriptions')[room].unread);
  }
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
      '      <div class="contact-header speakersHead">' +
      '       <div class="speakerInfo">' +
      '         <div class="row">' +
      '           <div class="col-33">' +
      '            <img src="' + speakers[index].ProfilePic + '">' +
      '           </div>' +
      '           <div class="col-66">' +
      '            <h3>' + speakers[index].Name + '</h3>' +
      '            <p>' + speakers[index].Company + '</p>' +
      '           </div>' +
      '          </div>' +
      '        </div>' +
      '      </div>' +
      '      <div class="content-block contentSpeaker">' +
      '      <div class="row">' +
      '        <div class="col-50"><i class="icon iconBio"></i><b>    About</b></div>' +
      '      </div> ' +
      '        <div class="content-block-inner contentSpeaker">' +
      '          <p>' + speakers[index].Charla + '</p>' +
      '        </div>' +
      '      <div class="row">' +
      '        <div class="col-100">Proyectos en los que ha trabajado</div>' +
      '      </div> ' +
      '      <div class="list-block listCompany">' +
      '        <div class="list-group">' +
      '          <ul class="listaSpeakers listWhite">' +
      '            <li class="contact-item">' +
      '              <div class="item-content">' +
      '                <div class="item-media">' +
      '                  <img src=' + speakers[index].CompanyImg + ' width="44">' +
      '                </div>' +
      '                <div class="item-inner">' +
      '                  <div class="item-title-row">' +
      '                    <div class="item-title">' + speakers[index].Company + '</div>' +
      '                  </div>' +
      '                </div>' +
      '              </div>' +
      '            </li>' +
      '          </ul>' +
      '        </div>' +
      '      </div>' +
      '      <div class="row" style="margin-top:40px">' +
      '        <div class="col-100">Enlaces</div>' +
      '      </div> ' +
      '      <div class="list-block listCompany">' +
      '        <div class="list-group">' +
      '          <ul class="listaSpeakers listWhite">' +
      '            <li class="contact-item">' +
      '             <a href="#" class="item-link external">' +
      '              <div class="item-content">' +
      '                <div class="item-media">' +
      '                  <img src="img/icons/Github.png" width="15">' +
      '                </div>' +
      '                <div class="item-inner">' +
      '                  <div class="item-title-row">' +
      '                    <div class="item-title">' + speakers[index].Github + '</div>' +
      '                  </div>' +
      '                </div>' +
      '              </div>' +
      '             </a>' +
      '            </li>' +
      '            <li class="contact-item">' +
      '             <a href="' + speakers[index].TwitterUrl + '" target="blank" class="item-link external">' +
      '              <div class="item-content">' +
      '                <div class="item-media">' +
      '                  <img src="img/icons/Twittermini.png" width="15">' +
      '                </div>' +
      '                <div class="item-inner">' +
      '                  <div class="item-title-row">' +
      '                    <div class="item-title">' + speakers[index].Twitter + '</div>' +
      '                  </div>' +
      '                </div>' +
      '              </div>' +
      '             </a>' +
      '            </li>' +
      '          </ul>' +
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

  var config3 = {
    "id": '514153581134360576',
    "domId": '',
    "maxTweets": 60,
    "enableLinks": true,
    "showImages": true,
    "customCallback": handleTweets2
  };

  //USO UNA CALLBACK A MEDIDA PARA DAR LA ESTRUCTURA NECESARIA PARA F7
  function handleTweets2(data) {
    var element = document.getElementById('contenedorTwitter');

    var div = document.createElement('div');
    div.innerHTML = data;
    var tweets = div.getElementsByClassName('tweet');

    var authors = div.getElementsByClassName('user');
    var pics = $(authors).find("a").children("img");
    var users = $(authors).find("a").children().find('span');
    var screenNames = $(authors).find("a").find('span:last');

    var times = div.getElementsByClassName('timePosted');
    var images = div.getElementsByClassName('media');
    // var tids = div.getElementsByClassName('user');
    var x = tweets.length;
    var n = 0;
    //CARGO LA LISTA CON EL CONTENIDO DE LOS ARRAYS
    var html = '<div>';
    while (n < x) {
      if (images[n]) {
        html += '<div class="content-block-agenda">' +
          '  <div class="content-block-title tweet-feed"><b>' +
          '      <div class="tweet-feed-header">' + pics[n].outerHTML + '</div>' +
          '      <div class="tweet-feed-header">' + '<h3 style="margin:3px 0px; font-size:13px;">' + users[n].innerHTML + '</h3><p style="font-weight: normal;">' + screenNames[n].innerHTML + '</p>' + '</div>' +
          '    </b></div>' +
          '  <div class="content-block-inner tweet-feed">' +
          tweets[n].innerHTML + '<br>' + images[n].innerHTML +
          '    <div class="content-block-title-alt tweet-feed"><i class="icon iconTimeb"></i>' + times[n].innerHTML + '</div>' +
          '  </div>' +
          '</div>';
        n++;
      } else {
        html += '<div class="content-block-agenda">' +
          '  <div class="content-block-title tweet-feed"><b>' +
          '      <div class="tweet-feed-header">' + pics[n].outerHTML + '</div>' +
          '      <div class="tweet-feed-header">' + '<h3 style="margin:3px 0px; font-size:13px;">' + users[n].innerHTML + '</h3><p style="font-weight: normal;">' + screenNames[n].innerHTML + '</p>' + '</div>' +
          '    </b></div>' +
          '  <div class="content-block-inner tweet-feed">' +
          tweets[n].innerHTML + '<br>' +
          '    <div class="content-block-title-alt tweet-feed"><i class="icon iconTimeb"></i>' + times[n].innerHTML + '</div>' +
          '  </div>' +
          '</div>';
        n++;
      }

    }
    html += '</div>';
    element.innerHTML = html;
  }


  twitterFetcher.fetch(config3);


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
      if (agenda[index].Keynote !== undefined) {
        var div =
          ' <div class="content-block-agenda">' +
          '  <div class="content-block-title"><p>' + agenda[index].Time + 'hrs - Salón Buenos Aires</p><b>' + agenda[index].Title + '</b></div>' +
          '   <div class="content-block-inner">' +
          '    <div class="content-block-agenda-alt">' +
          '     <div class="row no-gutter">' +
          '      <div class="col-33">' +
          '        <img class="speakerPic" src=' + agenda[index].SpeakerProfilePic + ' />' +
          '      </div>' +
          '      <div class="col-66 agendaInfo" >' +
          '       <div><h3 style="margin-top: 0px;">' + agenda[index].Keynote + '</h3><b>' + agenda[index].Speaker + '</b></div>' +
          '      </div>' +
          '     </div>' +
          '    </div>' +
          '   <div class="content-block-title-alt"><b>' + agenda[index].Time + '</b></div>' +
          '  </div>' +
          ' </div>';
        $$('.listaAgenda').append(div);
      } else {
        var div =
          ' <div class="content-block-agenda">' +
          '  <div class="content-block-title"><p>' + agenda[index].Time + 'hrs - Salón Buenos Aires</p><b>' + agenda[index].Title + '</b></div>' +
          '   <div class="content-block-inner">' +
          '    <div class="content-block-agenda-alt">' +
          '     <div class="row no-gutter">' +
          '      <div class="col-33">' +
          '        <img class="speakerPic" src=' + agenda[index].SpeakerProfilePic + ' />' +
          '      </div>' +
          '      <div class="col-66 agendaInfo" >' +
          '       <div><b>' + agenda[index].Speaker + '</b></div>' +
          '      </div>' +
          '     </div>' +
          '    </div>' +
          '   <div class="content-block-title-alt"><b>' + agenda[index].Time + '</b></div>' +
          '  </div>' +
          ' </div>';
        $$('.listaAgenda').append(div);
      }
    }
    //Agrego la funcion de crear la página con el detalle del speaker al clickear en el mismo
  }


  // GENERO LA PAGINA CON EL DETALLE DE LA CHARLA DINAMICAMENTE
  // function createContentPageAgenda(id) {
  //   //index-1 porque en el json arranco los id desde el 1
  //   var index = id - 1;
  //   //Cargo la página dinamica en la vista correspondiente 
  //   view.loadContent(
  //     //le agrego un nuevo navbar que contenga boton back.
  //     '<!-- Top Navbar-->' +
  //     '<div class="navbar">' +
  //     '  <div class="navbar-inner">' +
  //     '    <div class="left"><a href="#" class="back link"><i class="icon icon-back"></i><span>Back</span></a></div>' +
  //     '    <div class="center">Agenda</div>' +
  //     '  </div>' +
  //     '</div>' +
  //     '<div class="pages">' +
  //     '  <div data-page="dynamic-pages" class="page contact-page">' +
  //     '    <div class="page-content">' +
  //     '      <div class="contact-header">' +
  //     '        <div class="header-text">' +
  //     '          <img src="' + agenda[index].SpeakerProfilePic + '">' +
  //     '          <h3>' + agenda[index].Title + '</h3>' +
  //     '          <h3>' + agenda[index].Speaker + '</h3>' +
  //     '          <p>' + agenda[index].Time + '</p>' +
  //     '        </div>' +
  //     '      </div>' +
  //     '      <div class="content-block">' +
  //     '        <div class="content-block-inner">' +
  //     '          <p>' + agenda[index].Resumen + '</p>' +
  //     '        </div>' +
  //     '      </div>' +
  //     '    </div>' +
  //     '  </div>' +
  //     '</div>'
  //   );
  //   return;
  // }

}

function initLogin() {
  //TWITTER HELLO.JS LOGIN

  var twitter_app_id = '3QMDGlsd7JHiCOnMt1PlmcDTV';
  var facebook_app_id = '281748475355273';
  var google_app_id = '153292884918-o0ejmc2dq5aa8hppl49u633ulgih9flu.apps.googleusercontent.com';

  var app_login_url = 'http://shovelapps.com/redirect/redirect.html';
  // var app_login_url = 'http://localhost:8080/jsconf-phonegap/www/index.html';


  hello.on('auth.login', function(response) {
    // console.log(response);
    // Get Profile
    hello.api(response.network + ':/me', function(profile) {
      username = profile.name;
      if (response.network !== 'facebook') {
        twitterName = "@" + profile.screen_name;

        $$('.userName').html('<b>' + username + '</b><br><p>@' + profile.screen_name + '</p>');
      } else {
        $$('.userName').html('<b>' + username + '</b><br>');
      }
      avatar = profile.thumbnail.replace("_normal","_bigger");
      $$('.userPic').attr('src', avatar);
      social = response.network;

      initViews();
      initLogout();

      myApp.closeModal();

      //muestro loading screen
      $("body").append($('<div id="loadingScreen" style="margin:0px;padding:0px;position:absolute;width:100%;height:100%;z-index:5003;top:0;left:0;background:#FFC313 url(img/space.gif) no-repeat center center;background-size:150px"></div>'));
      loadScreen = true;
      setTimeout(function() {
        $("#loadingScreen").remove();
      }, 2500);
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
    // txt = "There was an error on this page.\n\n";
    // txt += "Error description: " + err.message + "\n\n";
    // alert(txt);
  }

}

// Handle the online event

function onOnline() {
  $$('.needs-conn').removeClass('disabled');
}

//Handle the offline event
//
function onOffline() {
  $$('.needs-conn').addClass('disabled');
  myApp.addNotification({
    title: "WARNING",
    message: "connection lost"
  });
}

function weNeedToGoBack() {
  myApp.showTab('#view-home');
  $('.botonChat').removeClass('active');
}

//FUNCIONES DE PUSH NOTIFICATION


// handle APNS notifications for iOS
function onNotificationAPN(e) {

  // if (e.alert) {
  //   // $("#app-status-ul").append('<li>push-notification: ' + e.alert + '</li>');
  //   // showing an alert also requires the org.apache.cordova.dialogs plugin
  //   navigator.notification.alert(e.alert);
  // }

  if (e.sound) {

    var soundfile = e.sound;

    var path = window.location.pathname;
    //-10 porque remueve index.html
    path = path.substr(path, path.length - 10);
    path = 'file://' + path;

    // if the notification contains a soundname, play it.
    // playing a sound also requires the org.apache.cordova.media plugin
    var my_media = new Media('sounds/' + soundfile);
    my_media.play();
  }


  myApp.addNotification({
    title: "JSConf.AR",
    message: e.alert
  });

  // if (e.badge) {
  //   pushNotification.setApplicationIconBadgeNumber(successHandler, e.badge);
  // }
}

// handle GCM notifications for Android
function onNotification(e) {

  var registerDB = new Firebase("https://shovelChat.firebaseio.com/registered");
  // $("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');

  switch (e.event) {
    case 'registered':
      if (e.regid.length > 0) {


        //checkeo si esta instancia de la app ya esta dada de alta para las push notif.
        registerDB.once('value', function(snapshot) {
          if (!snapshot.hasChild(device.uuid)) {
            registerDB.child(device.uuid).set({
              gcmId: e.regid
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
  var registerDBIos = new Firebase("https://shovelChat.firebaseio.com/registeredIos");

  registerDBIos.once('value', function(snapshot) {
    if (!snapshot.hasChild(result)) {
      registerDBIos.child(result).set({
        apnId: result
      });
    }
  });
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
      // Send message
      $('.messagebar a.link').on('click', function() {
        var db = $(this).data('db');
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
        db.push({
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
      $('#sendPhoto').on('click', function() {
        var db = $(this).data('db');
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
          db.push({
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

$('.tab-link').on('click', function() {
  if ($(this).hasClass('botonChat') == false) {
    $('.botonChat').removeClass('active');
  }
});

$('#refreshTweets').on('click', function() {
  document.getElementById('contenedorTwitter').innerHTML = '<div class="preloaderContainer"><span style="width:42px; height:42px" class="preloader"></span></div>'
  initTweetFeed();
});

$('#refreshMensajes').on('click', function() {
  document.getElementById('contenedorMensajes').innerHTML = '<div class="preloaderContainer"><span style="width:42px; height:42px" class="preloader"></span></div>'
  initMensajes();
});

$('ul.roomsList').on('click', 'a.chatRoomItem', function(){
  // console.log(currentChatRoom);
  // console.log(this);
  if (currentChatRoom !== this.getAttribute("data-id")) {
    currentChatRoom = (this.getAttribute("data-id"));
    $$('.messages').html("");
    $$('.roomTitle').html(this.getAttribute("data-src"));
  }
  $('#suscriber').data('room',currentChatRoom);
  if(jsConfChat.suscribed(currentChatRoom)) {
    $('i', '#suscriber').removeClass('icon ion-ios7-eye-outline').addClass("icon ion-ios7-eye");
    jsConfChat.resetSuscription(currentChatRoom);
  }else{
    $('i', '#suscriber').removeClass('icon ion-ios7-eye').addClass("icon ion-ios7-eye-outline");
  }
});

$('ul.privateRoomsList').on('click', 'a.chatRoomItem', function(){
  // console.log(currentChatRoom);
  // console.log(this);
  if (currentChatRoom !== this.getAttribute("data-id")) {
    currentChatRoom = (this.getAttribute("data-id"));
    $$('.messages').html("");
    $$('.roomTitle').html(this.getAttribute("data-src"));
  }
  $('#suscriber').data('room',currentChatRoom);
  if(jsConfChat.suscribed(currentChatRoom)) {
    $('i', '#suscriber').removeClass('icon ion-ios7-eye-outline').addClass("icon ion-ios7-eye");
    jsConfChat.resetSuscription(currentChatRoom);
  }else{
    $('i', '#suscriber').removeClass('icon ion-ios7-eye').addClass("icon ion-ios7-eye-outline");
  }
});

$('#suscriber').on('click', function(){
  var r = $(this).data('room');
  if(jsConfChat.suscribed(r)) {
    //unsuscribe
    // console.log('unsuscribing to '+r);
    jsConfChat.unsuscribe(r);
    $('i', this).removeClass('icon ion-ios7-eye').addClass("icon ion-ios7-eye-outline");
  }else{
    // suscribe
    // console.log('suscribing to '+r);
    jsConfChat.suscribe(r);
    $('i', this).removeClass('icon ion-ios7-eye-outline').addClass("icon ion-ios7-eye");
  }
});


