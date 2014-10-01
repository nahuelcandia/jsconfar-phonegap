var $$ = Dom7;
var myApp = new Framework7({
  modalTitle: 'Bienvenido',
  animateNavBackIcon: true //swipePanel: 'left'
});

// myApp.onPageInit('index-2', function (page) {
//     console.log("aaa");
//     if($$('#map_canvas').html()===""){
//         initializeMap();    
//     }
// });

//And now we initialize app

var view1 = myApp.addView('#view-tweets');
var view2 = myApp.addView('#view-mapa');
//Vista de speakers
var view3 = myApp.addView('#view-speakers', {
  // Because we use fixed-through navbar we can enable dynamic navbar
  /*Necesito que la navbar sea dinamica en esta view para poder cambiarla al entrar en las subpaginas*/
  dynamicNavbar: true
});


//vista de Chat
var view4 = myApp.addView('#view-chat');
var view5 = myApp.addView('#view-agenda', {
  // Because we use fixed-through navbar we can enable dynamic navbar
  /*Necesito que la navbar sea dinamica en esta view para poder cambiarla al entrar en las subpaginas*/
  dynamicNavbar: true
});
var view6 = myApp.addView('#view-about');
var view7 = myApp.addView('#view-home');

//Esta variable es usada tanto por el plugin de login como por el plugin de chat
var username;
var avatar = false;
var social = "";
/*JS CHAT*/


//instancio las bases de datos de mensajes y usuarios
var chats = new Firebase("https://shovelChat.firebaseio.com/Chats");
var users = new Firebase("https://shovelChat.firebaseio.com/Users");

var userId, newUser, lastDate, messagesLoaded = false,
  usersLoaded;

//cada vez que se agrega un usuario

// users.on("value", function(snapshot) {
//     $$('#userList').html("");
//     var objs = snapshot.val();
//     $.each(objs, function(i, obj) {
//         var template = '<li><div class="item-content"><div class="item-inner"><div class="item-title">'+obj.name+'</div></div></div></li>';
//         $$('#userList').append(template);
//     });
//     usersLoaded = true;
// });


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

// Initial load
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


chats.on("value", function(snapshot) {
  if (messagesLoaded) return;
  messagesLoaded = true;
});

//cada vez que se agrega un mensaje lo parsea (si aun no realizo la carga inicial no)
chats.on("child_added", function(snapshot) {
  if (!messagesLoaded) return;
  receiveMessage(snapshot);
});



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
  chats.push({
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
    chats.push({
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


/*En el evento show de la vista 4 se inicializa la secuencia de login*/
$$('#view-chat').on('show', function() {
  if (newUser === undefined) {
    myApp.alert('you are logged in as ' + username);
    newUser = users.push({
      name: username
    });
    userId = newUser.name();
  }


});

/*cuando se cierra la aplicacion remuevo el usuario de mi base en firebase*/
window.onunload = userLogOff;

function userLogOff() {
  newUser.remove();
}



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
  view3.loadContent(
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
    '        <div class="item-photo">' +
    '          <img src=' + speakers[index].ProfilePic + '>' +
    '        </div>' +
    '        <div class="header-text">' +
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



//JS MAPA

function initializeMap() {
  var myLatlng = new google.maps.LatLng(-34.585667, -58.393478);
  var mapCanvas = document.getElementById('map_canvas');
  var mapOptions = {
    center: myLatlng,
    zoom: 16,
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


// JS TWITTER FEED

//paso los parametros
var hashtag = "jsconfar";
var query = encodeURIComponent("#" + hashtag + "OR" + "from:" + hashtag + "OR" + "@" + hashtag);
var widgetId = "514153581134360576";
$$('#tweetContainer-inner').attr('href', "https://twitter.com/search?q=" + query);
$$('#tweetContainer-inner').attr('data-widget-id', widgetId);

//incluye asincronicamente el widgets.js
! function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0],
    p = /^http:/.test(d.location) ? 'http' : 'https';
  if (!d.getElementById(id)) {
    js = d.createElement(s);
    js.id = id;
    js.src = p + "://platform.twitter.com/widgets.js";
    fjs.parentNode.insertBefore(js, fjs);
  }
}(document, "script", "twitter-wjs");



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
  view5.loadContent(
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
    '        <div class="item-photo">' +
    '          <img src=' + agenda[index].SpeakerProfilePic + '>' +
    '        </div>' +
    '        <div class="header-text">' +
    '          <h3>' + agenda[index].Title + '</h3>' +
    '          <h3>' + agenda[index].Time + '</h4>' +
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




//JS LOGIN

/*---- Simple Login ----*/

// $$('.login-btn').on('click', function () {
//     var loginBox = $$('.loginBox');
//     var userName = loginBox.val();
//     if (userName.length !== 0){
//         username=userName;
//         myApp.closeModal();
//     } 

// });


/*---- FACEBOOK LOGIN ----*/
/*
//inicializacion
window.fbAsyncInit = function() {
  FB.init({
    appId      : '281748475355273',
    cookie     : true,  // enable cookies to allow the server to access 
                        // the session
    xfbml      : true,  // parse social plugins on this page
    version    : 'v2.1' // use version 2.1
  });
};

// Load the SDK asynchronously
(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/es_LA/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


//Inicio del login por medio del boton
function loginStart() {
//pido el status y llamo a la funcion que revisa el resultado
    FB.getLoginStatus(function(response) {
      statusChangeCallback(response);
    });
}

// This is called with the results from from FB.getLoginStatus().
function statusChangeCallback(response) {
    // console.log('statusChangeCallback');
    // console.log(response);
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
      // Logged into your app and Facebook.
      //Si estoy conectado consulto la api y guardo el usrname, cierro el modal del login
        FB.api('/me', function(response) {
            username=response.name;
        });
        FB.api('/me/picture', function(response) {
            avatar=response.data.url;
        });
        myApp.closeModal();   

    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app.
      document.getElementById('status').innerHTML = 'Please log ' +
        'into this app.';
    } else {
      // The person is not logged into Facebook, so we're not sure if
      // they are logged into this app or not.
      document.getElementById('status').innerHTML = 'Please log ' +
        'into Facebook.';
    }
}
*/


//TWITTER HELLO.JS LOGIN

var twitter_app_id = 'Oj2G3bAghxBk8kmekABsf0kCO';
var facebook_app_id = '281748475355273';
var google_app_id = '153292884918-o0ejmc2dq5aa8hppl49u633ulgih9flu.apps.googleusercontent.com';
var app_login_url = 'http://localhost:8080/jsconfApp-test/index.html';

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
  redirect_uri: 'http://localhost:8080/jsconfApp-test/index.html',
  oauth_proxy: 'https://shovel-login.herokuapp.com/oauthproxy'
});


//LOGOUT


$$('#logout').on('click', function() {
  hello(social).logout();
  myApp.loginScreen();
  return false;
});