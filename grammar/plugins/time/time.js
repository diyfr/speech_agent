function action(callback){
	var date = new Date();
	var text = 'il est ' + date.getHours() + ' heure ';
	if (date.getMinutes() > 0){ 
	  text += date.getMinutes();
	}
	callback({'tts': text});
}