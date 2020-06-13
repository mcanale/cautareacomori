# cautareacomori
Gestore di una Caccia al Tesoro (che in rumeno si dice Cautarea Comori)

Video Tutorial a questo link: https://youtu.be/UDXmgDRdxMk

Nella cartella "Client" ci sono i file da avere sul client, ad es mettendoli su un sito, 
a cui poi la singola persona accede partendo dal file index.html

Nella cartella "Server" ci sono i file da mettere in una carrella di Google Drive.
Nel foglio di calcolo, esportato da un Google Spreadsheet, inteso come una alternativa user friendly ad un database, nei fogli rispettivi:
  - si impostano i percorsi, inserendo latitudine e longitudine di ciascuna tappa (che si possono ricavare da Google Maps, quindi anche senza andare fisicamente sul posto) e una domanda una volta arrivati alla tappa,
  - si scrivono le squadre,
  - si creano i percorsi diversi per ognuna (attraverso una funzione automatizzata)
  - si vede la progressione della squadra mano a mano che avanza nel percorso

Nel file "apps script sheet" va lo script da mettere all'interno del foglio di calcolo, il Google Spreadsheet, attraverso il menù Strumenti - Editor di script.

Nel file "apps script server" ci sono gli script da mettere in un file a parte con gli script che gestiscono la web app (che va ri-creata sul proprio spreadsheet).

