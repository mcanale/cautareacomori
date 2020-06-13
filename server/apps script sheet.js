// funzione richiamata dall'utente che semplifica l'aggiunta delle coordinate di un luogo
function aggiungiLuogo() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt('Coordinate (entrambe) in formato Maps:');
  if (response.getSelectedButton() != ui.Button.OK) return;
  const stringaCoordinate = response.getResponseText(); // 45.490511, 12.205729
  
  const arrayCoordinate = stringaCoordinate.split(",");
  const latitudine = arrayCoordinate[0].trim().replace('.', ',');
  const longitudine = arrayCoordinate[1].trim().replace('.', ',');
  
  const sheetLuoghi= SpreadsheetApp.getActiveSpreadsheet().getSheetByName('luoghi');
  const codice = sheetLuoghi.getLastRow();
  sheetLuoghi.appendRow([codice, latitudine, longitudine]);
}

// funzione richiamata dall'utente che crea tutti i percorsi
function creaPercorsi() {  
  const ss= SpreadsheetApp.getActiveSpreadsheet();
  // recupera il numero di luoghi possibili
  const numeroLuoghi = ss.getSheetByName('luoghi').getLastRow()-1;
  Logger.log('numeroLuoghi', numeroLuoghi);
  
  // crea l'array con i codici di tutte le tappe
  let codiciLuoghi = [];
  for (let i = 0; i < numeroLuoghi; i++) {
    codiciLuoghi.push(i+1);
  }
  Logger.log('codiciLuoghi:', codiciLuoghi);
  
  // recupera il numero di tappe e se i percorsi devono essere tutti uguali
  const opzioni = ss.getSheetByName('opzioni').getRange(2, 2, 2).getValues(); // es. [[10.0], [0.0]]
  const numTappe = opzioni[0][0];
  const percorsiUguali = opzioni[1][0];
  Logger.log('numTappe:', numTappe); 
  Logger.log('percorsiUguali:', percorsiUguali);

  // crea la matrice da inserire poi sullo sheet e ci mette l'intestazione
  let percorsiMatrix = [];
  let intestazioneTappe = [];
  for (let i = 0; i < numTappe; i++) {
    intestazioneTappe.push('Tappa ' + (i+1));
  }
  percorsiMatrix.push(intestazioneTappe);
  Logger.log('intestazioneTappe:', intestazioneTappe);
  
  // recupera il numero delle squadre
  let sheetPercorsi = ss.getSheetByName('percorsi');
  let numSquadre = sheetPercorsi.getLastRow()-1;
  Logger.log('numSquadre:', numSquadre);
  
  // crea i percorsi
  for (let i = 0; i < numSquadre; i++) {
    const percorso = creaPercorso(i+1, codiciLuoghi, numTappe, percorsiUguali);    
    Logger.log('percorso ', i+1, ':', percorso);
    percorsiMatrix.push(percorso);
  }
  
  // scrive i percorsi sul foglio di calcolo e mette in grassetto i titoli
  const squadre = sheetPercorsi.getRange(1, 1, numSquadre+1, 2).getValues();
  Logger.log('squadre:', squadre);
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
      .addToUi();
}

