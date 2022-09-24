const SLACK_WEBHOOK_URL: string = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
const CW_MYACCOUNTID: number = parseInt(PropertiesService.getScriptProperties().getProperty('CW_MYACCOUNTID'), 10);
const CW_MEMOTOSLACKROOMID: number = parseInt(PropertiesService.getScriptProperties().getProperty('CW_MEMOTOSLACKROOMID'), 10);

function doPost(e){
    let json = JSON.parse(e.postData.contents);
    let roomId: number = json.webhook_event.room_id;
    let accountId: number = json.webhook_event.account_id;
    let messageId: number = json.webhook_event.message_id;
    let body: string = json.webhook_event.body;
    
    //memoToSlackの自分の投稿以外は飛ばさない
    if (roomId !== CW_MEMOTOSLACKROOMID || accountId !== CW_MYACCOUNTID) {
        return;
    }

    let sendBody: string = `${ body }`;
    
    PostMessageToSlack(sendBody);
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