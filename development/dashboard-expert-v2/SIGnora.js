/*
#
#   SIGnora Client Javascript
#
#   20231220-0100
#
#
*/

/* -            
/* - VARIABLES    
/* -
*/

/* Object to hold imported SIGnora.json */
var myRadio = {
	RADIO: {
		channel: 1,
		channelname: "HV1",
		rfmodule: "RFM9X",
		modemconfig: "Bw125Cr45Sf128",
		frequency: 911250000,
		spreadfactor: 7,
		codingrate4: 8,
		bandwidth: 125000,
		txpwr: 10
	},
	HID: {
		oled: "128x32"
	},
	CONTACT: {
		mycall: "NOCALL",
		myssid: "00",
		mybeacon: "quack quack",
		dstcall: "BEACON",
		dstssid: "99"
	},
	MACROS: {
		M1: "QRZ",
		M2: "QSL",
		M3: "73",
		M4: "TEST TEST TEST"
	},
	CHANNELS: {
		0: {channelname: "HV0", modem: 0, frequency: 911250000},
		1: {channelname: "HV1", modem: 0, frequency: 911250000},
		2: {channelname: "HV2", modem: 2, frequency: 911250000},
		3: {channelname: "HV3", modem: 3, frequency: 911250000},
		4: {channelname: "HV4", modem: 4, frequency: 911250000},
		5: {channelname: "HV5", modem: 1, frequency: 911250000},
		6: {channelname: "HV6", modem: 2, frequency: 911300000},
		7: {channelname: "HV7", modem: 3, frequency: 911300000},
		8: {channelname: "HV8", modem: 0, frequency: 911300000},
		9: {channelname: "HV9", modem: 1, frequency: 911300000}
	},
	MODEMS: {
		0:{modemconfig: "Bw125Cr45Sf128", modemname: "MEDIUM", spreadfactor: 7, codingrate4: 8, bandwidth: 125000},
		1:{modemconfig: "Bw500Cr45Sf128", modemname: "FAST-SHORT", spreadfactor: 7, codingrate4: 5, bandwidth: 500000},
		2:{modemconfig: "Bw31_25Cr48Sf512", modemname: "SLOW-LONG1", spreadfactor: 7, codingrate4: 8, bandwidth: 31250},
		3:{modemconfig: "Bw125Cr48Sf4096", modemname: "SLOW-LONG2", spreadfactor: 12, codingrate4: 8, bandwidth: 125000},
		4:{modemconfig: "Bw125Cr45Sf2048", modemname: "SLOW-LONG3", spreadfactor: 8, codingrate4: 5, bandwidth: 125000}
	}
}

/* Programmable Channels */
var loraChannels = [0,1,2,3,4,5,6,7,8,9];

/* Selectable LoRa modems */
var loraModems = [0,1,2,3,4];

/* Selectable LoRa Bandwidths */
var loraBandwidth = [7800,10400,1500,20800,31250,41700,62500,125000,250000,500000];

/* Programmable Commands C1-C4 */
var myCommands = ["SET:RADIO:RESET","SET:MODE:LORA","SET:MODE:FSK","SET:RADIO:EXPERT"];

/* Programmable Macros M1-M4 */
var myMacros = ["QRZ","QSL","73","TEST TEST TEST"];

/* Last Seven Calls heard */
var myHeard = [ "NOCALLS", "NOCALLS", "NOCALLS", "NOCALLS", "NOCALLS", "NOCALLS", "NOCALLS"];

/* Current MSG Exchange*/
var myPacket = {
	header: "NOCALL-00>BEACON-99",
	options: "",
	message: ""
}

/* Radio and Msg Module Commands */
var radioGUI = 0;                                        //  0 = Basic, 1 = Expert
var radioFUNCT = 0;                                      //  0 = Listen, 1 = Repeat, 2 = Beacon
var radioBEACON = 0;                                     //  0 = Beacon OFF, 1 = Beacon ON  
var radioTXPWR = 5;                                      //  TX Power can be 5 to 21    
var radioLOG = 0;                                        //  0 = Logging OFF, 1 = Logging ON
var radioMODE = 0;                                       //  0 = LORA, 1 = XARPS, 2 = FSK
var loraSF = 7;                                         //  Spread Factor (LoRa)
var loraCR = 8;                                         //  Coding Rate (LoRa)
var loraBW = 7;                                         //  Bandwidth (LoRa)
var msgENTERED = "";								     //  Typed into TX_Window      
var msgPARSED = [];										 //  For processing two-part command
var msgSUBPARSED = [];									 //  For processing two-part command  
var msgPARTICLE = [];									 //  For processing two-part command  
var previous_operation = "";
var current_operation = "";
var previous_entry = "";
var current_entry = "";
var myHostname = location.hostname;
var wsURI = "wss://" + myHostname + ":8000/wss";					//  TEST Websocket URI 
var url = "https://" + myHostname + ":8000/cfg/SIGnora.json";		//  JSON file location
var getHasJson = new XMLHttpRequest();								//  Holds JSON from Radio
var rxDisplay = [];													//  Holds whole RX window as 27 lines of text
var rxDispY = 26;													//  Numbe of rowa for RX Window

/* Dashboard Page Elements */
var tuner_setting_element = document.getElementById('tuner-setting');
var spreadfactor_setting_element = loraSF;
var codingrate4_setting_element = loraCR;
var bandwidth_setting_element = loraBW;
var channelname_setting_element = document.getElementById('channelname-setting');

/* -            
/* - FUNCTIONS
/* -
*/

// --- Tuner-Module ---

function updateDisplay() {
	tuner_setting_element = document.getElementById('tuner-setting');
	tuner_setting_element.innerText = (Number(myRadio.RADIO.frequency)/1000000) + " MHz";
	spreadfactor_setting_element = document.getElementById('spreadfactor-setting');
	spreadfactor_setting_element.innerText = "SF " + loraSF;
	codingrate4_setting_element = document.getElementById('codingrate4-setting');
	codingrate4_setting_element.innerText = "CR " + loraCR;
	bandwidth_setting_element = document.getElementById('bandwidth-setting');
	bandwidth_setting_element.innerText= "BW " + (Number(myRadio.RADIO.bandwidth)/1000);
	channelname_setting_element = document.getElementById('channelname-setting');
	channelname_setting_element.innerText= "CH " + myRadio.RADIO.channelname;
	console.log("DISPLAY: changed to " + myRadio.RADIO.channelname);
}

function updateTuner(freq, modem) {
	myRadio.RADIO.frequency = freq;
	myRadio.RADIO.modemconfig = myRadio.MODEMS[modem].modemconfig;
	myRadio.RADIO.bandwidth  = myRadio.MODEMS[modem].bandwidth;
	myRadio.RADIO.spreadfactor  = myRadio.MODEMS[modem].spreadfactor;
	myRadio.RADIO.codingrate4 = myRadio.MODEMS[modem].codingrate4;
	msgSOX = "SET:TUNER:" + myRadio.RADIO.modemconfig + ":" + myRadio.RADIO.frequency;
	socket.send(msgSOX);
	console.log(msgSOX);
	console.log("SET:MODEM: SF:"+ myRadio.MODEMS[modem].spreadfactor + " CR4:" + myRadio.MODEMS[modem].codingrate4 + " BW:" + myRadio.RADIO.bandwidth);

}

function btnNUM(localChannelnum) {
	if (radioGUI == 0) {
		myRadio.RADIO.channelname  = myRadio.CHANNELS[localChannelnum].channelname
		myRadio.RADIO.modem = myRadio.CHANNELS[localChannelnum].modem
		myRadio.RADIO.frequency  = myRadio.CHANNELS[localChannelnum].frequency
		console.log("CHANNEL: change to " + myRadio.RADIO.channelname);
		updateTuner(myRadio.RADIO.frequency, myRadio.RADIO.modem);
		updateDisplay();
	}
	if (radioGUI == 1) {
		current_entry = localChannelnum;
		if (previous_operation !== "DIGIT") {
			//Fresh Display
			previous_entry = localChannelnum;
			previous_operation = "DIGIT";
			console.log("TUNER: first number " + localChannelnum);
			updateTunerDisplay(current_entry);
			updateDisplay();
		}
		else if (previous_operation == "DIGIT") {
			//Existing Digit
			current_entry += null;
			current_entry = `${previous_entry}${current_entry}`;
			previous_entry = current_entry;
			console.log("TUNER: next number " + localChannelnum);
			updateTunerDisplay(current_entry);
			updateDisplay();
		}
		else {
			//Invalid
			current_entry = previous_entry;
			updateDisplay();
		}
	}
}

function btnRESET() {
	if (radioGUI == 1) {
		getHasJson.open('GET', url, true);
		getHasJson.send(null);
		getHasJson.onload = function() {
			if (getHasJson.readyState === getHasJson.DONE && getHasJson.status === 200) {
				myRadio = JSON.parse(getHasJson.responseText);
				console.log("TUNER: btnRESET");
			}
			previous_operation = "RESET";
			previous_entry = "";
			current_entry = "";
			updateDisplay(myRadio.CURRENT.channel);preadfactor-setting
		}
	}
}

function btnCLEAR() {
	if (radioGUI == 1) {
    	var el = document.getElementById('tuner-setting');
		el.textContent = 0;
		previous_entry = "";
		previous_operation == "CLEAR";
		console.log("TUNER: btnCLEAR");
	}
}

function btnENTER() {
	if (radioGUI == 1) {
		myRadio.CURRENT.frequency = current_entry;
		socket.send("TUNER:" + myRadio.CURRENT.frequency);
		console.log("TUNER: " + myRadio.CURRENT.frequency);
		previous_operation = "ENTER";
		previous_entry = "";
		current_entry = "";
		console.log("TUNER: btnENTER");
		updateTunerDisplay(myRadio.CURRENT.frequency);
	}
}


/* --- Radio Panel-Module --- */

function btnRADIO() {
	console.log("RADIO: btnRADIO: clicked");
	var el_btnRADIO = document.getElementById('btnRADIO');
	if (radioFUNCT == 0) {
		radioFUNCT = 1;
		el_btnRADIO.style.background = "Orange";
		el_btnRADIO.innerHTML = "REPT";
		socket.send("SET:RADIO:REPEAT");
		console.log("RADIO: btnRADIO: Radio REPEAT");
		previous_entry = 1;
		previous_operation = "RADIO:REPEAT";
	 }
	 else if (radioFUNCT == 1){
		radioFUNCT = 2;
		el_btnRADIO.style.background = "MediumSeaGreen";
		el_btnRADIO.innerHTML = "BECN";
		socket.send("SET:RADIO:BEACON");
		console.log("RADIO: btnRADIO: Radio BEACON");
		previous_entry = 2;
		previous_operation = "RADIO:BEACON";
	}
	else if (radioFUNCT == 2){
		radioFUNCT = 0;
		el_btnRADIO.style.background = "Black";
		el_btnRADIO.innerHTML = "TRX";
		socket.send("SET:RADIO:LISTEN");
		console.log("RADIO: btnRADIO: Radio LISTEN");
		previous_entry = 0;
		previous_operation = "RADIO:LISTEN";
	}
 }

function btnTXPWR() {
	console.log("RADIO: btnTXPWR: clicked");
	var el_btnTXPWR = document.getElementById('btnTXPWR');
	if (radioTXPWR == 5) {
		radioTXPWR = 10;
		el_btnTXPWR.style.background = "MediumSeaGreen";
		el_btnTXPWR.innerHTML = "MEDM";
		socket.send("SET:TXPWR:MEDIUM");
		console.log("RADIO: btnTXPWR: MEDIUM");
		previous_entry = 0;
		previous_operation = "TXPWR:MEDIUM";
	 }
	 else if (radioTXPWR == 10){
		 radioTXPWR = 20;
		 el_btnTXPWR.style.background = "Orange";
		 el_btnTXPWR.innerHTML = "HIGH";
		 socket.send("SET:TXPWR:HIGH");
		 console.log("RADIO: btnTXPWR: HIGH");
		 previous_entry = 0;
		 previous_operation = "TXPWR:HIGH";
	 }
	 else if (radioTXPWR == 20){
		radioTXPWR = 5;
		el_btnTXPWR.style.background = "Black";
		el_btnTXPWR.innerHTML = "LOW";
		socket.send("SET:TXPWR:LOW");
		console.log("RADIO: btnTXPWR: LOW");
		previous_entry = 0;
		previous_operation = "TXPWR:LOW";
	}
}

function btnMODE() {
	console.log("RADIO: btnMODE: clicked");
	var el_btnMODE = document.getElementById('btnMODE');
	if (radioMODE == 0) {
		radioMODE = 1;
		el_btnMODE.style.background = "Orange";
		el_btnMODE.innerHTML = "XARPS";
		socket.send("SET:RADIO:XARPS");
		console.log("RADIO: btnMODE: Mode XARPS");
		previous_entry = 1;
		previous_operation = "RADIO:XARPS";
	 }
	 else if (radioMODE == 1){
		radioMODE = 2;
		el_btnMODE.style.background = "MediumSeaGreen";
		el_btnMODE.innerHTML = "FSK";
		socket.send("SET:RADIO:FSK");
		console.log("RADIO: btnMODE: Mode FSK");
		previous_entry = 2;
		previous_operation = "RADIO:FSK";
	}
	else if (radioMODE == 2){
		radioMODE = 0;
		el_btnMODE.style.background = "Black";
		el_btnMODE.innerHTML = "LORA";
		socket.send("SET:RADIO:LORA");
		console.log("RADIO: btnMODE: Mode LORA");
		previous_entry = 0;
		previous_operation = "RADIO:LORA";
	}
}

function btnGUI() {
	console.log("RADIO: btnGUI: clicked");
	var el_btnGUI = document.getElementById('btnGUI');
	var el_btnFREQ = document.getElementById('btnFREQ');
	var el_btnSF = document.getElementById('btnSF');
	var el_btnBW = document.getElementById('btnBW');
	var el_btnCR = document.getElementById('btnCR');
	if (radioGUI == 0) {
		radioGUI = 1;
		el_btnGUI.style.background = "Orange";
		el_btnGUI.innerHTML = "EXP";
		el_btnFREQ.style.background = "Black";
		el_btnSF.style.background = "Black";
		el_btnBW.style.background = "Black";
		el_btnCR.style.background = "Black";
		el_btnFREQ.innerHTML = "FREQ";
		el_btnSF.innerHTML = "SF" + loraSF;
		el_btnBW.innerHTML = "BW";
		el_btnCR.innerHTML = "CR" + loraCR;
		socket.send("SET:RADIO:EXPERT");
		console.log("RADIO: btnGUI: EXPERT");
		previous_entry = 1;
		previous_operation = "RADIO:EXPERT";
	} 
	else {
		radioGUI = 0;
		el_btnGUI.style.background = "Black";
		el_btnGUI.innerHTML = "BASIC";
		el_btnFREQ.style.background = "Black";
		el_btnSF.style.background = "Black";
		el_btnBW.style.background = "Black";
		el_btnCR.style.background = "Black";
		el_btnFREQ.innerHTML = " ";
		el_btnSF.innerHTML = " ";
		el_btnBW.innerHTML = " ";
		el_btnCR.innerHTML = " ";
		socket.send("SET:RADIO:BASIC");
		console.log("RADIO: btnGUI: BASIC");
		previous_entry = 1;
		previous_operation = "RADIO:BASIC";
	}
}

function btnBEACON() {
	console.log("RADIO: btnBEACON: clicked");
	var el_btnBEACON = document.getElementById('btnBEACON');
	if (radioBEACON == 0) {
		radioBEACON = 1;
		el_btnBEACON.style.background = "MediumSeaGreen";
		socket.send("SET:BEACON:ON");
		console.log("RADIO: btnBEACON: Beacon ON");
		previous_entry = 0;
		previous_operation = "BEACON:ON";
	 }
	 else if (radioBEACON == 1){
		 radioBEACON = 0;
		 el_btnBEACON.style.background = "Black";
		 socket.send("SET:BEACON:OFF");
		 console.log("RADIO: btnBEACON: Beacon OFF");
		 previous_entry = 0;
		 previous_operation = "BEACON:OFF";
	 }
}

function btnSF() {
	console.log("RADIO: btnSF: clicked");
	var el_btnSF = document.getElementById('btnSF');
	if (radioGUI == 1) {
		loraSF++;
		if (loraSF > 12) {
			loraSF = 7
		}
		el_btnSF.style.background = "Black";
		el_btnSF.innerHTML = "SF" + loraSF;
		socket.send("SET:RADIO:LORA:SF" + loraSF);
		console.log("RADIO: btnSF: " + loraSF);
		previous_entry = 1;
		previous_operation = "RADIO:LORA:SF" + loraSF;
		updateDisplay()
	}
}

function btnCR() {
	console.log("RADIO: btnCR: clicked");
	var el_btnCR = document.getElementById('btnCR');
	if (radioGUI == 1) {
		loraCR++;
		if (loraCR > 8) {
			loraCR = 5
		}
		el_btnCR.style.background = "Black";
		el_btnCR.innerHTML = "CR" + loraCR;
		socket.send("SET:RADIO:LORA:CR" + loraCR);
		console.log("RADIO: btnCR: " + loraCR);
		previous_entry = 1;
		previous_operation = "RADIO:LORA:CR" + loraCR;
		updateDisplay()
	}
}

function btnBW() {
	console.log("RADIO: btnBW: clicked");
	var el_btnBW = document.getElementById('btnBW');
	if (radioGUI == 1) {
		loraBW++;
		if (loraBW > 9) {
			loraBW = 0		}
		el_btnBW.style.background = "Black";
		el_btnBW.innerHTML = "BW" + loraBW;
		socket.send("SET:RADIO:LORA:BW" + loraBW);
		console.log("RADIO: btnBW: " + loraBW);
		previous_entry = 1;
		previous_operation = "RADIO:LORA:BW" + loraBW;
	}
}

/* --- Macros Module --- */

function btnC1() {
	console.log("MACRO: btnC1: clicked");
	msgENTERED = msgENTERED + myCommands[0];
	document.getElementById('msgENTRY').value = msgENTERED;
	previous_entry = "C1";
	previous_operation == "CLICK";
	console.log("MACRO: btnC1: " + myCommands[0]);
}

function btnC2() {
	console.log("MACRO: btnC2: clicked");
	msgENTERED = msgENTERED + myCommands[1];
	document.getElementById('msgENTRY').value = msgENTERED;
	previous_entry = "C2";
	previous_operation == "CLICK";
	console.log("MACRO: btnC2: " + myCommands[1]);
}

function btnC3() {
	console.log("MACRO: btnC3: clicked");
	msgENTERED = msgENTERED + myCommands[2];
	document.getElementById('msgENTRY').value = msgENTERED;
	previous_entry = "C3";
	previous_operation == "CLICK";
	console.log("MACRO: btnC3: " + myCommands[2]);
}

function btnC4() {
	console.log("MACRO: btnC4: clicked");
	msgENTERED = msgENTERED + myCommands[3];
	document.getElementById('msgENTRY').value = msgENTERED;
	previous_entry = "C4";
	previous_operation == "CLICK";
	console.log("MACRO: btnC4: " + myCommands[3]);
}

function btnM1() {
	console.log("MACRO: btnM1: clicked");
	msgENTERED = msgENTERED + myCommands[0];
	document.getElementById('msgENTRY').value = msgENTERED;
	previous_entry = "M1";
	previous_operation == "CLICK";
	console.log("MACRO: btnM1: " + myCommands[0]);
}

function btnM2() {
	console.log("MACRO: btnM2: clicked");
	msgENTERED = msgENTERED + myMacros[1];
	document.getElementById('msgENTRY').value = msgENTERED;
	previous_entry = "M2";
	previous_operation == "CLICK";
	console.log("MACRO: btnM2: " + myMacros[1]);
}

function btnM3() {
	console.log("MACRO: btnM3: clicked");
	msgENTERED = msgENTERED + myMacros[2];
	document.getElementById('msgENTRY').value = msgENTERED;
	previous_entry = "M3";
	previous_operation == "CLICK";
	console.log("MACRO: btnM3: " + myMacros[2]);
}

function btnM4() {
	console.log("MACRO: btnM4: clicked");
	msgENTERED = msgENTERED + myMacros[3];
	document.getElementById('msgENTRY').value = msgENTERED;
	previous_entry = "M4";
	previous_operation == "CLICK";
	console.log("MACRO: btnM4: " + myMacros[3]);
}


/* --- MSG Panel-Module --- */

function btnLOG() {
	console.log("MSG: btnLOG: clicked");
	var el_btnLOG = document.getElementById('btnLOG');
	if (radioLOG == 0) {
		radioLOG = 1;
		el_btnLOG.style.background = "MediumSeaGreen";
		// Insert local action
		console.log("MSG: btnLOG: Logging ON");
		previous_entry = "LOG";
		previous_operation = "ON";
	 }
	 else if (radioLOG == 1){
		 radioLOG = 0;
		 el_btnLOG.style.background = "Black";
		 // Insert local action
		 console.log("MSG: btnLOG: Logging OFF");
		 previous_entry = "LOG";
		 previous_operation = "OFF";
	 }
}

function btnRCLR() {
	console.log("MSG: btnRCLR: clicked");
	msgENTERED = "";
	msgPARSED = "";
	previous_entry = "RCLR";
	previous_operation == "CLICK";
	rxwinRCLR();
}

function btnCALL() {
	console.log("MSG: btnCALL: clicked");
	msgENTERED = msgENTERED + myRadio.CONTACT.mycall+ "-" + myRadio.CONTACT.myssid;
	document.getElementById('msgENTRY').value = msgENTERED;
	previous_entry = "CALL";
	previous_operation == "CLICK";
}

function btnDEST() {
	console.log("MSG: btnDEST: clicked");
	msgENTERED = msgENTERED + myRadio.CONTACT.dstcall + "-" + myRadio.CONTACT.dstssid;
	document.getElementById('msgENTRY').value = msgENTERED;
	previous_entry = "DEST";
	previous_operation == "CLICK";
}

function btnHEAD() {
	console.log("MSG: btnHEAD: clicked");
	myPacket.header = myRadio.CONTACT.mycall+ "-" + myRadio.CONTACT.myssid + ">" + myRadio.CONTACT.dstcall + "-" + myRadio.CONTACT.dstssid + "|";
	msgENTERED = msgENTERED + myPacket.header;
	document.getElementById('msgENTRY').value = msgENTERED;
	previous_entry = "HEAD";
	previous_operation == "CLICK";
}

function btnHELP() {
	console.log("MSG: btnHELP: clicked");
	if (radioGUI == 0) {
		rxwinMSGhelp();
	}
	if (radioGUI == 1) {
		rxwinMSGexperthelp();
	}
	rxwinMSG('-');
	previous_entry = "HELP";
	previous_operation == "CLICK";
}

function btnMCLR() {
	console.log("MSG: btnMCLR: clicked");
	msgENTERED = "";
	msgPARSED = "";
	previous_entry = "MCLR";
	previous_operation == "CLICK";
	document.getElementById('msgENTRY').value = "";
}

function btnSEND() {
	console.log("MSG: btnSEND: clicked");
	msgENTERED = document.getElementById('msgENTRY').value;
	console.log("PANEL: btnSEND", msgENTERED);
	previous_entry = "CMDLINE";
	previous_operation == "CLICK";

	/* --- Sort through commands first --- */
	
	msgPARSED = msgENTERED.split(" ");
		
	if (msgPARSED[0] === ".msgBECN") {                    /*  Set BEACON message  */
		msgSUBPARSED = msgENTERED.replace('msgBECN ', '')
		myRadio.RADIO.mybeacon = msgSUBPARSED;
		message = "BEACON = " + myRadio.RADIO.mybeacon;
		rxwinMSG(message);
		console.log("CMD: set: Beacon MSG = " + myRadio.RADIO.mybeacon);
		previous_operation = "msBECN";
	
	} else if (msgPARSED[0] === ".myCALL") {                  /*  Set myCALL and mySSID  */
		msgSUBPARSED = msgPARSED[1];
		msgPARTICLE = msgSUBPARSED.split("-");
		myRadio.CONTACT.mycall = msgPARTICLE[0];
		myRadio.CONTACT.myssid = msgPARTICLE[1];
		message = "CALL = " + myRadio.CONTACT.myssid + "-" + myRadio.CONTACT.myssid;
		rxwinMSG(message);
		console.log("CMD: set: CALL =" + myRadio.CONTACT.myssid + "-" + myRadio.CONTACT.myssid);
		previous_operation = "myCALL";
	
	} else if (msgPARSED[0] === ".dstCALL") {                 /*  Set myRadio.CONTACT.dstcall and myRadio.CONTACT.dstssid  */
		msgSUBPARSED = msgPARSED[1];
		msgPARTICLE = msgSUBPARSED.split("-");
		myRadio.CONTACT.dstcall = msgPARTICLE[0];
		myRadio.CONTACT.dstssid = msgPARTICLE[1];
		message = "DEST = " + myRadio.CONTACT.dstcall + "-" + myRadio.CONTACT.dstssid;
		rxwinMSG(message);
		console.log("CMD: set: DEST =" + myRadio.CONTACT.dstcall + "-" + myRadio.CONTACT.dstssid);
		previous_operation = "dstCALL";
	
	} else if (msgPARSED[0] === ".macro1") {                 /*  Set Macro Button 1  */
		msgSUBPARSED = msgENTERED.replace('.macro1 ', '')
		myMacros[0] = msgSUBPARSED;
		message = "MACRO1 = " + myMacros[0];
		rxwinMSG(message);
		console.log("CMD: set: M1 =" + myMacros[0]);
		previous_operation = "M1";
	
	} else if (msgPARSED[0] === ".macro2") {                 /*  Set Macro Button 2  */
		msgSUBPARSED = msgENTERED.replace('.macro2 ', '')
		myMacros[1] = msgSUBPARSED;
		message = "MACRO3 = " + myMacros[1];
		rxwinMSG(message);
		console.log("CMD: set: PANEL: btnM2: M2 = " + myMacros[1]);
		previous_operation = "M2";
	
	} else if (msgPARSED[0] === ".macro3") {                 /*  Set Macro Button 3  */
		msgSUBPARSED = msgENTERED.replace('.macro3 ', '')
		myMacros[2] = msgSUBPARSED;
		message = "MACRO1 = " + myMacros[2];
		rxwinMSG(message);
		console.log("CMD: set: M3 = " + myMacros[2]);
		previous_operation = "M3";
		
	} else if (msgPARSED[0] === ".macro4") {                 /*  Set Macro Button 4  */
		msgSUBPARSED = msgENTERED.replace('.macro4 ', '')
		myMacros[3] = msgSUBPARSED;
		message = "MACRO1 = " + myMacros[3];
		rxwinMSG(message);
		console.log("CMD: set: M4 = " + myMacros[3]);
		previous_operation = "M4";

	/* Anything else is a message to be TX */
	} else {
		socket.send("TX:" + msgENTERED);
		rxwinMSG("TX: "+ msgENTERED);
		console.log("CMD: SEND:" + msgENTERED);
		previous_operation = "SENT";
	}

	msgENTERED = "";
	msgPARSED = "";
	previous_operation = "NULL";
	document.getElementById('msgENTRY').value = "";

}

/* --- Receiver-Window --- */

function rxwinRCLR() {
	console.log("rxWIN: RCLR");
	for (i = rxDispY; i > 0; i=i-1) {
		rxDisplay[i] = "-";
		var rxWINid = "rxWIN" + i;
		var el_RXwin = document.getElementById(rxWINid);
		el_RXwin.innerHTML = rxDisplay[i];
	  }
	  rxDisplay[0] = "-";
	  var el_RXwin = document.getElementById("rxWIN0");
	  el_RXwin.innerHTML = rxDisplay[0];
}

function rxwinMSG(message) {
  for (i = rxDispY; i > 0; i=i-1) {
	rxDisplay[i] = rxDisplay[i-1];
	var rxWINid = "rxWIN" + i;
    var el_RXwin = document.getElementById(rxWINid);
	el_RXwin.innerHTML = rxDisplay[i];
  }
  rxDisplay[0] = message;
  var el_RXwin = document.getElementById("rxWIN0");
  el_RXwin.innerHTML = message;
}

function rxwinMSGhelp() {
	rxDisplay [26] = "-"
	rxDisplay [25] = "................ SIGnora Basic Instructions .............."
	rxDisplay [24] = "-"
	rxDisplay [23] = "........ KEYPAD ......... ...... RADIO CONTROL TOGGLES ...."
	rxDisplay [22] = "-"
	rxDisplay [21] = "- 0-9 = LoRa Modem  ------ ----- RX / REPEAT / BEACON Modes"
  	rxDisplay [20] = "- RST = Reset Keypad ---- ----- LOW / MED / HIGH RF Power"
  	rxDisplay [19] = "- CLR = Clear Display --- ----- LORA / XARPS / FSK Modes"
  	rxDisplay [18] = "- ----------------------- ----- BASIC /EXPERT Menu"
	rxDisplay [17] = "-"
	rxDisplay [16] = "..................... MESSAGE CONTROLS ....................."
	rxDisplay [15] = "-"
  	rxDisplay [14] = "- CALL = myCall Macro ------- ---- LOG = Log on/off (toggle)"
  	rxDisplay [13] = "- DEST = dstCall Macro ------ --- RCLR = Clear RX Window"
  	rxDisplay [12] = "- HEAD = Message Header------ --- MCLR = TX window clear"
  	rxDisplay [11] = "- HELP = This screen -------- --- SEND = Sends TX Window"
  	rxDisplay [10] = "- "
	rxDisplay [9] = ".................... TX WINDOW COMMANDS ...................."
	rxDisplay [8] = "-"	  
  	rxDisplay [7] = "- .myCALL NOCALL-00     Changes CALL macro to hold NOCALL-00"
  	rxDisplay [6] = "- .dstCALL BL0B-50      Changes DEST macro to hold BL0B-50"
  	rxDisplay [5] = "- .macro1 blah blah     Changes M1 button to hold blah blah"
  	rxDisplay [4] = "-"
	rxDisplay [3] = "..... TO SEND A MESSAGE"
	rxDisplay [2] = "-"  
  	rxDisplay [1] = "- Via Macro buttons click HEAD, M1, then SEND"
  	rxDisplay [0] = "- Type YourCall>DestCall|MESSAGE in TX window then click SEND"
}

function rxwinMSGexperthelp() {
	rxDisplay [26] = "-"
	rxDisplay [25] = ".................... SIGnora Expert Instructions .................."
	rxDisplay [24] = "-"
	rxDisplay [23] = "............ KEYPAD .......... ........ RADIO CONTROL TOGGLES ....."
	rxDisplay [22] = "-"
	rxDisplay [21] = "- 0-9,. = Tune Frequency ------- ----- RX/REPEAT/BEACON"
  	rxDisplay [20] = "- RST = Reset Keypad ------ ----- LOW, MED, HIGH RF Power"
  	rxDisplay [19] = "- CLR = Clear Display ----- ----  LORA, XARPS, FSK Modes"
  	rxDisplay [18] = "- ENT = Update Radio Freq - --------- Send quick ID"
	rxDisplay [17] = "-"
	rxDisplay [16] = "..................... MESSAGE CONTROLS ....................."
	rxDisplay [15] = "-"
  	rxDisplay [14] = "- CALL = myCall Macro ------- ---- LOG = Log on/off (toggle)"
  	rxDisplay [13] = "- DEST = dstCall Macro ------ --- RCLR = Clear RX Window"
  	rxDisplay [12] = "- HEAD = Message Header------ --- MCLR = TX window clear"
  	rxDisplay [11] = "- HELP = This screen -------- --- SEND = Sends TX Window"
  	rxDisplay [10] = "- "
	rxDisplay [9] = ".................... TX WINDOW COMMANDS ...................."
	rxDisplay [8] = "-"	  
  	rxDisplay [7] = "- .myCALL NOCALL-00     Changes CALL macro to hold NOCALL-00"
  	rxDisplay [6] = "- .dstCALL BL0B-50      Changes DEST macro to hold BL0B-50"
  	rxDisplay [5] = "- .macro1 blah blah     Changes M1 button to hold blah blah"
  	rxDisplay [4] = "-"
	rxDisplay [3] = "..... TO SEND A MESSAGE"
	rxDisplay [2] = "-"  
  	rxDisplay [1] = "- Via Macro buttons click HEAD, M1, then SEND"
  	rxDisplay [0] = "- Type YourCall>DestCall|MESSAGE in TX window then click SEND"
}

/* --- Transmitter-Module --- */

function msgENTRY() {
	// Get the focus to the text input to enter a word right away.
	document.getElementById('msgENTRY').focus();

	
	// Getting the text from the input
	var msgENTERED = document.getElementById('msgENTRY').value;
  }


/* --- ROOT-Module --- */


/* -            
/* - MAIN
/* -
*/

// Get SIGnora.json on page load
getHasJson.open('GET', url, true);
getHasJson.send(null);
getHasJson.onload = function() {
	if (getHasJson.readyState === getHasJson.DONE && getHasJson.status === 200) {
		myRadio = JSON.parse(getHasJson.responseText)
	}
}
console.log("INIT: SIGnora.JSON loaded");
// Channel assignments
loraChannels = Object.keys(myRadio.CHANNELS);
console.log("INIT:     CH 0,1,2: ", myRadio.CHANNELS[0].channelname, myRadio.CHANNELS[1].channelname, myRadio.CHANNELS[2].channelname);
console.log("INIT:     CH 3,4,5: ", myRadio.CHANNELS[3].channelname, myRadio.CHANNELS[4].channelname, myRadio.CHANNELS[5].channelname);
console.log("INIT:     CH 6,7,8: ", myRadio.CHANNELS[6].channelname,  myRadio.CHANNELS[7].channelname, myRadio.CHANNELS[8].channelname);
console.log("INIT:         CH 9: ", myRadio.CHANNELS[9].channelname);

// Modem assignments
loraModems = Object.keys(myRadio.MODEMS);
console.log("INIT:        Modem: ", loraModems[0]);
console.log("INIT:   Modem Name: ", myRadio.MODEMS[0].modemname);
console.log("INIT:  ModemConfig: ", myRadio.MODEMS[0].modemconfig);
console.log("INIT: SpreadFactor: ", myRadio.MODEMS[0].spreadfactor);
console.log("INIT:  CodingRate4: ", myRadio.MODEMS[0].codingrate4);
console.log("INIT:    Bandwdith: ", myRadio.MODEMS[0].bandwidth);


// Set Macros M1 to M4
myMacros[0] = myRadio.MACROS.M1;
myMacros[1] = myRadio.MACROS.M2;
myMacros[2] = myRadio.MACROS.M3;  
myMacros[3] = myRadio.MACROS.M4;
console.log("INIT:     Macro M1: ", myMacros[0]);
console.log("INIT:     Macro M2: ", myMacros[1]);
console.log("INIT:     Macro M3: ", myMacros[2]);
console.log("INIT:     Macro M4: ", myMacros[3]);

console.log("INIT:     Hostname: " + myHostname);
console.log("INIT:    Websocket: " + wsURI);
console.log("INIT: COMPLETE");
previous_entry = "";  
previous_operation = "INIT";                    // Set last operation

// Load RX Window with Help Message
if (radioGUI == 0) {
	rxwinMSGhelp();
}
if (radioGUI == 1) {
	rxwinMSGexperthelp();
}
rxwinMSG('-');

/* Establish Websocket */
socket = new WebSocket(wsURI);

//Dynamic HTML5 Elements
console.log("INIT    HTML Tuner: ", tuner_setting_element); 
console.log("INIT       HTML SF: ", spreadfactor_setting_element); 
console.log("INIT      HTML CR4: ", codingrate4_setting_element); 
console.log("INIT       HTML BW: ", bandwidth_setting_element); 
console.log("INIT   HTML CHName: ", channelname_setting_element);

updateDisplay();

socket.onopen = function(e) {
  console.log("WSS: [open] Connection established");
  console.log("WSS: Sending to server");
  socket.send("CONNECT:" + myHostname);
};

socket.onmessage = function(event) {
	var wsRXD = event.data.split(':');
	if (wsRXD[0] == "RX") {
		rxwinMSG("RX: " + wsRXD[1]);
		console.log("WSS: RX: " + wsRXD[1]);
	} else if (wsRXD[0] == "RESPONSE") {
		rxwinMSG("RX: " + wsRXD[1]);
		console.log("WSS: RX: " + wsRXD[1]);
	};

	console.log(`WSS: [message] Data received from server: ${event.data}`);
};

socket.onclose = function(event) {
  if (event.wasClean) {
    console.log(`WSS: [close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    // e.g. server process killed or network down
    // event.code is usually 1006 in this case
    console.log('WSS: [close] Connection died');
  }
};

socket.onerror = function(error) {
	var rxWINerror = "WSS:ERROR connecting to " + wsURI;
	rxwinMSG(rxWINerror);
	console.log(`WSS: [error] ${error.message}`);
};
