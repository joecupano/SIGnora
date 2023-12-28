//
// SIGnora_api.h
//
// 20231228-0500
//

//
//  Websocket API
// 
//  Client initiates commands with SET and GET. Server acknowledges commands
//  by sending the command received replacing SET and GET with ACK.
//

//
//   RADIO
//
#define RADIO_RESET "SET:RADIO:RESET"
//
#define RADIO_FREQ_SET "SET:RADIO:FREQ:"          // ex.  SET:RADIO:FREQ:911250000  (Freq in Hz)
#define RADIO_FREQ_GET "GET:RADIO:FREQ"
//
#define RADIO_PWR_LOW "SET:RADIO:PWR:LOW"
#define RADIO_PWR_MED "SET:RADIO:PWR:MEDIUM"
#define RADIO_PWR_HIGH "SET:RADIO:PWR:HIGH"
#define RADIO_PWR_GET "GET:RADIO:PWR"
//
#define RADIO_BEACON_ON "SET:RADIO:BEACON:ON"
#define RADIO_BEACON_OFF "SET:RADIO:BEACON:OFF"
//
#define RADIO_LORA "SET:RADIO:LORA"
#define RADIO_FSK "SET:RADIO:FSK"

//
//  LORA
//
#define LORA_SF_SET "SET:LORA:SF:"                // ex.  SET:LORA:SF:7  
#define LORA_SF_GET "GET:LORA:SF"
#define LORA_CR_SET "SET:LORA:CR:"                // ex.  SET:LORA:CR:8
#define LORA_CR_GET "GET:LORA:CR"
#define LORA_BW_SET "SET:LORA:BW:"                // ex.  SET:LORA:BW:125000   (Freq in Hz)
#define LORA_BW_GET "SET:LORA:BW" 

//
// MESSAGES
//
#define TX_MESSAGE "TX:"             // "TX: blablahblah"
#define RX_MESSAGE "RX:"             // "RX: blahblahblah |RSSI: "

