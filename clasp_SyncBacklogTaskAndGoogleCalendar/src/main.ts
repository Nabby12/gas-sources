const BACKLOG_SCHEDULE_ID: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_SCHEDULE_ID');
const BACKLOG_SPACE_KEY: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_SPACE_KEY');
const BACKLOG_PROJECT_ID: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_PROJECT_ID');
const BACKLOG_API_TOKEN: string = PropertiesService.getScriptProperties().getProperty('BACKLOG_API_TOKEN');
const GOOGLE_CALENDAR_ID: string = PropertiesService.getScriptProperties().getProperty('GOOGLE_CALENDAR_ID');

function doPost(e){
    let body = JSON.parse(e.postData.contents);

    if (typeof body.content.dueDate === 'undefined' || body.content.issueType.id != BACKLOG_SCHEDULE_ID) {
        return;
    }

    // 完了タスクのバージョンは削除して終了
    if (typeof body.content.versions[0] != 'undefined') {
        let statusId: number = body.content.status.id;

        if (statusId === 4) {
            let trgtId: string = body.content.versions[0]['id'];

            let BACKLOG_HTTPREQUEST_GET_VERSIONSa: string = 'https://' + BACKLOG_SPACE_KEY + '.backlog.com/api/v2/projects/' + BACKLOG_PROJECT_ID + '/versions/' + trgtId + '?apiKey=' + BACKLOG_API_TOKEN;

            let param = {
                "method": "delete"
            };

            let request = UrlFetchApp.fetch(BACKLOG_HTTPREQUEST_GET_VERSIONSa, param);

            return;
        }
    }

    let trgtDateBody;
    trgtDateBody = body.content.dueDate;

    let trgtDateAry: number[] = trgtDateBody.split('-');
    let trgtDateStartStr: string = trgtDateAry[0] + '/' + trgtDateAry[1] + '/' + trgtDateAry[2];

    let trgtTitle: string = body.content.summary;
    let trgtTimeStr: any = trgtTitle.substring(0, 4);

    let trgtDateEndtStr: string
    if (!isNaN(trgtTimeStr) && trgtTimeStr.length === 4){
        trgtDateStartStr += ' ' + trgtTimeStr.substring(0,2) + ':' + trgtTimeStr.substring(2,4);
        let endTime: number = (parseInt(trgtTimeStr.substring(0,2)) + 1);
        trgtDateEndtStr = trgtDateAry[0] + '/' + trgtDateAry[1] + '/' + trgtDateAry[2] + " " + endTime + ':' + trgtTimeStr.substring(2,4);
    
    } else {
        trgtTimeStr = '';
        trgtDateEndtStr = trgtDateStartStr;

    }

    trgtTitle = trgtTitle.replace(trgtTimeStr, '').trim()

    let trgtCal = CalendarApp.getCalendarById(GOOGLE_CALENDAR_ID);

    // 新規タスクかどうかで処理を分ける（バージョンが空なら新規タスク追加）
    if (typeof body.content.versions[0] === 'undefined') {
        let trgtEvent;
        if (trgtTimeStr === '') {
            trgtEvent = trgtCal.createAllDayEvent(trgtTitle, new Date(trgtDateStartStr));
        } else {
            trgtEvent = trgtCal.createEvent(trgtTitle, new Date(trgtDateStartStr), new Date(trgtDateEndtStr));
        }

        let trgtEventId = trgtEvent.getId();

        let issueKey: string = body.project.projectKey + '-' + body.content.key_id;
        AddVersionsToBacklogTask(issueKey, trgtEventId)

    } else {
        // 差分がversionsなら処理しない（新規追加のgooglecalendarイベントID入力がトリガーとなっているから）
        if (body.content.changes[0].field.indexOf('version') != -1) {
            return;
        }
        let trgtVersion: string = body.content.versions[0]['name'];
        let trgtEvent = trgtCal.getEventById(trgtVersion);

        trgtEvent.setTitle(trgtTitle);

        if (trgtTimeStr === '') {
            trgtEvent.setAllDayDate(new Date(trgtDateStartStr));
        } else {
            trgtEvent.setTime(new Date(trgtDateStartStr), new Date(trgtDateEndtStr));
        }

    }
}
function AddVersionsToBacklogTask(issueKey: string, eventId: string)  {
    AddNewVersionToBacklogProject(eventId)

    let trgtVersionId: number;
    trgtVersionId = getLatestVersionsId();

    const BACKLOG_HTTPREQUEST_ADD_VERSION_TO_TASK: string = 'https://' + BACKLOG_SPACE_KEY + '.backlog.com/api/v2/issues/' + issueKey + '?apiKey=' + BACKLOG_API_TOKEN;
    let param = {
        "method": "patch"
    };

    let options = {
        'versionId[]': trgtVersionId,
    };

    let request = UrlFetchApp.fetch(BACKLOG_HTTPREQUEST_ADD_VERSION_TO_TASK　+ '&' + createQuery(options), param);

    return JSON.parse(request.getContentText());
}
function AddNewVersionToBacklogProject(trgtName: string) {
    const BACKLOG_HTTPREQUEST_ADD_VERSION: string = 'https://' + BACKLOG_SPACE_KEY + '.backlog.com/api/v2/projects/' + BACKLOG_PROJECT_ID + '/versions?apiKey=' + BACKLOG_API_TOKEN;
    let param = {
        "method": "post"
    };

    let options = {
        "name":[trgtName],
    };

    let request = UrlFetchApp.fetch(BACKLOG_HTTPREQUEST_ADD_VERSION　+ '&' + createQuery(options), param);

    return JSON.parse(request.getContentText());
}
function createQuery(param) {
    let query = [];
    for(let key in param) {
      query.push(key + '=' + encodeURI(param[key]))
    };
    return query.join('&');
}

function getLatestVersionsId(): number {
    const BACKLOG_HTTPREQUEST_GET_VERSIONS: string = 'https://' + BACKLOG_SPACE_KEY + '.backlog.com/api/v2/projects/' + BACKLOG_PROJECT_ID + '/versions?apiKey=' + BACKLOG_API_TOKEN;

    let param = {
        "method": "get"
    };

    let request = UrlFetchApp.fetch(BACKLOG_HTTPREQUEST_GET_VERSIONS, param);

    let obj = JSON.parse(request.getContentText());

    let cnt: number;
    cnt = obj[0]['id'];

    return cnt;
}


// delete for-dev
function deleteAllVersion() {
    const BACKLOG_HTTPREQUEST_GET_VERSIONS: string = 'https://' + BACKLOG_SPACE_KEY + '.backlog.com/api/v2/projects/' + BACKLOG_PROJECT_ID + '/versions?apiKey=' + BACKLOG_API_TOKEN;

    let param = {
        "method": "get"
    };

    let request = UrlFetchApp.fetch(BACKLOG_HTTPREQUEST_GET_VERSIONS, param);

    let obj = JSON.parse(request.getContentText());
    
    for (let i = 0; i < obj.length; i++) {
        let BACKLOG_HTTPREQUEST_GET_VERSIONSa: string = 'https://' + BACKLOG_SPACE_KEY + '.backlog.com/api/v2/projects/' + BACKLOG_PROJECT_ID + '/versions/' + obj[i]['id'] + '?apiKey=' + BACKLOG_API_TOKEN;

        let param = {
            "method": "delete"
        };

        let request = UrlFetchApp.fetch(BACKLOG_HTTPREQUEST_GET_VERSIONSa, param);
    }
}
// test for-debug
const SLACK_WEBHOOK_URL: string = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
function PostMessageToSlack(sendBody: string) {
    let params: any = {
        method: 'post',
        contentType: 'application/json',
        payload: `{"text":'${ sendBody }'}`
    };
    
    UrlFetchApp.fetch(SLACK_WEBHOOK_URL, params);
}