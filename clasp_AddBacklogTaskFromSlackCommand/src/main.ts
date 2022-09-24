const SLACK_VERIFICATION_TOKEN: string = PropertiesService.getScriptProperties().getProperty('SLACK_VERIFICATION_TOKEN');
const SLACK_WEBHOOK_URL: string = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
const TASKKEY_PLAN: string = PropertiesService.getScriptProperties().getProperty('TASKKEY_PLAN');
const TASKKEY_TASK: string = PropertiesService.getScriptProperties().getProperty('TASKKEY_TASK');
const TASKKEY_ANXIOUS: string = PropertiesService.getScriptProperties().getProperty('TASKKEY_ANXIOUS');
const TASKKEY_REQUEST: string = PropertiesService.getScriptProperties().getProperty('TASKKEY_REQUEST');
const TASKKEY_WORRY: string = PropertiesService.getScriptProperties().getProperty('TASKKEY_WORRY');
const TASKKEY_OTHER: string = PropertiesService.getScriptProperties().getProperty('TASKKEY_OTHER');
const TASKID_PLAN: string = PropertiesService.getScriptProperties().getProperty('TASKID_PLAN');
const TASKID_TASK: string = PropertiesService.getScriptProperties().getProperty('TASKID_TASK');
const TASKID_ANXIOUS: string = PropertiesService.getScriptProperties().getProperty('TASKID_ANXIOUS');
const TASKID_REQUEST: string = PropertiesService.getScriptProperties().getProperty('TASKID_REQUEST');
const TASKID_WORRY: string = PropertiesService.getScriptProperties().getProperty('TASKID_WORRY');
const TASKID_OTHER: string = PropertiesService.getScriptProperties().getProperty('TASKID_OTHER');
const ADD_MESSAGE_START: string = PropertiesService.getScriptProperties().getProperty('ADD_MESSAGE_START');
const ADD_MESSAGE_END: string = PropertiesService.getScriptProperties().getProperty('ADD_MESSAGE_END');
const BACKLOG_API_TOKEN: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_API_TOKEN');
const BACKLOG_SPACE_KEY: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_SPACE_KEY');
const BACKLOG_PROJECT_ID: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_PROJECT_ID');
const BACKLOG_ASSIGNEE_ID: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_ASSIGNEE_ID');
const ERROR_MESSAGE_FOR_PLAN: string = PropertiesService.getScriptProperties().getProperty('ERROR_MESSAGE_FOR_PLAN');

function doPost(e: string) {
    let verificationToken: string = e.parameter.token;
    if (verificationToken != SLACK_VERIFICATION_TOKEN) {
        throw new Error('Invalid Token');
    }
    
    let arg: string = e.parameter.text;

    // 全てのスペースを取り除く
    arg = arg.replace(/\s+/g, '');

    let taskKeyAry: string[] = [
        TASKKEY_PLAN,
        TASKKEY_TASK,
        TASKKEY_ANXIOUS,
        TASKKEY_REQUEST,
        TASKKEY_WORRY,
        TASKKEY_OTHER,
    ];
    let taskIdAry: string[] = [
        TASKID_PLAN,
        TASKID_TASK,
        TASKID_ANXIOUS,
        TASKID_REQUEST,
        TASKID_WORRY,
        TASKID_OTHER,
    ];

    let trgtKey: string = '';
    let trgtId: string = '';
    taskKeyAry.some((value, index) => {
        if (arg.startsWith(value)) {
            trgtKey = value;
            trgtId = taskIdAry[index]
            return true;
        }
    });

    AddTaskToBacklog(arg, trgtKey, trgtId)

    return ContentService.createTextOutput();
}

function AddTaskToBacklog(arg: string, trgtKey: string, trgtId: string) {
    let taskTitle: string = arg.replace(trgtKey, '').trim();

    // plan の時は yyyymmdd 形式かどうか判定 + hhmm 形式で時間が入っていれば不正値かどうか判定（「時間」は省略可）
    let trgtDateStr: any = '';
    if (trgtKey === TASKKEY_PLAN) {
        let body = arg.replace(trgtKey,'').trim()
        let trgtAry: string[]
        if (body.indexOf(' ') < 0 ) {
            trgtAry = [body.substring(0, 8).toString(), body.substring(8 ,12).toString(), body.substring(12).toString()];
        } else {
            trgtAry = body.split(' ')
        }
        trgtDateStr = trgtAry[0].toString();
        if (trgtDateStr.length === 8 && !isNaN(trgtDateStr)) {
            trgtDateStr = trgtDateStr.substring(0, 4) + '-' + trgtDateStr.substring(4, 6) + '-' + trgtDateStr.substring(6, 8);
        }

        // yyyymmdd　を取り除く
        taskTitle = taskTitle.replace(trgtAry[0],'').trim();
        
        // 二つ目の引数に数値を設定している時のみ形式判定
        if (trgtAry.length > 2) {
            let trgtTime: any = '';
            trgtTime = trgtAry[1].toString();
            if (!isNaN(trgtTime)) {
                if (trgtTime.length !=4 || trgtTime.substring(0, 2) > 23 || trgtTime.substring(2, 4) > 59) {
                    PostMessageToSlack(ERROR_MESSAGE_FOR_PLAN);
                    return;
                }
            }
        }
        if (trgtDateStr === '') {
            PostMessageToSlack(ERROR_MESSAGE_FOR_PLAN);
            return;
        }
    // task の時は yyyymmdd 形式で日付があるかを判定（「日付」は省略可）
    } else if (trgtKey === TASKKEY_TASK) {
        let body = arg.replace(trgtKey,'').trim()
        let trgtAry: string[]
        if (body.indexOf(' ') < 0 ) {
            trgtAry = [body.substring(0, 8).toString(), body.substring(8).toString()];
        } else {
            trgtAry = body.split(' ')
        }
        trgtDateStr = trgtAry[0].toString();
        if (trgtDateStr.length === 8 && !isNaN(trgtDateStr)) {
            trgtDateStr = trgtDateStr.substring(0, 4) + '-' + trgtDateStr.substring(4, 6) + '-' + trgtDateStr.substring(6, 8);
                   
            // yyyymmdd　を取り除く
            taskTitle = taskTitle.replace(trgtAry[0],'').trim();

        } else {
            trgtDateStr = ''
        }
    }

    // add-backlog-task
    AddBacklogTask(trgtId, taskTitle, trgtDateStr);

    let sendMessage: string = ADD_MESSAGE_START + trgtKey + '：' + taskTitle + ADD_MESSAGE_END;
    
    // send-message
    PostMessageToSlack(sendMessage);    
    return ContentService.createTextOutput();
}
function AddBacklogTask(trgtId: string, taskTitle: string, trgtDateStr: string)  {
    let BACKLOG_HTTPREQUEST_ADD_ISSUE: string = 'https://' + BACKLOG_SPACE_KEY + '.backlog.com/api/v2/issues?apiKey=' + BACKLOG_API_TOKEN;
    let param = {
        "method": "post"
    };

    let issue = {
        "projectId": BACKLOG_PROJECT_ID,
        "issueTypeId": trgtId,
        "summary": taskTitle,
        "priorityId": 3,
        "dueDate": trgtDateStr,
        "assigneeId": BACKLOG_ASSIGNEE_ID,
    };

    let request = UrlFetchApp.fetch(BACKLOG_HTTPREQUEST_ADD_ISSUE　+ '&' + createQuery(issue), param);

    return JSON.parse(request.getContentText());
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