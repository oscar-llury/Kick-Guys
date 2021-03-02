// Declarar todos los objetos de uso comÃºn como variables por conveniencia
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

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
	//modo Juego 
	mode:"intro", 
	//coordenadas X & Y del tirachinas
	slingshotX:140,
	slingshotY:280,
	// Velocidad máxima de panoramización por fotograma en píxeles
	maxSpeed:3,
	// Desplazamiento de panorámica actual
	offsetLeft:0,
	//minimo y maximo desplazamiento panoramico
	minOffset:0,
	maxOffset:300,
	//la puntuacion del juego
	scrore:0,
	decelerating:0,
	
	init: function(){
		//inicializar objetos
		levels.init();
		loader.init();
		mouse.init();
		// Ocultar todas las capas del juego y mostrar la pantalla de inicio
		$('.gamelayer').hide();
		$('#gamestartscreen').show();	

		//Obtener el controlador para el lienzo de juego y el contexto
		game.canvas = $('#gamecanvas')[0];
		game.context = game.canvas.getContext('2d');
	},
	showLevelScreen:function(){
		$('.gamelayer').hide();
		$('#levelselectscreen').show('slow');
	},
	restartLevel:function(){
		window.cancelAnimationFrame(game.animationFrame);		
		game.lastUpdateTime = undefined;
		levels.load(game.currentLevel.number);
	},
	nextLevel:function(){
		window.cancelAnimationFrame(game.animationFrame);		
		game.lastUpdateTime = undefined;
		levels.load(game.currentLevel.number+1);
	},
	goHomePage:function(){
		$('#levelselectscreen').hide();
		$('#gamestartscreen').show();	
	},
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

	//Despliegue la pantalla para centrarse en newCenter
	panTo:function(newCenter){
		if (Math.abs(newCenter-game.offsetLeft-game.canvas.width/4)>0 
			&& game.offsetLeft <= game.maxOffset && game.offsetLeft >= game.minOffset){
		
			var deltaX = Math.round((newCenter-game.offsetLeft-game.canvas.width/4)/2);
			if (deltaX && Math.abs(deltaX)>game.maxSpeed){
				deltaX = game.maxSpeed*Math.abs(deltaX)/(deltaX);
			}
			game.offsetLeft += deltaX; 
		} else {
			
			return true;
		}
		if (game.offsetLeft <game.minOffset){
			game.offsetLeft = game.minOffset;
			return true;
		} else if (game.offsetLeft > game.maxOffset){
			game.offsetLeft = game.maxOffset;
			return true;
		}		
		return false;
	},
	countHeroesAndVillains:function(){
		game.heroes = [];
		game.villains = [];
		for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
			var entity = body.GetUserData();
			if(entity){
				if(entity.type == "hero"){				
					game.heroes.push(body);			
				} else if (entity.type =="villain"){
					game.villains.push(body);
				}
			}
		}
	},
  	mouseOnCurrentHero:function(){
		if(!game.currentHero){
			return false;
		}
		var position = game.currentHero.GetPosition();
		var distanceSquared = Math.pow(position.x*box2d.scale - mouse.x-game.offsetLeft,2) + Math.pow(position.y*box2d.scale-mouse.y,2);
		var radiusSquared = Math.pow(game.currentHero.GetUserData().radius,2);		
		return (distanceSquared<= radiusSquared);	
	},
	handlePanning:function(){
		//game.offsetLeft++;//marcador de posicion temporal, mantiene la panoramica a la derecha
		if(game.mode=="intro"){		
			if(game.panTo(700)){
				game.mode = "load-next-hero";
			}			 
		}
		 if (game.mode=="wait-for-firing"){  
			if (mouse.dragging){
				if (game.mouseOnCurrentHero()){
					game.mode = "firing";
				} else {
					game.panTo(mouse.x + game.offsetLeft)
				}
			} else {
				game.panTo(game.slingshotX);
			}
		}

		if (game.mode == "firing"){  
			if(mouse.down){
				game.panTo(game.slingshotX);				
				game.currentHero.SetPosition({x:(mouse.x+game.offsetLeft)/box2d.scale,y:mouse.y/box2d.scale});
			} else {
				game.mode = "fired";
				//game.slingshotReleasedSound.play();								
				var impulseScaleFactor = 0.75;
				
				// Coordenadas del centro de la honda (donde la banda estÃ¡ atada a la honda)
				var slingshotCenterX = game.slingshotX + 35;
				var slingshotCenterY = game.slingshotY+25;
				var impulse = new b2Vec2((slingshotCenterX -mouse.x-game.offsetLeft)*impulseScaleFactor,(slingshotCenterY-mouse.y)*impulseScaleFactor);
				game.currentHero.ApplyImpulse(impulse,game.currentHero.GetWorldCenter());

			}
		}

		if (game.mode == "fired"){		
			//Vista panorÃ¡mica donde el hÃ©roe se encuentra actualmente...
			var heroX = game.currentHero.GetPosition().x*box2d.scale;
			game.panTo(heroX);
			//Y esperar hasta que deja de moverse, está fuera de los límites o se mueve lentamente durante demasiado tiempo
			if(game.currentHero.m_linearVelocity.x<2 && game.currentHero.m_xf.position.y>13) {
				game.decelerating++;
			} else {
				game.decelerating = 0;
			}
			//var position = game.currentHero.GetPosition();
			
			//Y esperar hasta que deja de moverse o esta fuera de los limites
			if(!game.currentHero.IsAwake() || heroX<0 || heroX >game.currentLevel.foregroundImage.width || game.decelerating>350 ){
				// Luego borra el viejo heroe
				box2d.world.DestroyBody(game.currentHero);
				game.currentHero = undefined;
				// Resetea el numero de veces que se desplaza lentamente
                game.decelerating = 0;
                // y carga el siguiente heroe
                game.mode = "load-next-hero"
			}
		}

		if (game.mode == "load-next-hero"){
			game.countHeroesAndVillains();

			// Comprobar si algÃºn villano estÃ¡ vivo, si no, termine el nivel (Ã©xito)
			if (game.villains.length == 0){
				game.mode = "level-success";
				return;
			}

			// Comprobar si hay mÃ¡s hÃ©roes para cargar, si no terminar el nivel (fallo)
			if (game.heroes.length == 0){
				game.mode = "level-failure"	
				return;		
			}

			// Cargar el hÃ©roe y establecer el modo de espera para disparar (wait-for-firing)
			if(!game.currentHero){
				game.currentHero = game.heroes[game.heroes.length-1];
				game.currentHero.SetPosition({x:180/box2d.scale,y:200/box2d.scale});
	 			game.currentHero.SetLinearVelocity({x:0,y:0});
	 			game.currentHero.SetAngularVelocity(0);
				game.currentHero.SetAwake(true);				
			} else {
				// Esperar a que el hÃ©roe deje de rebotar y se duerma y luego cambie a espera para disparar (wait-for-firing)
				game.panTo(game.slingshotX);
				if(!game.currentHero.IsAwake()){
					game.mode = "wait-for-firing";
				}
			}
	    }	
		if(game.mode=="level-success" || game.mode=="level-failure"){		
			if(game.panTo(0)){
				game.ended = true;					
				game.showEndingScreen();
			}			 
		}
	},
	showEndingScreen:function(){
		//game.stopBackgroundMusic();				
		if (game.mode=="level-success"){
			if(game.currentLevel.number<levels.data.length-1){
				$('#endingmessage').html('Level Complete. Well Done!!!');
				$('#playnextlevel').html('<td><img src="assets/images/prev.png" onclick="game.nextLevel();"></td><td>Play Next Level</td>');
				
			} else {
				$('#endingmessage').html('All Levels Complete. Well Done!!!');
				
			}
			
		} else if (game.mode=="level-failure"){			
			$('#endingmessage').html('Failed. Play Again?');
			$('#playcurrentlevel').html('<td><img src="assets/images/prev.png" onclick="game.restartLevel();"></td><td>Replay Current Level</td>');
		}
		
		$('#returntolevelscreen').html('<td><img src="assets/images/prev.png" onclick="game.showLevelScreen();"></td><td>Return to Level Screen</td>');		
		$('#endingscreen').show();
	},
	animate:function(){
		//animar el fondo
		game.handlePanning();
		//animar los personajes
			var currentTime = new Date().getTime();
			var timeStep;
			if (game.lastUpdateTime){
				timeStep = (currentTime - game.lastUpdateTime)/1000;
				if(timeStep >2/60){
					timeStep = 2/60
				}
				box2d.step(timeStep);
			} 
			game.lastUpdateTime = currentTime;
		//dibujar el fondo con desplazamiento
		game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/2,0,640,480,0,0,640,480);// /4
		game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft,0,640,480,0,0,640,480);
		// Dibujar la honda
		game.context.drawImage(game.slingshotImage,game.slingshotX-game.offsetLeft,game.slingshotY);
		// Dibujar todos los cuerpos
		game.drawAllBodies();
		// Dibujar la banda cuando estamos disparando un hÃ©roe
		if(game.mode == "wait-for-firing" || game.mode == "firing"){  
			game.drawSlingshotBand();
		}
		//dibujar el frente del tirachinas
		game.context.drawImage(game.slingshotFrontImage,game.slingshotX-game.offsetLeft,game.slingshotY);
		if (!game.ended){
			game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
		}	
	},
	drawAllBodies:function(){  
		box2d.world.DrawDebugData();	

		// Iterar a travÃ©s de todos los cuerpos y dibujarlos en el lienzo del juego		  
		for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
			var entity = body.GetUserData();
  
			if(entity){
				var entityX = body.GetPosition().x*box2d.scale;
				if(entityX<0|| entityX>game.currentLevel.foregroundImage.width||(entity.health && entity.health <0)){
					box2d.world.DestroyBody(body);
					if (entity.type=="villain"){
						game.score += entity.calories;
						$('#score').html('Score: '+game.score);
					}
					if (entity.breakSound){
						entity.breakSound.play();
					}
				} else {
					entities.draw(entity,body.GetPosition(),body.GetAngle())				
				}	
			}
		}
	},
	drawSlingshotBand:function(){
		game.context.strokeStyle = "rgb(68,31,11)"; // Color marrÃ³n oscuro
		game.context.lineWidth = 6; // Dibuja una lÃ­nea gruesa

		// Utilizar el Ã¡ngulo y el radio del hÃ©roe para calcular el centro del hÃ©roe
		var radius = game.currentHero.GetUserData().radius;
		var heroX = game.currentHero.GetPosition().x*box2d.scale;
		var heroY = game.currentHero.GetPosition().y*box2d.scale;			
		var angle = Math.atan2(game.slingshotY+25-heroY,game.slingshotX+50-heroX);	
	
		var heroFarEdgeX = heroX - radius * Math.cos(angle);
		var heroFarEdgeY = heroY - radius * Math.sin(angle);
	
	
	
		game.context.beginPath();
		// Iniciar la lÃ­nea desde la parte superior de la honda (la parte trasera)
		game.context.moveTo(game.slingshotX+50-game.offsetLeft, game.slingshotY+25);	

		// Dibuja lÃ­nea al centro del hÃ©roe
		game.context.lineTo(heroX-game.offsetLeft,heroY);
		game.context.stroke();		
	
		// Dibuja el hÃ©roe en la banda posterior
		entities.draw(game.currentHero.GetUserData(),game.currentHero.GetPosition(),game.currentHero.GetAngle());
			
		game.context.beginPath();		
		// Mover al borde del hÃ©roe mÃ¡s alejado de la parte superior de la honda
		game.context.moveTo(heroFarEdgeX-game.offsetLeft,heroFarEdgeY);
	
		// Dibujar lÃ­nea de regreso a la parte superior de la honda (el lado frontal)
		game.context.lineTo(game.slingshotX-game.offsetLeft +10,game.slingshotY+30)
		game.context.stroke();
	},

}
var levels = {
	// Datos de nivel
	data:[
		{// Primer nivel 
			foreground:'N1-foreground',
			background:'N1-background',
			icon:'N1-icon',
			entities:[
				{type:"ground", name:"suelo", x:500,y:440,width:1000,height:20,isStatic:true},
				{type:"ground", name:"suelo", x:185,y:390,width:30,height:80,isStatic:true},
				
				{type:"block", name:"espiral", x:520,y:380,angle:90,width:100,height:25},	
				{type:"block", name:"espiral", x:620,y:280,angle:90,width:100,height:25},
				{type:"block", name:"bloque", x:520,y:280,angle:90,width:100,height:25},
				{type:"block", name:"bloque", x:620,y:380,angle:90,width:100,height:25},
				{type:"block", name:"pelota", x:400,y:410,angle:90,width:50,height:50},
				
				{type:"villain", name:"villano",x:520,y:205,calories:590},
				{type:"villain", name:"villano", x:620,y:205,calories:420},

				{type:"hero", name:"melocoton",x:80,y:405},
				{type:"hero", name:"manzana",x:140,y:405},
			]
		},
		{// Segundo nivel
			foreground:'N2-foreground',
			background:'N2-background',
			icon:'N2-icon',
			entities:[
				{type:"ground", name:"suelo", x:500,y:440,width:1000,height:20,isStatic:true},
				{type:"ground", name:"suelo", x:185,y:390,width:30,height:80,isStatic:true},
	
				{type:"block", name:"bloque", x:820,y:380,angle:90,width:100,height:25},
				{type:"block", name:"bloque", x:720,y:380,angle:90,width:100,height:25},
				{type:"block", name:"bloque", x:620,y:380,angle:90,width:100,height:25},
				{type:"block", name:"espiral", x:670,y:317.5,width:100,height:25},
				{type:"block", name:"espiral", x:770,y:317.5,width:100,height:25},				

				{type:"block", name:"espiral", x:670,y:255,angle:90,width:100,height:25},
				{type:"block", name:"espiral", x:770,y:255,angle:90,width:100,height:25},
				{type:"block", name:"bloque", x:720,y:192.5,width:100,height:25},	

				{type:"villain", name:"villano",x:715,y:155,calories:590},
				{type:"villain", name:"villano",x:670,y:405,calories:420},
				{type:"villain", name:"villano",x:765,y:400,calories:150},

				{type:"hero", name:"ciruela",x:30,y:415},
				{type:"hero", name:"melocoton",x:80,y:405},
				{type:"hero", name:"manzana",x:140,y:405},
			]
		},
		{//Tercer nivel 
			foreground:'N3-foreground',
			background:'N3-background',
			icon:'N3-icon',
			entities:[],
		},
		{//Cuarto nivel 
			foreground:'N4-foreground',
			background:'N4-background',
			icon:'N4-icon',
			entities:[],
		},
		{//Quinto nivel 
			foreground:'N5-foreground',
			background:'N5-background',
			icon:'N5-icon',
			entities:[],
		},
		{//Sexto nivel 
			foreground:'N6-foreground',
			background:'N6-background',
			icon:'N6-icon',
			entities:[],
		},
		{//Septimo nivel 
			foreground:'N7-foreground',
			background:'N7-background',
			icon:'N7-icon',
			entities:[],
		}
	],
	//inicializa la pantalla de seleccion de nivel
	init:function(){
		var html="";
		var maxLine = Math.round(levels.data.length/2);
		var cont=0;
		var i=0;
		while(i<levels.data.length){
			html += '<div>';
			while((cont<maxLine)&&(i<levels.data.length)){
				var level = levels.data[i];
				html += '<input type="button" value="'+(i+1)+'" style="background:url(assets/levels/'+level.icon+'.png)no-repeat;background-size: contain;">';
				cont++;
				i++;
			}
			html += '</div>';
			cont=0;
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
	   //Inicializar box2d world cada vez que se carga un nivel
		box2d.init();

		// Declarar un nuevo objeto de nivel actual
		game.currentLevel = {number:number,hero:[]};
		game.score=0;
		$('#score').html('Score: '+game.score);
		game.currentHero = undefined;
		var level = levels.data[number];


		//Cargar las imÃ¡genes de fondo, primer plano y honda
		game.currentLevel.backgroundImage = loader.loadImage("assets/levels/"+level.background+".png");
		game.currentLevel.foregroundImage = loader.loadImage("assets/levels/"+level.foreground+".png");
		game.slingshotImage = loader.loadImage("assets/images/tirachinas.png");
		game.slingshotFrontImage = loader.loadImage("assets/images/tirachinas-front.png");

		// Cargar todas la entidades
		for (var i = level.entities.length - 1; i >= 0; i--){	
			var entity = level.entities[i];
			entities.create(entity);			
		};

		  //Llamar a game.start() una vez que los assets se hayan cargado
	   if(loader.loaded){
		   game.start()
	   } else {
		   loader.onload = game.start;
	   }
	}
}

var entities = {
	definitions:{
		"suelo":{
			density:3.0,
			friction:1.5,
			restitution:0.2,	
		},
		"espiral":{
			shape:"rectangle",
			fullHealth:100,
			density:2.4,
			friction:0.4,
			restitution:0.15,
		},
		"bloque":{
			shape:"rectangle",
			fullHealth:500,
			density:0.7,
			friction:0.4,
			restitution:0.4,
		},
		"pelota":{
			shape:"circle",
			radius:25,
			fullHealth:10000000,
			density:0.1,//peso
			friction:0.5,//asegurar escurre realista
			restitution:1,//rebota mucho
		},
		/*
		"burger":{
			shape:"circle",
			fullHealth:40,
			radius:25,
			density:1,
			friction:0.5,
			restitution:0.4,	
		},
		"sodacan":{
			shape:"rectangle",
			fullHealth:80,
			width:40,
			height:60,
			density:1,
			friction:0.5,
			restitution:0.7,	
		},*/
		"villano":{
			shape:"rectangle",
			fullHealth:50,
			width:40,
			height:50,
			density:1,
			friction:0.5,
			restitution:0.6,	
		},
		"manzana":{ //hero
			shape:"circle",
			radius:25,
			density:1.5,
			friction:0.5,
			restitution:0.4,	
		},
		"melocoton":{ //hero
			shape:"circle",
			radius:25,
			density:1.5,
			friction:0.5,
			restitution:0.4,	
		},
		"ciruela":{ //hero
			shape:"circle",
			radius:15,
			density:2.0,
			friction:0.5,
			restitution:0.4,	
		},
	},
	// Tomar la entidad, crear un cuerpo box2d y añadirlo al mundo
	create:function(entity){
		var definition = entities.definitions[entity.name];	
		if(!definition){
			console.log("Undefined entity name",entity.name);
			return;
		}	
		switch(entity.type){
			case "block": // Rectángulos simples
				entity.health = definition.fullHealth;
				entity.fullHealth = definition.fullHealth;
				entity.sprite = loader.loadImage("assets/estructuras/"+entity.name+"-"+Math.round(Math.random()*(4 - 1) + 1)+".png");
				entity.shape = definition.shape;
				if(definition.shape == "circle"){
					entity.radius = definition.radius;
					box2d.createCircle(entity,definition);
				} else if(definition.shape == "rectangle"){
					box2d.createRectangle(entity,definition);					
				}
				//entity.breakSound = game.breakSound[entity.name];				
				break;
			case "ground": // Rectángulos simples
				// No hay necesidad de salud. Estos son indestructibles
				entity.shape = "rectangle";
				// No hay necesidad de sprites. Éstos no serán dibujados en absoluto 
				box2d.createRectangle(entity,definition);		   
				break;	
			case "hero": // Círculos simples
				var name = entity.name;
				if(entity.name == "ciruela"){
					name = entity.name+"-"+Math.round(Math.random()*(2 - 1) + 1);
				}
				entity.sprite = loader.loadImage("assets/entities/"+name+".png");
				entity.shape = definition.shape;  
				entity.bounceSound = game.bounceSound;
				if(definition.shape == "circle"){
					entity.radius = definition.radius;
					box2d.createCircle(entity,definition);
				}											 
				break;
			case "villain": // Pueden ser círculos o rectángulos
				entity.health = definition.fullHealth;
				entity.fullHealth = definition.fullHealth;
				entity.sprite = loader.loadImage("assets/entities/"+entity.name+"-"+Math.round(Math.random()*(15 - 1) + 1)+".png");
				entity.shape = definition.shape;  
				entity.bounceSound = game.bounceSound;
				if(definition.shape == "circle"){
					entity.radius = definition.radius;
					box2d.createCircle(entity,definition);
				} else if(definition.shape == "rectangle"){
					entity.width = definition.width;
					entity.height = definition.height;
					box2d.createRectangle(entity,definition);					
				}												 
				break;							
			default:
				console.log("Undefined entity type",entity.type);
				break;
		}		
	},
// Tomar la entidad, su posicion y angulo y dibujar en el lienzo de juego
	draw:function(entity,position,angle){
		game.context.translate(position.x*box2d.scale-game.offsetLeft,position.y*box2d.scale);
		game.context.rotate(angle);
		switch (entity.type){
			case "block":
				game.context.drawImage(entity.sprite,0,0,entity.sprite.width,entity.sprite.height,
						-entity.width/2-1,-entity.height/2-1,entity.width+2,entity.height+2);	
			break;
			case "villain":
			case "hero": 
				if (entity.shape=="circle"){
					game.context.drawImage(entity.sprite,0,0,entity.sprite.width,entity.sprite.height,
							-entity.radius-1,-entity.radius-1,entity.radius*2+2,entity.radius*2+2);	
				} else if (entity.shape=="rectangle"){
					game.context.drawImage(entity.sprite,0,0,entity.sprite.width,entity.sprite.height,
							-entity.width/2-1,-entity.height/2-1,entity.width+2,entity.height+2);
				}
				break;				
			case "ground":
				// No hacer nada ... Vamos a dibujar objetos como el suelo y la honda por separado
				break;
		}

		game.context.rotate(-angle);
		game.context.translate(-position.x*box2d.scale+game.offsetLeft,-position.y*box2d.scale);
	}

}
var box2d = {
	scale:30,
	init:function(){
		// Configurar el mundo de box2d que hara la mayoria de los circulos de la fÃ­sica
		var gravity = new b2Vec2(0,9.8); //Declara la gravedad como 9,8 m / s ^ 2 hacia abajo
		var allowSleep = true; //Permita que los objetos que estÃ¡n en reposo se queden dormidos y se excluyan de los cÃ¡lculos
		box2d.world = new b2World(gravity,allowSleep);

		// Configurar depuraciÃ³n de dibujo
		var debugContext = document.getElementById('debugcanvas').getContext('2d');
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(debugContext);
		debugDraw.SetDrawScale(box2d.scale);
		debugDraw.SetFillAlpha(0.3);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);	
		box2d.world.SetDebugDraw(debugDraw);
	
		var listener = new Box2D.Dynamics.b2ContactListener;
		listener.PostSolve = function(contact,impulse){
			var body1 = contact.GetFixtureA().GetBody();
			var body2 = contact.GetFixtureB().GetBody();
			var entity1 = body1.GetUserData();
			var entity2 = body2.GetUserData();

			var impulseAlongNormal = Math.abs(impulse.normalImpulses[0]);
			// Este listener es llamado con mucha frecuencia. Filtra los impulsos muy prqueÃ±os.
			// DespuÃ©s de probar diferentes valores, 5 parece funcionar bien
			if(impulseAlongNormal>5){
				// Si los objetos tienen una salud, reduzca la salud por el valor del impulso			
				if (entity1.health){
					entity1.health -= impulseAlongNormal;
				}	

				if (entity2.health){
					entity2.health -= impulseAlongNormal;
				}	
		
				// Si los objetos tienen un sonido de rebote, reproducirlos				
				if (entity1.bounceSound){
					entity1.bounceSound.play();
				}

				if (entity2.bounceSound){
					entity2.bounceSound.play();
				}
			} 
		};
		box2d.world.SetContactListener(listener);
	},  
	step:function(timeStep){
		// velocidad de las iteraciones = 8
		// posiciÃ³n de las iteraciones = 3
		box2d.world.Step(timeStep,8,3);
	},
	createRectangle:function(entity,definition){
			var bodyDef = new b2BodyDef;
			if(entity.isStatic){
				bodyDef.type = b2Body.b2_staticBody;
			} else {
				bodyDef.type = b2Body.b2_dynamicBody;
			}
			
			bodyDef.position.x = entity.x/box2d.scale;
			bodyDef.position.y = entity.y/box2d.scale;
			if (entity.angle) {
				bodyDef.angle = Math.PI*entity.angle/180;
			}
			
			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = definition.density;
			fixtureDef.friction = definition.friction;
			fixtureDef.restitution = definition.restitution;

			fixtureDef.shape = new b2PolygonShape;
			fixtureDef.shape.SetAsBox(entity.width/2/box2d.scale,entity.height/2/box2d.scale);
			
			var body = box2d.world.CreateBody(bodyDef);	
			body.SetUserData(entity);
			
			var fixture = body.CreateFixture(fixtureDef);
			return body;
	},
	
	createCircle:function(entity,definition){
			var bodyDef = new b2BodyDef;
			if(entity.isStatic){
				bodyDef.type = b2Body.b2_staticBody;
			} else {
				bodyDef.type = b2Body.b2_dynamicBody;
			}
			
			bodyDef.position.x = entity.x/box2d.scale;
			bodyDef.position.y = entity.y/box2d.scale;
			
			if (entity.angle) {
				bodyDef.angle = Math.PI*entity.angle/180;
			}			
			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = definition.density;
			fixtureDef.friction = definition.friction;
			fixtureDef.restitution = definition.restitution;

			fixtureDef.shape = new b2CircleShape(entity.radius/box2d.scale);
			
			var body = box2d.world.CreateBody(bodyDef);	
			body.SetUserData(entity);

			var fixture = body.CreateFixture(fixtureDef);
			return body;
	},  
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