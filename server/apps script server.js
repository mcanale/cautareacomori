// WebApp Link: https://script.google.com/macros/s/AKfycbzwUsjq2IGjV-8Z1CWDySXjwXD1fFL_8s7dG5C5E6bGtnLz1FU/exec
// Link Percorsi: https://script.google.com/macros/s/AKfycbzwUsjq2IGjV-8Z1CWDySXjwXD1fFL_8s7dG5C5E6bGtnLz1FU/exec?team=2&tappa=3
// Risposta Get: {"latitude":44.1543,"longitude":28.60874,"question":"Cât e 3 + 4?","answer":7,"team":"Marian","stages":9,"maxDistance":10}
// Link Squadre: https://script.google.com/macros/s/AKfycbzwUsjq2IGjV-8Z1CWDySXjwXD1fFL_8s7dG5C5E6bGtnLz1FU/exec?action=teams
// Risposta Squadre: ["Luci","Marian","Andrei","Sebi","Anton"]

// funzione che estrae i nomi delle squadre
function getTeams(percorsiMatrix) {
  percorsiMatrix.shift();
  let teams = percorsiMatrix.map(row => {
                       return row[1];
                     });
  Logger.log('teams:', teams);
  return teams;
}

// funzione che formatta l'array della tappa in un oggetto con i campi nominati prima di restituirlo
function formatResponse(luogo, squadra, stages, maxDistance) {
  let response = {
    latitude: luogo[1],
    longitude: luogo[2],
    question: luogo[4],
    answer: luogo[5],
    team: squadra,
    stages: stages,
    maxDistance: maxDistance,
  }
  return response;
}

// risponde alle richieste get, che è usata per restituire l'elenco dei team oppure i dati del punto assegnato alla rispettiva squadra e tappa
function doGet(e) {
  Logger.log(JSON.stringify(e));
  const params = e.parameter; // NB tanti parametri numerici sono per ora stringhe, quindi andranno convertiti
  
  const spreadsheet = SpreadsheetApp.openById('14tii1vlM1YFHam85WztlLDwovMoJEwZ1jHNkTOFp-gQ');
  
  // carica tutti i dati dei percorsi
  const sheetPercorsi = spreadsheet.getSheetByName('percorsi');
  const percorsiMatrix = sheetPercorsi.getDataRange().getValues();
  
  // controlla se la richiesta è semplicemente quella di sapere l'elenco dei teams
  if (params.action == 'teams') 
    return ContentService.createTextOutput(JSON.stringify(getTeams(percorsiMatrix))).setMimeType(ContentService.MimeType.JSON);
  
  // determina il numero totale di tappe e controlla i parametri ricevuti
  const indiceVuoto = percorsiMatrix[params.team].indexOf(''); 
  const stages = indiceVuoto == -1 ? percorsiMatrix[0].length-2 : indiceVuoto-2;  // le tappe sono: se ha il percorso completo : se ha un percorso più corto
  if (params.team<1 || params.team>=percorsiMatrix.length || params.tappa<1 || params.tappa>stages)
    return ContentService.createTextOutput(0);
  
  // recupera i dati del luogo indicato nel percorso
  const indiceLuogo = percorsiMatrix[params.team][parseInt(params.tappa)+1];
  const sheetLuoghi = spreadsheet.getSheetByName('luoghi');
  const luoghiMatrix = sheetLuoghi.getDataRange().getValues();
  const luogo = luoghiMatrix[indiceLuogo];
  
  // recupera la distanza massima consentita o dalle proprietà salvate o dallo sheet
  const scriptProperties = PropertiesService.getScriptProperties();
  let maxDistance = scriptProperties.getProperty('MAXDISTANCE');
  if ( maxDistance ) 
    maxDistance = parseInt(maxDistance);
  else {
    const sheetOpzioni = spreadsheet.getSheetByName('opzioni');
    maxDistance = sheetOpzioni.getRange(1, 2).getValue();
    scriptProperties.setProperty('MAXDISTANCE', maxDistance);
  }
  
  // formatta l'oggetto da restituire e lo invia
  const luogoJson = JSON.stringify(formatResponse(luogo, percorsiMatrix[params.team][1], stages, maxDistance));
  return ContentService.createTextOutput(luogoJson).setMimeType(ContentService.MimeType.JSON); 
}

// risponde alla richiesta post, che è usata solo per assegnare l'ora di arrivo alla tappa
function doPost(e) {
  Logger.log(JSON.stringify(e));
  
  const params = JSON.parse(e.postData.contents);  // ATTENZIONE!! Fare JSON.parse()!!!
  const team = parseInt(params.team);              // e comunque rimangono stringhe da trasformare in numeri...
  const tappa = parseInt(params.tappa);
  const ora = new Date().toLocaleTimeString();
  const sheetGara = SpreadsheetApp.openById('14tii1vlM1YFHam85WztlLDwovMoJEwZ1jHNkTOFp-gQ').getSheetByName('gara');
  sheetGara.getRange(team+1, tappa+2).setValue(ora);

  const response = {
    team: team,
    tappa: tappa,
    ora: ora,
  };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON); 
}
