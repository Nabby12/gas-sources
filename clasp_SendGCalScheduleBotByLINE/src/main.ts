const GOOGLE_CALENDAR_ID: string = PropertiesService.getScriptProperties().getProperty('GOOGLE_CALENDAR_ID');
const LINE_NOTIFY_TOKEN: string = PropertiesService.getScriptProperties().getProperty('LINE_NOTIFY_TOKEN');
const ALLDAY_EVENT_STARTSTR: string = PropertiesService.getScriptProperties().getProperty('ALLDAY_EVENT_STARTSTR');
const TARGET_HOUR: string = PropertiesService.getScriptProperties().getProperty('TARGET_HOUR');
const TARGET_MINITUE: string = PropertiesService.getScriptProperties().getProperty('TARGET_MINITUE');
const TRIGGER_TARGET_FUNCTION: string = PropertiesService.getScriptProperties().getProperty('TRIGGER_TARGET_FUNCTION');

function SendGoogleCalendarScheduleToLINE() {
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
    let trgtCal = CalendarApp.getCalendarById(GOOGLE_CALENDAR_ID);
    let today: Date = new Date();

    let todayEvents = trgtCal.getEventsForDay(today);

    if (todayEvents.length === 0) {
        return;
    }
    
    let sendBody: string = '';
    todayEvents.forEach(event => {
        let eventTitle: string = event.getTitle();

        if (event.isAllDayEvent()){
            sendBody += '\n' + ALLDAY_EVENT_STARTSTR + '   - ' + eventTitle;
            
        } else {
            let startTime: string = ('0' + event.getStartTime().getHours()).slice(-2) + ':' + ('0' + event.getStartTime().getMinutes()).slice(-2);
            let sendStr: string  = startTime + ' - ' + eventTitle;

            sendBody += '\n' + sendStr;

        }
    }); 
    
    return sendBody;
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