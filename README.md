# Caccia al Tesoro - cautareacomori ver. 2.6
Gestore di più Caccie al Tesoro (che in rumeno si dice Cautarea Comori)

Video Tutorial a questo link: https://youtu.be/UDXmgDRdxMk

Nella cartella "Client" ci sono i file da avere sul client, ad es mettendoli su un sito, 
il gestore deve andare al file insert.html
il giocatore deve andare al file index.html

Nella cartella "Server" ci sono i file da mettere in una carrella di Google Drive.
Il foglio di calcolo è un Google Spreadsheet ed è pensato come una alternativa user friendly ad un database.
Nei fogli al suo interno:
  - si impostano alcune opzioni utili per la gestione della Caccia al Tesoro
  - si impostano i percorsi, inserendo latitudine e longitudine di ciascuna tappa (che si possono ricavare da Google Maps, quindi anche senza andare fisicamente sul posto) e una domanda una volta arrivati alla tappa,
  - si scrivono le squadre,
  - si creano i percorsi diversi per ognuna (attraverso una funzione automatizzata)
  - si vede la progressione della squadra mano a mano che avanza nel percorso
  - (dalla ver. 2.5) si possono impostare dei percorsi per le iscrizioni al volo

Nel file "apps script sheet" c'è lo script interno al Google Spreadsheet (a cui si accede attraverso il menù Strumenti - Editor di script).

Nel file "apps script server" ci sono gli script della vera e propria Web App.
Sono da mettere in un file a parte di Google Apps Script e impostati (menù Pubblica - Distribuisci come applicazione web).

NB ci sarebbe anche un Google Spreadsheet che contiene semplicemente l'id dello Spreadsheet di tutte le cacce al tesoro inserite e il rispettivo codice, ma non lo pubblico per sicurezza.

