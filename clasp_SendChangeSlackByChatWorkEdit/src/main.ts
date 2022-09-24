const SLACK_WEBHOOK_URL: string = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
const CW_MYCHATID: number = parseInt(PropertiesService.getScriptProperties().getProperty('CW_MYCHATID'), 10);
const CW_MYACCOUNTID: number = parseInt(PropertiesService.getScriptProperties().getProperty('CW_MYACCOUNTID'), 10);
const CW_ACCOUNTNAME1: string = PropertiesService.getScriptProperties().getProperty('CW_ACCOUNTNAME1');
const CW_ACCOUNTID1: number = parseInt(PropertiesService.getScriptProperties().getProperty('CW_ACCOUNTID1'), 10);
const CW_ACCOUNTNAME2: string = PropertiesService.getScriptProperties().getProperty('CW_ACCOUNTNAME2');
const CW_ACCOUNTID2: number = parseInt(PropertiesService.getScriptProperties().getProperty('CW_ACCOUNTID2'), 10);
const CW_ACCOUNTNAME3: string = PropertiesService.getScriptProperties().getProperty('CW_ACCOUNTNAME3');
const CW_ACCOUNTID3: number = parseInt(PropertiesService.getScriptProperties().getProperty('CW_ACCOUNTID3'), 10);
const CW_ACCOUNTNAME4: string = PropertiesService.getScriptProperties().getProperty('CW_ACCOUNTNAME4');
const CW_ACCOUNTID4: number = parseInt(PropertiesService.getScriptProperties().getProperty('CW_ACCOUNTID4'), 10);

function doPost(e){
    let json = JSON.parse(e.postData.contents);
    let roomId: number = json.webhook_event.room_id;
    let accountId: number = json.webhook_event.account_id;
    let messageId: number = json.webhook_event.message_id;
    let body: string = json.webhook_event.body;

    // マイチャットへの投稿はとばさない
    if (roomId == CW_MYCHATID) {
        return;
    }

    let accountName = GetAccountName(accountId);
    let trgtMsgURL: string = `https://www.chatwork.com/#!rid${ roomId }-${ messageId }`;

    let sendBody: string = `\`${ accountName }\` (${ accountId }) ※edit

${ body }

${ trgtMsgURL }`;
    
    PostMessageToSlack(sendBody);
}

//アカウントIDからアカウント名を返す
function GetAccountName(id: number): string {
    let accountName: string;

    switch (id) {
        case CW_MYACCOUNTID:
            accountName = "自分の投稿";
            break;
        case CW_ACCOUNTID1:
            accountName = CW_ACCOUNTNAME1;
            break;
        case CW_ACCOUNTID2:
            accountName = CW_ACCOUNTNAME2;
            break;
        case CW_ACCOUNTID3:
            accountName = CW_ACCOUNTNAME3;
            break;
        case CW_ACCOUNTID4:
                accountName = CW_ACCOUNTNAME4;
                break;
        default:
            accountName = '該当なし';
            break;
    }
    
    return accountName;
}    

//Slackの任意のワークスペースに渡したメッセージを送信する
function PostMessageToSlack(sendBody: string) {
    let params: any = {
        method: 'post',
        contentType: 'application/json',
        payload: `{"text":'${ sendBody }'}`
    };
    
    UrlFetchApp.fetch(SLACK_WEBHOOK_URL, params);
}