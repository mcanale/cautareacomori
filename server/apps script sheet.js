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
  
  // recupera il numero di tappe di ogni percorso e ne controlla il valore
  const numTappe = ss.getSheetByName('opzioni').getRange(2, 2).getValue(); 
  Logger.log('numTappe:', numTappe);
  if (numTappe > numeroLuoghi) {
    SpreadsheetApp.getUi().alert(`Opzione Tappe di ogni percorso (${numTappe}) troppo grande, può essere al massimo il numero di luoghi (${numeroLuoghi}).`);
    return;
  }
  if (numTappe < 1) {
    SpreadsheetApp.getUi().alert(`Opzione Tappe di ogni percorso (${numTappe}) troppo piccolo, deve essere almeno 1.`);
    return;
  }

  // crea la matrice da inserire poi sullo sheet
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
  let percorso;
  for (let i = 0; i < numSquadre; i++) {
    // crea il percorso
    percorso = creaPercorso(codiciLuoghi, numTappe);
    Logger.log('percorso:', percorso);
    percorsiMatrix.push(percorso);
  }
  // Logger.log('percorsiMatrix:', percorsiMatrix);
  
  // scrive i percorsi sul foglio di caldolo e mette in grassetto i titoli
  const squadre = sheetPercorsi.getRange(1, 1, numSquadre+1, 2).getValues();
  Logger.log('squadre:', squadre);
  sheetPercorsi.clear();
  sheetPercorsi.getRange(1, 1, squadre.length, 2).setValues(squadre);
  sheetPercorsi.getRange(1, 1, squadre.length, 2).setFontWeight('bold');
  sheetPercorsi.getRange(1, 3, percorsiMatrix.length, percorsiMatrix[0].length).setValues(percorsiMatrix);
  sheetPercorsi.getRange(1, 3, 1, percorsiMatrix[0].length).setFontWeight('bold');
  
  // prepara il foglio per la gara
  const sheetGare = ss.getSheetByName('gara');
  sheetGare.clear();
  sheetGare.getRange(1, 1, squadre.length, 2).setValues(squadre);
  sheetGare.getRange(1, 1, squadre.length, 2).setFontWeight('bold');
  sheetGare.getRange(1, 3, 1, intestazioneTappe.length).setValues([intestazioneTappe]);
  sheetGare.getRange(1, 3, 1, intestazioneTappe.length).setFontWeight('bold');
}

function creaPercorso(codiciLuoghi, numTappe) {
  // toglie il primo luogo (che metterà alla fine del percorso)
  codiciLuoghi.shift(); 

  // mescola le tappe rimaste
  codiciLuoghi.sort(function(a, b){return 0.5 - Math.random()}); 
  Logger.log('codiciLuoghi:', codiciLuoghi);
  
  // seleziona solo le tappe previste (tranne una)
  let percorso = codiciLuoghi.slice(0, numTappe-1);
  // rimette come ultima tamma il primo luogo
  percorso.push(1);  
  // Logger.log('percorso:', percorso);
  
  return percorso;
}

// Aggiunge un menu con la voce per creare i gruppi
function onOpen(e) {
  SpreadsheetApp.getUi()
      .createMenu('Căutarea comori')
      .addItem('Crează parcursurile', 'creaPercorsi')
      .addToUi();
}
