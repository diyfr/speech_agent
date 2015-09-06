'use strict';
var globalTag="";
var globalRunning =false;
var globalCallback;

/**
	Fonction Asynchrone chargeant la liste des plugins et les teste 1 par 1
	le résultat du test et transmis par la fonction testPlugin à  la fonction notifyResponse
	@pluginsFolder 	: chemin vers les plugins
	@speech			: phrase à  soumettre à  l'ensemble de ces règles
*/
function getListGrammar(pluginsFolder,speech,callback){
	globalRunning =true;
	globalTag ="";
	globalCallback=callback;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", pluginsFolder, true);
	xmlhttp.onreadystatechange=function() {
		if (xmlhttp.readyState === 4){  
			if(xmlhttp.status === 200){ 
				var response = xmlhttp.responseText;
				var regex = /href="(.*?)"/igm;
				var result =[];
				var match =regex.exec(response);
				while(match!=null){
					if (match[1].search("\\?")==-1){
						result.push(pluginsFolder+match[1]+match[1].replace("/",".xml"));
					}
					match=regex.exec(response);
				}
				testPlugin(result,speech);
			} else {
				console.log("Le répertoire "+pluginsFolder+" n'existe pas("+xmlhttp.status+")");
				notifyResponse(null,null,null);
			}
		} 
		return xmlhttp.readyState;
	}
	xmlhttp.send();
}

/**
	Fonction Asynchrone soumettant la phrase au premier plugin de la liste
	Si le résultat est concluant, il est transmis à  la fonction notifyResponse
	@list 	: tableau de String contenant un ensemble de chemin vers les fichiers XML des plugins
	@speech : phrase à  soumettre à  l'ensemble de ces règles
*/
function testPlugin(list,speech){
	if (list.length==0){
		notifyResponse(null,null,null);
	}else{
		
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", list[0], true);
		xmlhttp.onreadystatechange=function() {
			if (xmlhttp.readyState === 4){
				var current =list.splice(0,1);
				if(xmlhttp.status === 200){
					var xmlDoc = xmlhttp.responseXML;
					var rule = findRule(xmlDoc,speech.trim());
					if (rule){
						notifyResponse(current,rule,globalTag);
					}else{
						testPlugin(list,speech);
					}
				}else{
					testPlugin(list,speech);
				}
			}
			return xmlhttp.readyState;
		};
		xmlhttp.send(null);
	}
}	

/**
	Fonction permettant de notifier à  l'utilisateur le résultat de la rechercher
	@pluginPath : chemin du fichier XML contenant la règle
	@rule 		: règle appliquée
	@script		: script résultant des règles appliquées
*/
function notifyResponse(pluginPath,rule,script){
	console.log(rule);
	console.log(script);
	globalCallback(script);
	globalRunning =false;
}

/**
	Teste un ensemble de règles contenues dans un fichier XML en fonction d'une phrase
	@xmlDoc : Document parsé
	@words 	: phrase à  tester
	-> Retourne une règle si concluant
 */
function findRule(xmlDoc, words) {
	var rules = xmlDoc.getElementsByTagName('rule');
	var tag = xmlDoc.getElementsByTagName('tag')[0];
	var i;
	var result;
	var splitWords = words.trim().split(' ');
	if (rules) {
		for (i = 0; i < rules.length; i++) {
			globalTag ="";
			if (tag && tag.firstChild && tag.firstChild.wholeText ){
				globalTag =tag.firstChild.wholeText;
			}	
			console.log("Test rule :"+rules[i].getAttribute("id"));
			if (checkRule(xmlDoc,rules[i], splitWords) >= splitWords.length) {
				result = rules[i];
				console.log("Find :"+ rules[i].getAttribute("id"));
				console.log(globalTag);
				break;
			}
		}
	}
	return result;
}


/**
	Fonction permettant de retourner une règle par référence contenue dans un document parsé
	@xmlDoc : Document xml Parsé
	@ruleId : Id de la règle
	-> Retourne une règle

*/
function getRule(xmlDoc, ruleId) {
	var rules = xmlDoc.getElementsByTagName('rule');
	var i;
	var result;
	if (rules) {
		for (i = 0; i < rules.length; i++) {
			var id = rules[i].getAttribute("id");
			if (id && id == ruleId){
				result = rules[i];
				break;
			}
		}
	}
	return result;
}


/**
	Teste une règle en fonction d'une phrase
	@xmlDoc 	: Document xml Parsé
	@rule 		: Id de la règle
	@splitWords : Tableau de string représentant la phrase ou partie de phrase à  soumettre
	-> Retourne  position actuelle dans la phrase
 */
function checkRule(xmlDoc,rule, splitWords) {
	var currentPos = 0;
	for (var j = 0; j < rule.childElementCount; j++) {
		//console.log('CurrentPos =' + currentPos);
		var tempPos = checkElement(xmlDoc,rule.children[j],splitWords.slice(currentPos, splitWords.length));
		//console.log("checkRule tempPos:"+tempPos +" on "+splitWords.slice(currentPos, splitWords.length));
		if (tempPos ==-1){
			break;
		}else if (tempPos>=0){
			currentPos += tempPos+1;
		}
		/*
		if (currentPos >= splitWords.length) {
			break;
		}*/
	}
	
	return currentPos;
}

/**
	Fonction traitant un éléement d'une règle
	@xmlDoc 	: Document xml Parsé
	@element	: Element XML à  traiter
	@splitWords : Tableau de string représentant la phrase ou partie de phrase à  soumettre
	-> Retourne  position actuelle dans la phrase
*/
function checkElement(xmlDoc, element, splitWords) {
	// console.log("CheckElement:"+element.tagName);
	var result =-1;
	if (element.tagName === "example") {
		result =-2;
	}
	if (element.tagName === "tag") {
		result =-2;
		globalTag += element.firstChild.wholeText.trim();
		//console.log("TAG:"+element.firstChild.wholeText.trim());
	}
	if (element.tagName === "item") {
		var attrRepeat = element.getAttribute('repeat');
		var repeat = (attrRepeat)?attrRepeat.split('-'):null;
		var tempPos = checkItem(xmlDoc,element, splitWords);
		// console.log("CheckElement tempPos="+tempPos);
		if (repeat)
		{
			if (parseInt(repeat[0])==0 && tempPos==-1){
					// console.log("Optionnel");
					result = -2;
			}
			if (parseInt(repeat[0])==0 && tempPos!=-1){
					result = tempPos;
			}
			if (parseInt(repeat[0])>0 && tempPos!=-1){
				var currentPos =tempPos;
				for (var p =0; p < parseInt(repeat[0]);p++){
					tempPos = checkItem(xmlDoc,element, splitWords.slice(currentPos+1, splitWords.length));
					if (tempPos !=-1){
						currentPos += tempPos;
					}else{
						currentPos=-1;
						break;
					}
				}
				result = currentPos;
			}
			if (result >=0){
				if(repeat[1]){
					if (parseInt(repeat[1])>1){
						for (var i=0;i<parseInt(repeat[1]);i++){
							tempPos = checkItem(xmlDoc,element, splitWords.slice(result+1, splitWords.length));
							if (tempPos !=-1){
								result += tempPos;
							}else{
								break;
							}
						}
					}	
				}else{
					var stop = false;
					while(!stop || result < splitWords.length){
						tempPos = checkItem(xmlDoc,element, splitWords.slice(result+1, splitWords.length));
						if (tempPos !=-1){
							result += tempPos;
						}else{
							stop=true;
						}
					}
				}
			}
		}else{
			if (tempPos >=0) {
				result= tempPos;
				// console.log("Item :" + element.firstChild.textContent);
			} 
		}
		// console.log("Result :"+result);
	}
	if (element.tagName === "one-of") {
		var tempPos = checkOneOf(xmlDoc,element, splitWords)
		if (tempPos >=0) {
			result = tempPos;
		} 
	}
	if (element.tagName === "ruleref") {
		// special = GARBAGE | uri = #idRule
		var uri = element.getAttribute('uri').replace('#','');
		if (uri){
			// console.log("Search :"+uri+" with "+splitWords+" ["+splitWords.length+"]" );
			var rule = getRule(xmlDoc,uri);
			if (rule){
				result = checkRule(xmlDoc,rule,splitWords)-1;
				// console.log("Rule :"+uri +" Return :"+result);
			}
		}else{
			var special = element.getAttribute('special');
			if (special && special=="GARBAGE"){
				//todo : A traiter, car il faut tenter d'appliquer les élements suivant
			}
		}
	}
	return result;
}

/**
	Fonction Comparant un item avec une partie de phrase
	@child : child 
	@words : string représentant la partie de la phrase
	-> Retourne  position actuelle dans la phrase
 */
function checkItem(xmlDoc,child, splitWords) {
	var result = -1;
	if (child.childElementCount != 0) {
		var next =true;
		if(child.firstChild.textContent && child.firstChild.textContent.trim().length>0 )
		{
			result = checkItemValue(child.firstChild.textContent, splitWords);
			if (result ==-1){
				next =false;
			}
		}
		if (next){
			for (var j = 0; j < child.childElementCount; j++) {
				var tempPos = checkElement(xmlDoc,child.children[j],splitWords.slice(result+1, splitWords.length));
				// console.log("Result subItem:"+tempPos);
				if (tempPos ==-1){
					result=-1;
					break;
				}else if (tempPos>=0){
					if (result ==-1){
						result = tempPos;
					}else{
						result += tempPos + 1;	
					}
				}
				if (result >= splitWords.length) {
					break;
				}
			}
		}
	} else {
		result = checkItemValue(child.textContent, splitWords);
	}
	return result;
}

/**
	Fonction Comparant  en ensemble d'options avec la partie de phrase
	ou -1 si non trouvée
	@child : child one-off
	@words : string représentant la partie de la phrase
	-> Result : la position actuelle du dernier mot trouvé dans la phrase.
 */
function checkOneOf(xmlDoc,child, words) {
	var result = -1;
	for (var k = 0; k < child.childElementCount; k++) {
		var tempPos = checkElement(xmlDoc,child.children[k],words);
			if (tempPos != -1) {
				result = tempPos;
				break;
			}
	}
	// console.log("Result OneOf :"+result);
	return result;
}

/**
	Fonction Comparant la valeur d'un item avec une liste de mot
	returne la position actuelle du dernier mot trouvé dans la phrase.
	@itemValue = chaine de caractère à  rechercher
	@splitWords = partie de la phrase à  traitée
	-> result = -1 si non trouvé|| position actuelle dans la phrase
 */

function checkItemValue(itemValue, splitWords) {
	var result = -1;
	var splitItem = itemValue.trim().split(' ');
	// console.log("Check :" + splitItem + "- On words:" + splitWords);
	if (splitWords.length >= splitItem.length) {
		for (var pos = 0; pos < splitItem.length; pos++) {
			// console.log("Compare ->" + splitItem[pos] + ":" + splitWords[pos]);
			if (splitItem[pos] == splitWords[pos]) {
				result = pos;
			} else {
				result = -1;
				break;
			}
		}
	}
	return result;

}
