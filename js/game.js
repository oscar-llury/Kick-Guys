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
		game.canvas = $('#gamecanvas')[0];
		game.context = game.canvas.getContext('2d');
	},
	showLevelScreen:function(){
		$('.gamelayer').hide;
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
		$('#levelselection').html(html);

		//establece los controladores de eventos de clic de boton para cargar el nivel
		$('#levelselectscreen input').click(function(){
			levels.load(this.value-1);
			$('#levelselectscreen').hide();
		});
	},
	//carga todos los datos e imagenes para un nivel
	load:function(number){

	}
}