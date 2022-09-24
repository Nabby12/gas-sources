const LINE_NOTIFY_TOKEN: string = PropertiesService.getScriptProperties().getProperty('LINE_NOTIFY_TOKEN');
const BACKLOG_SPACE_KEY: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_SPACE_KEY');
const BACKLOG_PROJECT_ID: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_PROJECT_ID');
const BACKLOG_API_TOKEN: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_API_TOKEN');
const TARGET_HOUR: string = PropertiesService.getScriptProperties().getProperty('TARGET_HOUR');
const TARGET_MINITUE: string = PropertiesService.getScriptProperties().getProperty('TARGET_MINITUE');
const TRIGGER_TARGET_FUNCTION: string = PropertiesService.getScriptProperties().getProperty('TRIGGER_TARGET_FUNCTION');

function SendBacklogScheduleToLINE() {
    // 呼び出したトリガーを削除し翌日のトリガーを生成
    delTrigger();
    setTrigger();

    let sendBody: string = getSendBody();

    let options = {
        'method':'post',
        'contentType' : 'application/x-www-form-urlencoded',
        'headers':{'Authorization':'Bearer ' + LINE_NOTIFY_TOKEN},
        'payload':{'message': sendBody},
    };

    let notifyUrl: string ='https://notify-api.line.me/api/notify';
    UrlFetchApp.fetch(notifyUrl, options);
}
function getSendBody(): string {
    let trgtDate: Date = new Date();

    let trgtMonth: number = trgtDate.getMonth() + 1;
    let trgtMonthStr: string = "0" + trgtMonth;
    let trgtDayStr: string = "0" + trgtDate.getDate()
    let dueDate: string = trgtDate.getFullYear() + "-" + trgtMonthStr.slice(-2) + "-" + trgtDayStr.slice(-2);

    let trgtUrl: string = "https://" + BACKLOG_SPACE_KEY + ".backlog.com/api/v2/issues?apiKey=" + BACKLOG_API_TOKEN;
    let trgtStatus = {
        "projectId[]": BACKLOG_PROJECT_ID,
        "statusId[]": 1,
        "sort": "dueDate",
        "order": '',
        "count": 100,
        "dueDateSince": dueDate,
        "dueDateUntil": dueDate,
    };

    let responseIssue = UrlFetchApp.fetch(trgtUrl + '&' + createQuery(trgtStatus));
    if (responseIssue.getResponseCode() != 200) {
        return;
    }

    let issueList = JSON.parse(responseIssue.getContentText());

    if (issueList.length < 1) {
        return;
    }

    let replyMessage: string = '';
    for (let i = 0; i < issueList.length; i++) {
        let trgtIssueStr: string = issueList[i]["issueType"]["name"] + '：' + issueList[i]["summary"];
        
        replyMessage += '\n' + trgtIssueStr;
    }

    return replyMessage;
}
function createQuery(param) {
    let query = [];
    for(let key in param) {
      query.push(key + '=' + encodeURI(param[key]))
    };
    return query.join('&');
}


function setTrigger() {
    let trgtTime: Date = new Date();
    // 実行時間翌日の指定時間を取得する
    trgtTime.setDate(trgtTime.getDate() + 1)
    trgtTime.setHours(Number(TARGET_HOUR));
    trgtTime.setMinutes(Number(TARGET_MINITUE));

    ScriptApp.newTrigger(TRIGGER_TARGET_FUNCTION).timeBased().at(trgtTime).create();
}
function delTrigger() {
  let triggers = ScriptApp.getProjectTriggers();
  for(var i=0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === TRIGGER_TARGET_FUNCTION) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}