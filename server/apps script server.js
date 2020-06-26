// WebApplication di Donboscoland.cloud per gestire più Caccie al Tesoro
// Author: @Marco Canale, https://github.com/mcanale/
// Version: 2.10 del 23 giu 2020

// Link: https://script.google.com/macros/s/AKfycbxYPw_W69bPB13Db_bO71j8Y-5WvGjwH2sHrzoO4fudWnQwpQd2/exec
// Get Squadre: https://script.google.com/macros/s/AKfycbxYPw_W69bPB13Db_bO71j8Y-5WvGjwH2sHrzoO4fudWnQwpQd2/exec?caccia=rpsu&action=teams
// Get Percorso: https://script.google.com/macros/s/AKfycbxYPw_W69bPB13Db_bO71j8Y-5WvGjwH2sHrzoO4fudWnQwpQd2/exec?caccia=rpsu&team=1&tappa=1


const ssCaccieId = '1L6yjB5iFx6P0hRUgnXwxb-KbhA0vKPZ4niWMSKLcoqM';  // id dello Sheet con l'elenco delle Caccie al Tesoro

// funzione che risponde alle richieste get: elenco dei team oppure i dati della tappa
function doGet(e) { 
  Logger.log(JSON.stringify(e));
  const params = e.parameter; // nb sono tutti stringhe
  
  // recupera lo SpreadSheet della Caccia al Tesoro indicata
  if (!params.caccia) params.caccia = 'rpsu'; // se è vuoto utilizza la Caccia al Tesoro di Prova
  const spreadsheet = recuperaSpreadsheetCaccia(params.caccia);
  if (!spreadsheet) return formatBadResponse('Error: caccia '+ params.caccia + ' does not exist.');
  
  // recupera tutte le opzioni e tra queste salva il titolo
  const sheetOpzioni = spreadsheet.getSheetByName('opzioni');
  const opzioniMatrix = sheetOpzioni.getDataRange().getValues();
  const title = opzioniMatrix[0][1];    // <- cambiato riferimento opzione
  
  // controlla che la caccia al tesoro sia attiva
  const attiva = opzioniMatrix[2][1];    // <- cambiato riferimento opzione
  if (!attiva) return formatBadResponse('Errore: caccia ' + title + ' non attiva.');
  
  // carica tutti i dati dei percorsi
  const sheetPercorsi = spreadsheet.getSheetByName('percorsi');
  const percorsiMatrix = sheetPercorsi.getDataRange().getValues();
  
  // controlla se la richiesta è quella di sapere l'elenco dei teams
  if (params.action == 'teams') {
    // controlla l'impostazione delle iscrizioni al volo
    const iscrizioniAlVolo = opzioniMatrix[4][1];    // <- cambiato riferimento opzione
    if (iscrizioniAlVolo) 
      return ContentService.createTextOutput(JSON.stringify( {title: title, inscription: true} )).setMimeType(ContentService.MimeType.JSON);
    // caso iscrizioni con scelta della squadra
    percorsiMatrix.shift();
    let teams = percorsiMatrix.map(row => {
      return row[1];
    });
    return ContentService.createTextOutput(JSON.stringify( {title: title, teams: teams} )).setMimeType(ContentService.MimeType.JSON);
  }
  
  // caso di richiesta della tappa del percorso
  // controlla i parametri ricevuti e determina il numero totale di tappe (stages) che può variare se una squadra ha un percorso abbreviato
  const team = parseInt(params.team);
  const tappa = parseInt(params.tappa);
  if (!team || !tappa) return formatBadResponse('Error: Parameter team or tappa not specified or not a numbers.');
  if (team<1 || team>=percorsiMatrix.length) return formatBadResponse('Error: Parameter team not correct.');
  // se una squadra ha un percoro abbreviato restituisce un numero, altrimenti -1
  const indiceVuoto = percorsiMatrix[team].indexOf(''); 
  const stages = indiceVuoto == -1 ? percorsiMatrix[0].length-2 : indiceVuoto-2;
  if (tappa<1 || tappa>stages) return formatBadResponse('Error: Parameter tappa not correct.');
  // se è all'inizo della prima tappa segna l'orario di inizio della gara della squadra
  if (tappa == 1)
    segnaOrarioGara(spreadsheet, team, 0); // tappa 0 = colonna inizio
  
  // controlla che le tappe precedenti siano state fatte
  const sheetGara = spreadsheet.getSheetByName('gara');
  const garaMatrix = sheetGara.getDataRange().getValues();
  const tappaPredecente = garaMatrix[team][tappa+1];
  if (!tappaPredecente) return formatBadResponse('Error: Previous stage not done.');

  // recupera i dati del luogo indicato nel percorso
  const indiceLuogo = percorsiMatrix[team][tappa+1];
  const sheetLuoghi = spreadsheet.getSheetByName('luoghi');
  const luoghiMatrix = sheetLuoghi.getDataRange().getValues();
  const luogo = luoghiMatrix[indiceLuogo];
  
  // recupera la distanza massima consentita, se mostrare le coordinate, se mostrare l'indovinello, se mostrare la domanda
  const maxDistance = opzioniMatrix[3][1];    // <- cambiato riferimento opzione
  const showCoordinates = opzioniMatrix[8][1];    // <- cambiato riferimento opzione
  const showRiddle = opzioniMatrix[9][1];    // <- cambiato riferimento opzione
  const showQuestion = opzioniMatrix[12][1];
  
  // recupera se mostrare la foto e l'url della foto stessa
  const showImage = opzioniMatrix[10][1];    // <- cambiato riferimento opzione
  let imageUrl = '';
  if (showImage) {
    const imagesFolderId = opzioniMatrix[11][1];    // <- cambiato riferimento opzione
    const imagesFolder = DriveApp.getFolderById(imagesFolderId);
    const imageName = luogo[7];
    const files = imagesFolder.getFilesByName(imageName);
    if (files.hasNext()) { 
      const file = files.next(); 
      Logger.log(file.getName());
      imageUrl = file.getDownloadUrl();
    }
  }
  
  // formatta l'oggetto da restituire e lo invia
  const luogoJson = JSON.stringify(formatResponse(percorsiMatrix[team][1], stages, luogo, maxDistance, showCoordinates, showRiddle, showImage, imageUrl, showQuestion));
  Logger.log(luogoJson);
  return ContentService.createTextOutput(luogoJson).setMimeType(ContentService.MimeType.JSON); 
}

// funzione che recupera prima l'id e poi apre lo SpreadSheet dal rispettivo codice caccia
// restituisce l'id dello ss oppure null se non lo trova
function recuperaSpreadsheetCaccia(codeCaccia) {
  // cerca di recuperare il codice dalla memoria cache
  const cache = CacheService.getScriptCache();
  codeCaccia = codeCaccia.toLowerCase();
  let idCaccia = cache.get(codeCaccia);
  // se il codice non era nella cache lo va a prendere dal foglio di calcolo
  if (idCaccia == null) {  
    const ssCaccie = SpreadsheetApp.openById(ssCaccieId);  
    const sheetCaccie = ssCaccie.getSheetByName('caccie');
    const caccieMatrix = sheetCaccie.getDataRange().getValues();
    const codici = caccieMatrix.map(row => { return row[0].toLowerCase() });
    codici.shift();
    const rowCaccia = codici.indexOf(codeCaccia) + 2;
    // caso che il codice non ci sia (indexOf == -1) restituisce null
    if (rowCaccia == 1) 
      return null;
    idCaccia = sheetCaccie.getRange(rowCaccia, 2).getValue();
    cache.put(codeCaccia, idCaccia, 3600); // salva in cache per 1 ora
    sheetCaccie.getRange(rowCaccia, 5).setValue(new Date().toLocaleDateString()); // salva che oggi è l'ultima volta che il codice è stato usato
  }
  // apre lo ss e ne restituisce l'oggetto
  const ssCaccia = SpreadsheetApp.openById(idCaccia);  
  Logger.log(ssCaccia.getName());
  return ssCaccia;
}

// funzione che formatta l'array della tappa in un oggetto con i campi nominati prima di restituirlo
function formatResponse(team, stages, luogo, maxDistance, showCoordinates, showRiddle, showImage, imageUrl, showQuestion) {
  let response = {
    team: team,
    stages: stages,
    latitude: luogo[1],
    longitude: luogo[2],
    maxDistance: maxDistance,
    showCoordinates: showCoordinates,
    showRiddle: showRiddle,
    riddle: luogo[6],
    showImage: showImage,
    imageUrl: imageUrl,
    showQuestion: showQuestion,
    question: luogo[4],
    answer: luogo[5],
  };
  return response;
}

// funzione che formatta una risposta di errore e restituisce l'oggetto già pronto per essere restituito
function formatBadResponse(message) {
  let response = {
    error: true,
    message: message,
  };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON); 
}

// funzione che segna l'orario di gara in un determinato team e tappa
function segnaOrarioGara(spreadsheet, team, tappa) {
  const ora = new Date().toLocaleTimeString();
  const sheetGara = spreadsheet.getSheetByName('gara');
  sheetGara.getRange(team+1, tappa+3).setValue(ora);
}


// risponde alla richiesta post, che è usata per 
// inserire una caccia al tesoro, assegnare l'ora in cui viene superata una tappa e per iscrivere una persona
function doPost(e) {  
  Logger.log(JSON.stringify(e));
  const params = JSON.parse(e.postData.contents);  // ATTENZIONE!! Fare JSON.parse()!!!
  
  // caso inserimento caccia al tesoro
  if (params.action == 'insert') {
    const sheetCaccie = SpreadsheetApp.openById(ssCaccieId).getSheetByName('caccie');
    // tenta di aprire l'url del foglio inviato
    try {
      const ss = SpreadsheetApp.openByUrl(params.url);
      var id = ss.getId(); // NB uso var invece che const perchè altrimenti lo scope di id e email è solo dentro il try
      // controlla se la caccia al tesoro è già presente
      const indiceId = stringaPresente(sheetCaccie, 1, id);
      if ( indiceId != -1 ) {
        const caccieMatrix = sheetCaccie.getDataRange().getValues();
        const teamCode = caccieMatrix[indiceId+1][0];
        return ContentService.createTextOutput(teamCode); 
      } 
      var email = ss.getEditors()[0].getEmail(); // NB uso var per questioni di scope
    } catch(error) {
      return ContentService.createTextOutput(1);
    }
    // genera il codice e inserisce tutti i dati
    const data = new Date().toLocaleDateString();
    const teamCode = generaCodice(sheetCaccie);
    sheetCaccie.appendRow([teamCode, id, data, email]);
    // restituisce il codice in modo tale che possa essere usato
    return ContentService.createTextOutput(teamCode); 
  }

  // casi superamento tappa o iscrizione persona
  // in entrambi i casi recupera lo SpreadSheet della Caccia al Tesoro indicata
  if (!params.caccia) params.caccia = 'rpsu'; // se è vuoto utilizza la Caccia al Tesoro di Prova
  const spreadsheet = recuperaSpreadsheetCaccia(params.caccia);
  if (!spreadsheet) return formatBadResponse('Error: caccia '+ params.caccia + ' does not exist.');

  // caso di segnale di superamento della tappa
  if (params.action == 'segnaleTappa') {
    segnaOrarioGara(spreadsheet, parseInt(params.team), parseInt(params.tappa))
    return ContentService.createTextOutput(0); 
  }
  
  // caso di iscrizione al volo di una persona
  if (params.action == 'iscrizione') {
    // recupera l'opzione se usare i percorsi al volo preimpostati
    const sheetOpzioni = spreadsheet.getSheetByName('opzioni');
    const opzioniMatrix = sheetOpzioni.getDataRange().getValues();
    const preimpostati = opzioniMatrix[7][1];    // <- cambiato riferimento opzione
    
    // caso del percorso preso da quelli preimpostati
    let percorso;
    if (preimpostati) {
      // cerca di recuperare l'id dell'ultimo percorso usato dalla memoria cache
      const cache = CacheService.getScriptCache();
      const keyIdPercorso = params.caccia+'_idPercorso';
      let idPercorso = cache.get(keyIdPercorso);
      // se non c'è parte dal primo altrimenti prende il percorso recuperato
      idPercorso = idPercorso == null ? 1 : parseInt(idPercorso);
      // memorizza nella cache il percorso successivo
      const sheetPercorsiAlVolo = spreadsheet.getSheetByName('percorsiAlVolo');
      const numPercorsi = sheetPercorsiAlVolo.getLastRow()-1;
      const proxPercorso = idPercorso+1 > numPercorsi ? 1 : idPercorso+1;
      cache.put(keyIdPercorso, proxPercorso, 3600); // salva in cache per 1 ora, poi ripartirà dal primo percorso
      // recupera il prercorso corrispondente
      percorso = sheetPercorsiAlVolo.getRange(idPercorso+1, 2, 1, sheetPercorsiAlVolo.getLastColumn()-1).getValues()[0];
    } else { 
      // caso percorso creato a caso
      percorso = creaPercorso(spreadsheet); 
    }
    
    // inserisce l'iscritto e il percorso
    const sheetPercorsi = spreadsheet.getSheetByName('percorsi');
    const teamCode = sheetPercorsi.getLastRow();
    const rowToInsert = [teamCode, params.name].concat(percorso);
    sheetPercorsi.getRange( teamCode+1, 1, 1, rowToInsert.length).setValues([ rowToInsert ]);
    // prepara la riga per la gara    
    const sheetGare = spreadsheet.getSheetByName('gara');
    sheetGare.getRange( teamCode+1, 1, 1, 2).setValues([ [teamCode, params.name] ]);
    // restituisce il codice della squadra, così può reindirizzare al link del percorso
    return ContentService.createTextOutput(teamCode); 
  }
  
  // caso azione non prevista
  return formatBadResponse('Error: Parameter action not specified or not correct.');
}

// funzione che crea un percorso (caso di iscrizione al volo)
function creaPercorso(spreadsheet) {
  // recupera il numero di tappe, se i percorsi devono essere tutti uguali, e il numero dei luoghi inseriti
  const opzioni = spreadsheet.getSheetByName('opzioni').getRange(6, 2, 2).getValues();    // <- cambiato riferimento opzione
  const numTappe = opzioni[0][0];
  const percorsiUguali = opzioni[1][0];
  const numeroLuoghi = spreadsheet.getSheetByName('luoghi').getLastRow()-1;
  
  // costruisce l'array con tutte le tappe (e la prima alla fine)
  let percorso = [];
  for (let i = 2; i <= numeroLuoghi; i++)
    percorso.push(i);
  // se i percorsi devono essere diversi li mescola
  if (!percorsiUguali) 
    percorso.sort(function(a, b){return 0.5 - Math.random()});
  // seleziona solo il numero di tappe necessaria (tranne una), mette come ultima tappa qualla finale uguale per tutti
  percorso = percorso.slice(0, numTappe-1);
  percorso.push(1);
  
  return percorso;
}

// funzione che genera un codice a caso, controllando che non ci sia già, uguale a quella che c'è dentro lo Sheet delle Caccie al Tesoro
function generaCodice(sheetCaccie) {
  let codice = '';
  const caratteri = 'abcdefghmnpqrstuz23456789';
  let nuovo = false;
  while (!nuovo) {
    let indiceCarattere = -1;
    for (let i = 0; i < 4; i++) {
      indiceCarattere = Math.floor( Math.random() * caratteri.length );
      codice += caratteri[indiceCarattere];
    }
    if ( stringaPresente(sheetCaccie, 0, codice) == -1 )
      nuovo = true;
  }
  return codice;
}

// funzione che controlla se un codice o un id sheet è nuovo, uguale a quella che c'è dentro lo Sheet delle Caccie al Tesoro
function stringaPresente(sheetCaccie, colonna, stringa) {
  const caccieMatrix = sheetCaccie.getDataRange().getValues();
  const stringhe = caccieMatrix.map(row => { return row[colonna] });
  stringhe.shift(); // toglie la prima che è l'intestazione
  return stringhe.indexOf(stringa);
}


