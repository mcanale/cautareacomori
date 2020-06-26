// WebApplication di Donboscoland.cloud per gestire più Caccie al Tesoro
// Author: @Marco Canale, https://github.com/mcanale/
// Version: 2.10 del 23 giu 2020


// funzione richiamata dall'utente che carica i nomi di tutti i file nella cartella delle foto 
function caricaNomiFoto() {
  // recupera l'id della cartella delle foto e recupera tutti i file al suo interno
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const idCartellaFoto = ss.getSheetByName('opzioni').getRange(12, 2).getValue();    // <- cambiato riferimento opzione
  const cartellaFoto = DriveApp.getFolderById(idCartellaFoto);
  const fotoIterator = cartellaFoto.getFiles();
  // scorre tutti i nomi dei file e li mette in una matrice
  let nomiFile = [];
  while (fotoIterator.hasNext()) {
    var fotoCorrente = fotoIterator.next();
    var nomeFotoCorrente = fotoCorrente.getName();
    // Logger.log(nomeFotoCorrente);
    nomiFile.push([nomeFotoCorrente]);
  }
  // li scrive nel foglio dei luoghi
  const sheetLuoghi = ss.getSheetByName('luoghi');
  sheetLuoghi.getRange( 2, 8, nomiFile.length).setValues(nomiFile);
}


// funzione richiamata dall'utente una volta sola per ottenere il codice della caccia al tesoro
function ottieniCodiceCaccia() {
  // condivide il file con il programma di Donboscoland
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.addEditor('marco@donboscoland.it');
  
  // chiede alla webapp di inserire questa Caccia al Tesoro e ottiene il codice 
  const data = {
    action: 'insert',
    url: ss.getUrl(),
  }
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(data),
  }
  const response = UrlFetchApp.fetch('https://script.google.com/macros/s/AKfycbxYPw_W69bPB13Db_bO71j8Y-5WvGjwH2sHrzoO4fudWnQwpQd2/exec', options);
  
  // recupera la risposta (il codice) e lo scrive sul foglio opzioni
  const code = response.getContentText();
  Logger.log(code);
  ss.getSheetByName('opzioni').getRange(2, 2).setValue(code.toUpperCase());     // <- cambiato riferimento opzione
}


// funzione richiamata dall'utente che condivide la cartella con le foto
function condividiCartellaFoto() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Inserisci il link della cartella con le foto:');
  if (response.getSelectedButton() != ui.Button.OK) return;
  const linkCartellaFoto = response.getResponseText().trim(); // es. https://drive.google.com/drive/folders/1l8-shuoyPJgAKF_M0HIMRKmeBDxJLI82

  // recupera la parte con l'id e lo scrive sul foglio opzioni
  const idCartellaFoto = linkCartellaFoto.slice( linkCartellaFoto.lastIndexOf('/')+1 );
  Logger.log(idCartellaFoto);
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('opzioni').getRange(12, 2).setValue(idCartellaFoto);    // <- cambiato riferimento opzione
  
  // condivide la cartella con chiunque abbia il link
  DriveApp.getFolderById(idCartellaFoto).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
}


// funzione richiamata dall'utente che semplifica l'aggiunta delle coordinate di un luogo
function aggiungiLuogo() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Coordinate (entrambe) in formato Maps:');
  if (response.getSelectedButton() != ui.Button.OK) return;
  const stringaCoordinate = response.getResponseText(); // es. 45.490511, 12.205729
  
  const arrayCoordinate = stringaCoordinate.split(',');
  const latitudine = arrayCoordinate[0].trim().replace('.', ',');
  const longitudine = arrayCoordinate[1].trim().replace('.', ',');
  
  const sheetLuoghi= SpreadsheetApp.getActiveSpreadsheet().getSheetByName('luoghi');

  // trova la prima casella vuota della colonna latitudini  
  const latitudiniMatrix = sheetLuoghi.getRange(1, 2, sheetLuoghi.getLastRow()).getValues();
  const rigaVuota = latitudiniMatrix.findIndex( value => { 
    return !value[0];
  });
  
  sheetLuoghi.getRange( rigaVuota+1, 1, 1, 3).setValues([[rigaVuota, latitudine, longitudine]]);
}


// funzione richiamata dall'utente che crea tutti i percorsi (tutti uguali o a caso a seconda dell'opzione)
function creaPercorsi() {  
  const ss= SpreadsheetApp.getActiveSpreadsheet();
  // recupera il numero di luoghi possibili
  const numeroLuoghi = ss.getSheetByName('luoghi').getLastRow()-1;
   
  // crea l'array con i codici di tutte le tappe
  let codiciLuoghi = [];
  for (let i = 0; i < numeroLuoghi; i++) {
    codiciLuoghi.push(i+1);
  }
    
  // recupera il numero di tappe e se i percorsi devono essere tutti uguali
  const opzioni = ss.getSheetByName('opzioni').getRange(6, 2, 2).getValues();     // <- cambiato riferimento opzione
  const numTappe = opzioni[0][0];
  const percorsiUguali = opzioni[1][0];
  
  // crea la matrice dei percorsi da inserire e ci mette l'intestazione
  let percorsiMatrix = [];
  let intestazioneTappe = [];
  for (let i = 0; i < numTappe; i++) {
    intestazioneTappe.push('Tappa ' + (i+1));
  }
  percorsiMatrix.push(intestazioneTappe);
    
  // recupera il numero delle squadre
  let sheetPercorsi = ss.getSheetByName('percorsi');
  let numSquadre = sheetPercorsi.getLastRow()-1;
    
  // crea i percorsi
  for (let i = 0; i < numSquadre; i++) {
    const percorso = creaPercorso(i+1, codiciLuoghi, numTappe, percorsiUguali);    
    percorsiMatrix.push(percorso);
  }
  
  // scrive i percorsi sul foglio di calcolo e mette in grassetto i titoli
  const squadre = sheetPercorsi.getRange(1, 1, numSquadre+1, 2).getValues();
  sheetPercorsi.clear();
  sheetPercorsi.getRange(1, 1, squadre.length, 2).setValues(squadre);
  sheetPercorsi.getRange(1, 1, squadre.length, 2).setFontWeight('bold');
  sheetPercorsi.getRange(1, 3, percorsiMatrix.length, numTappe).setValues(percorsiMatrix);  // numTappe == percorsiMatrix[0].length
  sheetPercorsi.getRange(1, 3, 1, numTappe).setFontWeight('bold');
  
  // prepara il foglio per la gara
  const sheetGare = ss.getSheetByName('gara');
  sheetGare.clear();
  sheetGare.getRange(1, 1, squadre.length, 2).setValues(squadre);
  sheetGare.getRange(1, 1, squadre.length, 2).setFontWeight('bold');
  intestazioneTappe.splice(0, 0, 'Inizio');
  sheetGare.getRange(1, 3, 1, numTappe+1).setValues([intestazioneTappe]);  // numTappe+1 == intestazioneTappe.length
  sheetGare.getRange(1, 3, 1, numTappe+1).setFontWeight('bold');
  
  // scrive l'intestazione dei percorsi nel foglio dei percorsi al volo
  const sheetPercorsiAlVolo = ss.getSheetByName('percorsiAlVolo');
  intestazioneTappe.splice(0, 2);
  sheetPercorsiAlVolo.getRange(1, 3, 1, intestazioneTappe.length).setValues([intestazioneTappe]);
}

// funzione che crea un percorso in base ai parametri passati
function creaPercorso(numeroPercorso, codiciLuoghi, numTappe, percorsiUguali) {
  let percorso = codiciLuoghi.slice();
  percorso.shift();

  // se i percorsi devono essere diversi mescola
  if (!percorsiUguali) {
    percorso.sort(function(a, b){return 0.5 - Math.random()}); 
    // fa in modo che la tappa iniaziale sia diversa più possibile
    let tappaIniziale = numeroPercorso % (codiciLuoghi.length-1) + 1;
    if (tappaIniziale == 1) tappaIniziale = codiciLuoghi.length;
    // sposta la tappa iniziale da dove è ora nel percorso, all'inizio
    percorso.splice(percorso.indexOf(tappaIniziale), 1); 
    percorso.unshift(tappaIniziale);
  }

  // seleziona solo le tappe previste tranne una perchè deve aggiungere la 1 alla fine
  percorso = percorso.slice(0, numTappe-1);
  percorso.push(1);  
  return percorso;
}


// Aggiunge un menu con la voce per creare i gruppi
function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu('Caccia al Tesoro')
      .addItem('Aggiungi Luogo', 'aggiungiLuogo')
      .addItem('Crea Percorsi', 'creaPercorsi')
      .addSeparator()
      .addItem('Ottieni Codice Caccia', 'ottieniCodiceCaccia')
      .addItem('Condividi cartella Foto', 'condividiCartellaFoto')
      .addItem('Carica nomi Foto', 'caricaNomiFoto')
      .addToUi();
}
