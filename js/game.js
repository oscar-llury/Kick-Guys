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
}

var levels = {
	//Nievel de datos
	data:[
		{
			//primer nivel
			foreground:'desert-foreground',
			background:'clouds-background',
			entities:[]
		},
		{
			//segundo nivel
			foreground:'desert-foreground',
			background:'clouds-background',
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
		game.currentLevel.backgroundImage = loader.loadImage('../assets/images/background.png');
		game.currentLevel.foregroundImage = loader.loadImage('../assets/images/background-suelo.png');
		game.slingsotImage = loader.loadImage("../assets/images/tirachinas.png");
		game.slingshotFrontImage = loader.loadImage("../assets/images/tirachinas-front.png");

		//llamar a game.start cuando lo assets se hayan cargado
		if(loader.loaded){
			game.start();
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
		if(audio.canPlayType){
			//actualmente canPlayType devuelve: "","mayby" o "probably"
			mp3Support = "" != audio.canPlayType('audio/mpeg');
			oggSupport = "" != audio.canPlayType('audio/ogg; codecs="vorbis"');
		}else{
			//la etiqueta de audio no es soportada
			mp3Support = false;
			oggSupport = false;
		}
		//comprueba para ogg, mp3 y finalmente fija soundFileExtn como undefined
		loader.soundFileExtn = oggSupport?".ogg":mp3Support?".mp3":undefined;
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