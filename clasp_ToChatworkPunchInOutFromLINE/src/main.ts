const LINE_CHANNEL_ACCESSTOKEN: string = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESSTOKEN');
const PUNCHIN_KEY: string = PropertiesService.getScriptProperties().getProperty('PUNCHIN_KEY');
const PUNCHIN_MESSAGE_LINE: string = PropertiesService.getScriptProperties().getProperty('PUNCHIN_MESSAGE_LINE');
const PUNCHIN_MESSAGE_CHATWORK: string = PropertiesService.getScriptProperties().getProperty('PUNCHIN_MESSAGE_CHATWORK');
const PUNCHOUT_KEY: string = PropertiesService.getScriptProperties().getProperty('PUNCHOUT_KEY');
const PUNCHOUT_MESSAGE_LINE: string = PropertiesService.getScriptProperties().getProperty('PUNCHOUT_MESSAGE_LINE');
const PUNCHOUT_MESSAGE_CHATWORK: string = PropertiesService.getScriptProperties().getProperty('PUNCHOUT_MESSAGE_CHATWORK');
const CHATWORK_API_TOKEN: string = PropertiesService.getScriptProperties().getProperty('CHATWORK_API_TOKEN');
const CHATWORK_ROOMID: string = PropertiesService.getScriptProperties().getProperty('CHATWORK_ROOMID');
const CHATWORK_ROOMURL: string = PropertiesService.getScriptProperties().getProperty('CHATWORK_ROOMURL');

function doPost(e: string) {
    let event = JSON.parse(e.postData.contents).events[0];
    let replyToken: string = event.replyToken;

    if (typeof replyToken === 'undefined') {
        throw new Error('undefined Token');
    }

    let userId: string = event.source.userId;

    if (event.type == 'message') {
        let userMessage: string = event.message.text.replace(/　/g, ' ').trim();

        let replyMessageToChatwork: string = '';
        let replyMessageToLINE: string = '';

        if (userMessage === PUNCHIN_KEY){
            replyMessageToChatwork = PUNCHIN_MESSAGE_CHATWORK;
            replyMessageToLINE = `${ PUNCHIN_MESSAGE_LINE }\n ${ CHATWORK_ROOMURL + CHATWORK_ROOMID }`;
    
        } else if (userMessage === PUNCHOUT_KEY) {
            replyMessageToChatwork = PUNCHOUT_MESSAGE_CHATWORK;
            replyMessageToLINE = `${ PUNCHOUT_MESSAGE_LINE }\n ${ CHATWORK_ROOMURL + CHATWORK_ROOMID }`;
            
        }

        if (replyMessageToLINE === ''){
            replyMessageToLINE = 'invalid Text';
        }
        
        // send to chatwork
        if (replyMessageToChatwork != '') {
            sendMessage(CHATWORK_API_TOKEN, CHATWORK_ROOMID, replyMessageToChatwork);
        }

        // send to LINE
        const LINE_HTTPREQUEST_REPLY: string = 'https://api.line.me/v2/bot/message/reply';
        UrlFetchApp.fetch(LINE_HTTPREQUEST_REPLY, {
          'headers': {
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer ' +LINE_CHANNEL_ACCESSTOKEN,
          },
          'method': 'post',
          'payload': JSON.stringify({
            'replyToken': replyToken,
            'messages': [{
              'type': 'text',
              'text': replyMessageToLINE,
            }],
          }),
        });
        
        return ContentService.createTextOutput(
        JSON.stringify({'content': 'post ok'})
        ).setMimeType(ContentService.MimeType.JSON);
    }
}

function sendMessage(token,room_id,body){
    let params = {
        headers : {"X-ChatWorkToken" : token},
        method : "post",
        payload : {
        body : body
        }
    };
    
    let url: string = "https://api.chatwork.com/v2/rooms/" + room_id + "/messages";
    UrlFetchApp.fetch(url, params);   
}