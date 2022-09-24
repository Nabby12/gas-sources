const SLACK_VERIFICATIONTOKEN: string = PropertiesService.getScriptProperties().getProperty('SLACK_VERIFICATIONTOKEN');
const SLACK_WEBHOOK_URL: string = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
const PUNCHIN_KEY: string = PropertiesService.getScriptProperties().getProperty('PUNCHIN_KEY');
const PUNCHIN_MESSAGE_SLACK: string = PropertiesService.getScriptProperties().getProperty('PUNCHIN_MESSAGE_SLACK');
const PUNCHIN_MESSAGE_CHATWORK: string = PropertiesService.getScriptProperties().getProperty('PUNCHIN_MESSAGE_CHATWORK');
const PUNCHOUT_KEY: string = PropertiesService.getScriptProperties().getProperty('PUNCHOUT_KEY');
const PUNCHOUT_MESSAGE_SLACK: string = PropertiesService.getScriptProperties().getProperty('PUNCHOUT_MESSAGE_SLACK');
const PUNCHOUT_MESSAGE_CHATWORK: string = PropertiesService.getScriptProperties().getProperty('PUNCHOUT_MESSAGE_CHATWORK');
const CHATWORK_API_TOKEN: string = PropertiesService.getScriptProperties().getProperty('CHATWORK_API_TOKEN');
const CHATWORK_ROOMID: string = PropertiesService.getScriptProperties().getProperty('CHATWORK_ROOMID');
const CHATWORK_ROOMURL: string = PropertiesService.getScriptProperties().getProperty('CHATWORK_ROOMURL');
const KEYWORDERRORCOMMENT: string = PropertiesService.getScriptProperties().getProperty('KEYWORDERRORCOMMENT');

function doPost(e: string) {
    let verificationToken: string = e.parameter.token;
    if (verificationToken != SLACK_VERIFICATIONTOKEN) {
        throw new Error('Invalid Token');
    }
    
    let arg: string = e.parameter.text.replace(/　/g, ' ').trim();
    
    let punchKey: string = '';
    if (arg.length > 0) {
        let tmpAry:string[] = arg.split(' ');
        punchKey = tmpAry[0]
    }

    let replyMessageToChatwork: string = '';
    let replyMessageToSLACK: string = '';
    if (punchKey === PUNCHIN_KEY) {
        replyMessageToChatwork = PUNCHIN_MESSAGE_CHATWORK;
        replyMessageToSLACK = `${ PUNCHIN_MESSAGE_SLACK }\n ${ CHATWORK_ROOMURL + CHATWORK_ROOMID }`;

    } else if (punchKey === PUNCHOUT_KEY) {
        replyMessageToChatwork = PUNCHOUT_MESSAGE_CHATWORK;
        replyMessageToSLACK = `${ PUNCHOUT_MESSAGE_SLACK }\n ${ CHATWORK_ROOMURL + CHATWORK_ROOMID }`;

    } else {
        replyMessageToSLACK = KEYWORDERRORCOMMENT;
    }

    // send to chatwork
    if (replyMessageToChatwork != '') {
        sendMessage(CHATWORK_API_TOKEN, CHATWORK_ROOMID, replyMessageToChatwork);
    }

    // send to slack
    PostMessageToSlack(replyMessageToSLACK);
    return ContentService.createTextOutput();
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

function PostMessageToSlack(sendBody: string) {
    let params: any = {
        method: 'post',
        contentType: 'application/json',
        payload: `{"text":"${ sendBody }"}`
    };
    
    UrlFetchApp.fetch(SLACK_WEBHOOK_URL, params);
}