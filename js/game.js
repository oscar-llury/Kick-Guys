//preparar requestAnimationFrame y cancelAnimationFrame para su uso
(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = 
		  window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}
 
	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
			  timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
 
	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());

$(window).load(function() {
	game.init();
});
var game = {
	// Inicialización de objetos, precarga de elementos y pantalla de inicio
	init: function(){
		//inicializar objetos
		levels.init();
		// Ocultar todas las capas del juego y mostrar la pantalla de inicio
		$('.gamelayer').hide();
		$('#gamestartscreen').show();	

		//Obtener el controlador para el lienzo de juego y el contexto
		game.canvas = document.getElementById('gamecanvas');
		game.context = game.canvas.getContext('2d');
	},
	showLevelScreen:function(){
		$('.gamelayer').hide();
		$('#levelselectscreen').show('slow');
	},
	//modo Juego 
	mode:"intro", 
	//coordenadas X & Y del tirachinas
	slingshotX:140,
	slingshotY:280,
	// Desplazamiento de panorámica actual
	offsetLeft:0,
	start:function(){
		$('.gamelayer').hide();
		//mostrar canvar y score
		$('#gamecanvas').show();
		$('#scorescreen').show();
	
		game.mode = "intro";	
		game.offsetLeft = 0;
		game.ended = false;
		game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
	},	
	handlePanning:function(){
		game.offsetLeft++;//marcador de posicion temporal, mantiene la panoramica a la derecha
	},
	animate:function(){
		//animar el fondo
		game.handlePanning();


		//dibujar el fondo con desplazamiento
		game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/4,0,640,480,0,0,640,480);
		game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft,0,640,480,0,0,640,480);
		//dibujar el tirachinas
		game.context.drawImage(game.slingshotImage,game.slingshotX-game.offsetLeft,game.slingshotY);
		//dibujar el frente del tirachinas
		game.context.drawImage(game.slingshotFrontImage,game.slingshotX-game.offsetLeft,game.slingshotY);
		if (!game.ended){
			game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
		}	
	},
}

var levels = {
	//Nievel de datos
	data:[
		{
			//primer nivel
			foreground:'background-suelo',
			background:'background',
			entities:[]
		},
		{
			//segundo nivel
			foreground:'background-suelo',
			background:'background',
			entities:[]
		}
	],
	//inicializa la pantalla de seleccion de nivel
	init:function(){
		var html="";
		for(var i=0;i<levels.data.length;i++){
			var level = levels.data[i];
			html += '<input type="button" value="'+(i+1)+'">';
		};
		$('#levelselectscreen').html(html);

		//establece los controladores de eventos de clic de boton para cargar el nivel
		$('#levelselectscreen input').click(function(){
			levels.load(this.value-1);
			$('#levelselectscreen').hide();
		});
	},
	//carga todos los datos e imagenes para un nivel
	load:function(number){
		//declarar un nuevo objeto de nivel actual
		game.currentLevel = {number:number,hero:[]};
		game.score = 0;
		$('#score').html('Score: '+game.score);
		var level = levels.data[number];

		//cargar el fondo, el primer plano y las imagenes de la honda
		game.currentLevel.backgroundImage = loader.loadImage("assets/images/"+level.background+".png");
		game.currentLevel.foregroundImage = loader.loadImage("assets/images/"+level.foreground+".png");
		game.slingshotImage = loader.loadImage("assets/images/tirachinas.png");
		game.slingshotFrontImage = loader.loadImage("assets/images/tirachinas-front.png");

		//llamar a game.start cuando lo assets se hayan cargado
		if(loader.loaded){
			game.start()
		}else{
			loader.onload = game.start;
		}
	}
}
var loader ={
	loaded:true,
	loadedCount:0,//assets que han sido cargados antes
	totalCount:0,//numero total de assets que es necesario cargar

	init:function(){
		//comprueba el soporte para sonido
		var mp3Support,oggSupport;
		var audio = document.createElement('audio');
		/*
		if(audio.canPlayType){
			//actualmente canPlayType devuelve: "","mayby" o "probably"
			mp3Support = "" != audio.canPlayType('audio/mpeg');
			oggSupport = "" != audio.canPlayType('audio/ogg; codecs="vorbis"');
		}else{
			//la etiqueta de audio no es soportada
			mp3Support = false;
			oggSupport = false;
		}*/
		//comprueba para ogg, mp3 y finalmente fija soundFileExtn como undefined
		//loader.soundFileExtn = oggSupport?".ogg":mp3Support?".mp3":undefined;
	},
	loadImage:function(url){
		this.totalCount++;
		this.loaded = false;
		$('#loadingscreen').show();
		var image = new Image();
		image.src= url;
		image.onload = loader.itemLoaded;
		return image;
	},
	soundFileExtn:".ogg",
	loadSound:function(url){
		this.totalCount++;
		this.loaded = false;
		$('#loadingscreen').show();
		var audio = new Audio();
		audio.src = url+loader.soundFileExtn;
		audio.addEventListener("canplaythrough",loader.itemLoaded,false);
		return audio;
	},
	itemLoaded:function(){
		loader.loadedCount++;
		$('#loadingmessage').html('Loaded'+loader.loadedCount+' of '+loader.totalCount);
		if(loader.loadedCount === loader.totalCount){
			//el loader ha cargado completamente
			loader.loaded = true;
			$('#loadingscreen').hide();
			if(loader.onload){
				loader.onload();
				loader.onload = undefined;
			}
		}
	}
}

var mouse = {
	x:0,
	y:0,
	down:false,
	init:function(){
		$('#gamecanvas').mousemove(mouse.mousemovehandler);
		$('#gamecanvas').mousedown(mouse.mousedownhandler);
		$('#gamecanvas').mouseup(mouse.mouseuphandler);
		$('#gamecanvas').mouseout(mouse.mouseuphandler);
	},
	mousemovehandler:function(ev){
		var offset = $('#gamecanvas').offset();
		
		mouse.x = ev.pageX - offset.left;
		mouse.y = ev.pageY - offset.top;
		
		if (mouse.down) {
			mouse.dragging = true;
		}
	},
	mousedownhandler:function(ev){
		mouse.down = true;
		mouse.downX = mouse.x;
		mouse.downY = mouse.y;
		ev.originalEvent.preventDefault();
	},
	mouseuphandler:function(ev){
		mouse.down = false;
		mouse.dragging = false;
	}
}