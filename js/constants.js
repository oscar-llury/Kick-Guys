function getLit(lit,language){
	switch (language){
		case 'esp':{
			switch (lit){
				case 'LIT_play_game': return 'Jugar';
				case 'LIT_open_settings': return 'Ajustes';
				case 'LIT_img_language': return 'assets/images/esp.png';
				
			/*setting screen*/
				case 'LIT_settings': return 'Ajustes de usuario';
				case 'LIT_settings_language': return 'Seleccionar idioma';
				case 'LIT_settings_save': return 'Guardar';
				
			/*select level screen*/
				case 'LIT_select_nivel': return 'Selecciona un nivel';
				case 'LIT_loaded_media_1': return 'Cargados ';
				case 'LIT_loaded_media_2': return' de ';

			/*game screen*/
				case 'LIT_score': return 'Puntos: ';
				case 'LIT_ballsmessage': return 'Tienes más de 1000 puntos, quieres gastar todos tus puntos en una pelota extra?';
				case 'LIT_yesbutton': return 'SÍ';
				case 'LIT_nobutton': return 'NO';
			/*end level screen*/
				case 'LIT_level_complete': return 'Nivel completado!!';
				case 'LIT_play_next_level': return 'Siguiente nivel';
				case 'LIT_replay_level': return 'Volver a jugar';
				case 'LIT_return_level_screen': return 'Seleccionar otro nivel';
				case 'LIT_no_more_levels': return 'Enhorabuena, fin del juego!!';
				case 'LIT_fail_level': return 'Nivel fallido';
			}
		};
		case 'eeuu':{
			switch (lit){
				case 'LIT_play_game': return 'Play';
				case 'LIT_open_settings': return 'Settings';
				case 'LIT_img_language': return 'assets/images/eeuu.png';
				
			/*setting screen*/
				case 'LIT_settings': return 'User settings';
				case 'LIT_settings_language': return 'Select language';
				case 'LIT_settings_save': return 'Save';
				
			/*select level screen*/
				case 'LIT_select_nivel': return 'Select a level';
				case 'LIT_loaded_media_1': return 'Loaded ';
				case 'LIT_loaded_media_2': return' of ';


			/*game screen*/
				case 'LIT_score': return 'Score: ';
				case 'LIT_ballsmessage': return 'You have more than 1000 points, do you want to waste all your points on extra ball?';
				case 'LIT_yesbutton': return 'YES';
				case 'LIT_nobutton': return 'NO';
			/*end level screen*/
				case 'LIT_level_complete': return 'Level completed!!';
				case 'LIT_play_next_level': return 'Next level';
				case 'LIT_replay_level': return 'Replay level';
				case 'LIT_return_level_screen': return 'Select other level';
				case 'LIT_no_more_levels': return 'Congratulations, game finished!!';
				case 'LIT_fail_level': return 'Level failed';
			}
		};
	}
}