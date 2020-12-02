const express = require('express');
const request = require('request');
const convert = require('xml-js');

const TARGET_URL = 'https://api.line.me/v2/bot/message/reply'
const TOKEN = 'z5iy5sMU1W4xZAlwvn0/5x4U+4ZsqI0hKO1ZZNFxUGlNzGBjFg2D1u6/Ij5C/Sbkncx3hyYg7Nfz5JnMD8BG/9Z3TEEHPvy1A2XhkPKs04v0/n6TjH1A3e9X23zYdYmNSGyPn2hDGglgm2p3YmtLSwdB04t89/1O/w1cDnyilFU='
const FOODAPI_URL = 'http://apis.data.go.kr/1470000/FoodAdtvInfoService/getFoodAdtvInfoList'
const FOODAPI_KEY = 'ofY2ppOq5kBqT5jYPaGsW%2BEy7OR5a1bf5Z9PHvqNKvwO5DSCaU2x2qCj%2FoXnuB1YVbMTlErkHWSMEsR5b7isrw%3D%3D';
var queryParams = '?' + encodeURIComponent('ServiceKey') + '=' +key; 
//queryParams += '&' + encodeURIComponent('prdlst_cd') + '=' + encodeURIComponent('C0118010300000'); 
queryParams += '&' + encodeURIComponent('pc_kor_nm') + '=' + encodeURIComponent('과.채음료'); 
//queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('3'); 
//queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('100'); 
const fs = require('fs');
const path = require('path');
const HTTPS = require('https');
const domain = "foodbot2020.ml"
const sslport = 23023;
const bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.post('/hook', function (req, res) {

    var eventObj = req.body.events[0];
    var source = eventObj.source;
    var message = eventObj.message;

    // request log
    console.log('======================', new Date() ,'======================');
    console.log('[request]', req.body);
    console.log('[request source] ', eventObj.source);
    console.log('[request message]', eventObj.message);

    getfoodinfo(eventObj.replyToken, eventObj.message.text); // eventObj.message.text 로 pc_kor_nm 받기
    

    res.sendStatus(200);
});

function getfoodinfo(replyToken, kor_name) {

    request.post(
        {
            url: FOODAPI_URL + queryParams,
        },(error, response, body) => {
            if(error){
                console.log('에러입니다.')
            }
            else{
                if(response.statusCode ==200)
                {
                    var result =body;
                    var xmltojson = convert.xml2json(result,{compact:true,spaces:4});
                    //console.log(xmltojson);
                    var resObj = eval("("+xmltojson+")");
                    var resultItems = resObj.response.body.items;
                    var responseMessage ='[ ' + resultItems.item[0].PC_KOR_NM._text + ' ]\n';


                    for(var i=0 ; i < resultItems.item.length; i ++)
                    {
                        var addictive = resultItems.item[i].T_KOR_NM._text;
                        var specVal = resultItems.item[i].SPEC_VAL_SUMUP._text;
                        responseMessage += addictive + ' : ' + specVal + '\n';
                    }
                    console.log('[responese message]',responseMessage);
                    
                    request.post(
                        {
                            url: TARGET_URL,
                            headers: {
                                'Authorization': `Bearer ${TOKEN}`
                            },
                            json: {
                                "replyToken":replyToken,
                                "messages":[
                                    {
                                        "type":"text",
                                        "text":responseMessage
                                    }
                                ]
                            }
                        },(error, response, body) => {
                            console.log(body)
                        });
                }
            }
        });

}

try {
    const option = {
      ca: fs.readFileSync('/etc/letsencrypt/live/' + domain +'/fullchain.pem'),
      key: fs.readFileSync(path.resolve(process.cwd(), '/etc/letsencrypt/live/' + domain +'/privkey.pem'), 'utf8').toString(),
      cert: fs.readFileSync(path.resolve(process.cwd(), '/etc/letsencrypt/live/' + domain +'/cert.pem'), 'utf8').toString(),
    };
  
    HTTPS.createServer(option, app).listen(sslport, () => {
      console.log(`[HTTPS] Server is started on port ${sslport}`);
    });
  } catch (error) {
    console.log('[HTTPS] HTTPS 오류가 발생하였습니다. HTTPS 서버는 실행되지 않습니다.');
    console.log(error);
  }
  