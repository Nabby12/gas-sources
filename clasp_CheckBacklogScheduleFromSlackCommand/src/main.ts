const SLACK_VERIFICATION_TOKEN: string = PropertiesService.getScriptProperties().getProperty('SLACK_VERIFICATION_TOKEN');
const SLACK_WEBHOOK_URL: string = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
const GET_SCHEDULE_DATEWORD1: string = PropertiesService.getScriptProperties().getProperty('GET_SCHEDULE_DATEWORD1');
const GET_SCHEDULE_DATEWORD2: string = PropertiesService.getScriptProperties().getProperty('GET_SCHEDULE_DATEWORD2');
const GET_SCHEDULE_DATEWORD3: string = PropertiesService.getScriptProperties().getProperty('GET_SCHEDULE_DATEWORD3');
const GET_SCHEDULE_REPLYWORDSTART: string = PropertiesService.getScriptProperties().getProperty('GET_SCHEDULE_REPLYWORDSTART');
const GET_SCHEDULE_REPLYWORDEND: string = PropertiesService.getScriptProperties().getProperty('GET_SCHEDULE_REPLYWORDEND');
const GET_NOSCHEDULE_REPLYWORD: string = PropertiesService.getScriptProperties().getProperty('GET_NOSCHEDULE_REPLYWORD');
const GET_SCHEDULE_ERRORREPLYWORD: string = PropertiesService.getScriptProperties().getProperty('GET_SCHEDULE_ERRORREPLYWORD');
const BACKLOG_API_TOKEN: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_API_TOKEN');
const BACKLOG_SPACE_KEY: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_SPACE_KEY');
const BACKLOG_PROJECT_ID: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_PROJECT_ID');

function doPost(e: string) {
    let verificationToken: string = e.parameter.token;
    if (verificationToken != SLACK_VERIFICATION_TOKEN) {
        throw new Error('Invalid Token');
    }
    
    let arg: string = e.parameter.text;

    // 全てのスペースを取り除く
    arg = arg.replace(/\s+/g, '');

    // 予定の確認
    SendScheduleToSlack(arg)

    return ContentService.createTextOutput();
}


function SendScheduleToSlack(arg: string) {
    let dateStr :any = arg;

    let dateErrFlg: boolean = false;
    let trgtDate: Date = new Date();
    switch (dateStr) {
        case GET_SCHEDULE_DATEWORD1:
            break;
        case GET_SCHEDULE_DATEWORD2:
            trgtDate.setDate(trgtDate.getDate() + 1);
            break;
        default:
            if (dateStr.indexOf(GET_SCHEDULE_DATEWORD3) != -1){
                let buf: any = dateStr.substring(0, dateStr.length - GET_SCHEDULE_DATEWORD3.length);
                if (isNaN(buf)) {
                    dateErrFlg = true;
                    break;
                };

                trgtDate.setDate(trgtDate.getDate() + parseInt(buf));
                break;
            }
            
            if (dateStr.length != 8 || isNaN(dateStr)) {
                dateErrFlg = true;
                break;
            } else if (dateStr.substring(4, 6) > 12 || dateStr.substring(6, 8) > 31) {
                dateErrFlg = true;
                break;
            }

            dateStr = dateStr.substring(0, 4) + '/' + dateStr.substring(4, 6) + '/' + dateStr.substring(6, 8);
            let dateAry: number[] = dateStr.split('/');

            trgtDate = new Date(dateAry[0], dateAry[1] - 1, dateAry[2]);
            break;
    }

    if (dateErrFlg === true) {
        PostMessageToSlack(GET_SCHEDULE_ERRORREPLYWORD);
        return;
    }

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
        // "dueDateSince": dueDate,
        "dueDateUntil": dueDate,
    };

    let responseIssue = UrlFetchApp.fetch(trgtUrl + '&' + createQuery(trgtStatus));
    if (responseIssue.getResponseCode() != 200) {
        return;
    }

    let issueList = JSON.parse(responseIssue.getContentText());

    if (issueList.length < 1) {
        let replyBody: string = dateStr + GET_NOSCHEDULE_REPLYWORD;
        PostMessageToSlack(replyBody);
        return;
    }

    let replyMessage: string;
    for (let i = 0; i < issueList.length; i++) {
        let dueDateStr: string = issueList[i]["dueDate"]
        let dueDateStrAry: string[] = dueDateStr.substring(0,10).split('-')
        
        let trgtIssueStr: string = issueList[i]["issueType"]["name"] + '：' + issueList[i]["summary"]
                                    + '（期限：' + dueDateStrAry[0] + '/' + dueDateStrAry[1] + '/' + dueDateStrAry[2]+ '）';
        
        if (i === 0) {
            replyMessage = dateStr + GET_SCHEDULE_REPLYWORDSTART + '\n' + '\n' + trgtIssueStr;
        } else {
            replyMessage += '\n' + trgtIssueStr;
        }
    }

    replyMessage += '\n' + '\n' + GET_SCHEDULE_REPLYWORDEND;

    PostMessageToSlack(replyMessage);
    return;
}
function createQuery(param) {
    let query = [];
    for(let key in param) {
      query.push(key + '=' + encodeURI(param[key]))
    };
    return query.join('&');
}

function PostMessageToSlack(sendBody: string) {
    let params: any = {
        method: 'post',
        contentType: 'application/json',
        payload: `{"text":'${ sendBody }'}`
    };

    UrlFetchApp.fetch(SLACK_WEBHOOK_URL, params);
}