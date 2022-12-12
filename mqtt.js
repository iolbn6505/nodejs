const http = require("http");
const fs = require('fs');
var mqtt = require('mqtt');
var express = require('express');
var app = express();
var opt999 = {//RTC內部測試
  port:1883,
  clientId:Math.random().toString(16).slice(3),
  connectTimeout: 4000,
  username: 'DKY0TC7RH3C3K5WMBP',//DK4M42P32W7TFYKA9Y
  password: 'DKY0TC7RH3C3K5WMBP',//DK4M42P32W7TFYKA9Y
  reconnectPeriod: 1000,
};
var opt002 = {//鶯歌
    port:1883,
    clientId:Math.random().toString(16).slice(3),
    connectTimeout: 4000,
    username: 'DKKUFRCCKMC7MFEY9C',
    password: 'DKKUFRCCKMC7MFEY9C',
    reconnectPeriod: 1000,
  };
  var opt004 = {//嘉義
    port:1883,
    clientId:Math.random().toString(16).slice(3),
    connectTimeout: 4000,
    username: 'DKMUFPYCCGA0Z39RTF',
    password: 'DKMUFPYCCGA0Z39RTF',
    reconnectPeriod: 1000,
  };
var time_str=[];
var time_Str=[];
var temp_time=[];
var timeout_count=0;
var msg_str=[];
var msg_Str=[];
var msg_Hex=[];
var device="";
var AP_Number="";
var DT_Number="";
var DT_WS="";
var ALARM;
var TRACK0_1;
var TRACK2_3;
var TRAIN_PASS;
var TRAIN_SPEED;

var msg_Hex={};
var msg_lengh=0;

app.get('/', function (req, res) {
    fs.readFile(__dirname + '/', function(error, data) {
        if (error) {
            res.writeHead(404);
            res.write("opps this doesn't exist - 404");
        } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.write(data, "utf8");
        }
        res.end();
    });
});

app.get('/index.html', function (req, res) {
    fs.readFile(__dirname + '/index.html', function(error, data) {
        if (error) {
            res.writeHead(404);
            res.write("opps this doesn't exist - 404");
        } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.write(data, "utf8");
        }
        res.end();
    });
});
const server = http.createServer(app);
const serv_io =require("socket.io")(server);
server.listen(5000, () => {
    console.log('Express started')
})


var client999  = mqtt.connect('mqtt://iot.cht.com.tw', opt999);
var client002  = mqtt.connect('mqtt://iot.cht.com.tw', opt002);
var client004  = mqtt.connect('mqtt://iot.cht.com.tw', opt004);

function base64ToHex(str) {
    for (var i = 0, bin = atob(str.replace(/[ \r\n]+$/, "")), hex = []; i < bin.length; ++i) {
        let tmp = bin.charCodeAt(i).toString(16);
        if (tmp.length === 1) tmp = "0" + tmp;
        hex[hex.length] = tmp;
    }
    return hex;
}
function HexToBin(hex){
    return ("00000000" + (parseInt(hex, 16)).toString(2)).substr(-8);
}

  client999.on('connect', function () {
    console.log('已連接至Group999');
    client999.subscribe('/v1/device/32070538381/sensor/broadcast/rawdata');//29545513414
  });
  client002.on('connect', function () {
    console.log('已連接至Group002');
    client002.subscribe('/v1/device/29545728356/sensor/broadcast/rawdata');
  });
  client004.on('connect', function () {
    console.log('已連接至Group004');
    client004.subscribe('/v1/device/29545951539/sensor/broadcast/rawdata');
  });

serv_io.sockets.on('connection', function(socket) {
    console.log('已建立WebSocket');
    client999.on('message', function (topic, msg) { 
        msg_lengh=msg.length;

        //show time
        /*-----------------------------------------------------*/
        for(i=1;i<20;i++){
            time_str[19-i]=String.fromCharCode(msg[msg_lengh-i-32]);
        }
        time_str[11]=(parseInt(time_str[11])+Math.floor((parseInt(time_str[12],10)+8)/10)).toString();
        time_str[12]=(((parseInt(time_str[12],10)+8)%10)).toString();
        
        for(i=0;i<19;i++){
            time_Str=time_Str.concat(time_str[i])
            time_Str=time_Str.toString();
            time_Str=time_Str.replace(/,/, "");
            time_Str=time_Str.replace(/T/, " ");
        }
        /*-----------------------------------------------------*/
        //change Base64 to hex
        /*-----------------------------------------------------*/
        for(i=1;i<13;i++){
            msg_str[12-i]=String.fromCharCode(msg[msg_lengh-i-3]);
        }
        for(i=0;i<12;i++){
            msg_Str=msg_Str.concat(msg_str[i])
            msg_Str=msg_Str.toString();
            msg_Str=msg_Str.replace(/,/, "");
        }
        msg_Hex=base64ToHex(msg_Str);
        /*-----------------------------------------------------*/

        //unpack Header
        /*-----------------------------------------------------*/    
        if(msg_Hex[0]!=66){
            socket.emit('mqtt', { 'message': "錯誤封包"});
        }
         /*-----------------------------------------------------*/
         
        //unpack From
        /*-----------------------------------------------------*/ 
        switch (Math.floor(msg_Hex[1]/10)){
            case 0:{
                device="AP";
                AP_Number=msg_Hex[1]%10;
                DT_Number="";
                break;
            }
            case 1:{
                device="DT";
                DT_Number=msg_Hex[1]%10;
                AP_Number="";
                break;
            }
            default:{
                break;
            }
        }
        switch (DT_Number%2){
            case 0:{
                DT_WS="南端";
                DT_Number=DT_Number/2;
                break;
            }
            case 1:{
                DT_WS="北端";
                DT_Number=(DT_Number+1)/2;
                break;
            }
            default:{
                break;
            }
        } 
        /*-----------------------------------------------------*/ 
        
        //unpack DATA_1 (COMMAND)
        /*-----------------------------------------------------*/
        if(HexToBin(msg_Hex[5]).substr(7,1)==1){//----------------------------ALARM
            ALARM=1;
        }
        else{
            ALARM=0;
        }

        if(HexToBin(msg_Hex[5]).substr(3,1)==1){//----------------------------TRACK0_1
            TRACK0_1=1;
        }
        else{
            TRACK0_1=0;
        }
        if(HexToBin(msg_Hex[5]).substr(1,1)==1){//----------------------------TRAIN_PASS
            TRAIN_PASS=1;
        }
        else{
            TRAIN_PASS=0;
        }
        /*-----------------------------------------------------*/ 

        //unpack DATA_2(Speed)
        /*-----------------------------------------------------*/
        TRAIN_SPEED=parseInt(msg_Hex[6], 16).toString();
        /*-----------------------------------------------------*/  
        socket.emit('WS_999', { 'message': msg_Hex[1]%2});   
        socket.emit('mqtt_999', { 'message': DT_WS+device+"第"+AP_Number+DT_Number+"台"+"\n"});
        socket.emit('time_999', { 'message': "最後更新時間:"+time_Str});
        socket.emit('DATA_2_999', { 'message': "列車速度:"+TRAIN_SPEED});
        socket.emit('TrainPass_999', { 'message':TRAIN_PASS});
        socket.emit('TRACK0_1_999', { 'message':TRACK0_1});  
        socket.emit('ALARM_999', { 'message': ALARM}); 
        //console.log(msg_Hex.toString()); 
        time_Str=[];
        msg_Str=[];
    });
    client002.on('message', function (topic, msg) { 
        msg_lengh=msg.length;

        //show time
        /*-----------------------------------------------------*/
        for(i=1;i<20;i++){
            time_str[19-i]=String.fromCharCode(msg[msg_lengh-i-32]);
        }
        time_str[11]=(parseInt(time_str[11])+Math.floor((parseInt(time_str[12],10)+8)/10)).toString();
        time_str[12]=(((parseInt(time_str[12],10)+8)%10)).toString();
        
        for(i=0;i<19;i++){
            time_Str=time_Str.concat(time_str[i])
            time_Str=time_Str.toString();
            time_Str=time_Str.replace(/,/, "");
            time_Str=time_Str.replace(/T/, " ");
        }
        /*-----------------------------------------------------*/
        //change Base64 to hex
        /*-----------------------------------------------------*/
        for(i=1;i<13;i++){
            msg_str[12-i]=String.fromCharCode(msg[msg_lengh-i-3]);
        }
        for(i=0;i<12;i++){
            msg_Str=msg_Str.concat(msg_str[i])
            msg_Str=msg_Str.toString();
            msg_Str=msg_Str.replace(/,/, "");
        }
        msg_Hex=base64ToHex(msg_Str);
        /*-----------------------------------------------------*/

        //unpack Header
        /*-----------------------------------------------------*/    
        if(msg_Hex[0]!=66){
            socket.emit('mqtt', { 'message': "錯誤封包"});
        }
         /*-----------------------------------------------------*/
         
        //unpack From
        /*-----------------------------------------------------*/ 
        switch (Math.floor(msg_Hex[1]/10)){
            case 0:{
                device="AP";
                AP_Number=msg_Hex[1]%10;
                DT_Number="";
                break;
            }
            case 1:{
                device="DT";
                DT_Number=msg_Hex[1]%10;
                AP_Number="";
                break;
            }
            default:{
                break;
            }
        }
        switch (DT_Number%2){
            case 0:{
                DT_WS="南端";
                DT_Number=DT_Number/2;
                break;
            }
            case 1:{
                DT_WS="北端";
                DT_Number=(DT_Number+1)/2;
                break;
            }
            default:{
                break;
            }
        } 
        /*-----------------------------------------------------*/ 
        
        //unpack DATA_1 (COMMAND)
        /*-----------------------------------------------------*/
        if(HexToBin(msg_Hex[5]).substr(7,1)==1){//----------------------------ALARM
            ALARM=1;
        }
        else{
            ALARM=0;
        }

        if(HexToBin(msg_Hex[5]).substr(3,1)==1){//----------------------------TRACK0_1
            TRACK0_1=1;
        }
        else{
            TRACK0_1=0;
        }
        if(HexToBin(msg_Hex[5]).substr(1,1)==1){//----------------------------TRAIN_PASS
            TRAIN_PASS=1;
        }
        else{
            TRAIN_PASS=0;
        }
        /*-----------------------------------------------------*/ 

        //unpack DATA_2(Speed)
        /*-----------------------------------------------------*/
        TRAIN_SPEED=parseInt(msg_Hex[6], 16).toString();
        /*-----------------------------------------------------*/     
        socket.emit('WS_002', { 'message': msg_Hex[1]%2});
        socket.emit('mqtt_002', { 'message': DT_WS+device+"第"+AP_Number+DT_Number+"台"+"\n"});
        socket.emit('time_002', { 'message': "最後更新時間:"+time_Str});
        socket.emit('DATA_2_002', { 'message': "列車速度:"+TRAIN_SPEED});
        socket.emit('TrainPass_002', { 'message':TRAIN_PASS});
        socket.emit('TRACK0_1_002', { 'message':TRACK0_1});  
        socket.emit('ALARM_002', { 'message': ALARM});  
        //console.log(msg_Hex.toString());
        time_Str=[];
        msg_Str=[];
    });
    client004.on('message', function (topic, msg) { 
        msg_lengh=msg.length;

        //show time
        /*-----------------------------------------------------*/
        for(i=1;i<20;i++){
            time_str[19-i]=String.fromCharCode(msg[msg_lengh-i-32]);
        }
        time_str[11]=(parseInt(time_str[11])+Math.floor((parseInt(time_str[12],10)+8)/10)).toString();
        time_str[12]=(((parseInt(time_str[12],10)+8)%10)).toString();
        
        for(i=0;i<19;i++){
            time_Str=time_Str.concat(time_str[i])
            time_Str=time_Str.toString();
            time_Str=time_Str.replace(/,/, "");
            time_Str=time_Str.replace(/T/, " ");
        }
        /*-----------------------------------------------------*/
        //change Base64 to hex
        /*-----------------------------------------------------*/
        for(i=1;i<13;i++){
            msg_str[12-i]=String.fromCharCode(msg[msg_lengh-i-3]);
        }
        for(i=0;i<12;i++){
            msg_Str=msg_Str.concat(msg_str[i])
            msg_Str=msg_Str.toString();
            msg_Str=msg_Str.replace(/,/, "");
        }
        msg_Hex=base64ToHex(msg_Str);
        /*-----------------------------------------------------*/

        //unpack Header
        /*-----------------------------------------------------*/    
        if(msg_Hex[0]!=66){
            socket.emit('mqtt', { 'message': "錯誤封包"});
        }
         /*-----------------------------------------------------*/
         
        //unpack From
        /*-----------------------------------------------------*/ 
        switch (Math.floor(msg_Hex[1]/10)){
            case 0:{
                device="AP";
                AP_Number=msg_Hex[1]%10;
                DT_Number="";
                break;
            }
            case 1:{
                device="DT";
                DT_Number=msg_Hex[1]%10;
                AP_Number="";
                break;
            }
            default:{
                break;
            }
        }
        switch (DT_Number%2){
            case 0:{
                DT_WS="南端";
                DT_Number=DT_Number/2;
                break;
            }
            case 1:{
                DT_WS="北端";
                DT_Number=(DT_Number+1)/2;
                break;
            }
            default:{
                break;
            }
        } 
        /*-----------------------------------------------------*/ 
        
        //unpack DATA_1 (COMMAND)
        /*-----------------------------------------------------*/
        if(HexToBin(msg_Hex[5]).substr(7,1)==1){//----------------------------ALARM
            ALARM=1;
        }
        else{
            ALARM=0;
        }

        if(HexToBin(msg_Hex[5]).substr(3,1)==1){//----------------------------TRACK0_1
            TRACK0_1=1;
        }
        else{
            TRACK0_1=0;
        }
        if(HexToBin(msg_Hex[5]).substr(1,1)==1){//----------------------------TRAIN_PASS
            TRAIN_PASS=1;
        }
        else{
            TRAIN_PASS=0;
        }
        /*-----------------------------------------------------*/ 

        //unpack DATA_2(Speed)
        /*-----------------------------------------------------*/
        TRAIN_SPEED=parseInt(msg_Hex[6], 16).toString();
        /*-----------------------------------------------------*/     
        socket.emit('WS_004', { 'message': msg_Hex[1]%2});
        socket.emit('mqtt_004', { 'message': DT_WS+device+"第"+AP_Number+DT_Number+"台"+"\n"});
        socket.emit('time_004', { 'message': "最後更新時間:"+time_Str});
        socket.emit('DATA_2_004', { 'message': "列車速度:"+TRAIN_SPEED});
        socket.emit('TrainPass_004', { 'message':TRAIN_PASS});
        socket.emit('TRACK0_1_004', { 'message':TRACK0_1});  
        socket.emit('ALARM_004', { 'message': ALARM});  
        //console.log(msg_Hex.toString());
        time_Str=[];
        msg_Str=[];
    });
});