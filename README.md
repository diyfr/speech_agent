# speech_agent
BETA : Test de création d'un agent de reconnaissance vocale à partir des fonctions speech introduites par HTML5

Pour public averti... Travaux en cours

##SpeechRecognition
Récupérez le dossier, et testez la page HTML depuis un serveur local (type mongoose :https://github.com/cesanta/mongoose)
Déconnecté du réseau ça fonctionne....

##Grammar
L'objectif est de récupérer la grammaire à appliquer en fonction d'une phrase :
/**
	Fonction Asynchrone chargeant la liste des plugins et les teste 1 par 1
	le résultat du test et transmis par la fonction testPlugin Ã  la fonction notifyResponse
	@pluginsFolder 	: chemin vers les plugins
	@speech			: phrase Ã  soumettre Ã  l'ensemble de ces rÃ¨gles
*/
function getListGrammar(pluginsFolder,speech)

exemple : var result = ('plugins/','Sarah il est quelle heure');
Un petit coup d'oeil sur la console s'impose...

NOTA : je n'ai pas encore traiter la balise <garbage> qui risque de nécessité du refactoring..
