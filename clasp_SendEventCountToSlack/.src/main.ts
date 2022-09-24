let NAME1: string = PropertiesService.getScriptProperties().getProperty('NAME1');
let NAME2: string = PropertiesService.getScriptProperties().getProperty('NAME2');
let KEYWORD1: string = PropertiesService.getScriptProperties().getProperty('KEYWORD1');
let SLACK_WEBHOOKS: string = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOKS');
let CAL_ID: string = PropertiesService.getScriptProperties().getProperty('CAL_ID');

function SendEventCountToSlack () {
    let postUrl: string = SLACK_WEBHOOKS;
    let userName: string = 'gas_auto';

    let cntAry: number[] = CountMyCalendarEvent(KEYWORD1);
    let message: string = 
        `${ (new Date().getMonth() + 1) - 1}月 ${ KEYWORD1 }
        ${ NAME1 } : ${ cntAry[0] }　${ NAME2 } : ${ cntAry[1] }`
    
    let jsonData = 
    {
        "username" : userName,
        "text" : message
    };
    let payload = JSON.stringify(jsonData);

    let options = 
    {
        "method" : "post",
        "contentType" : "application/json",
        "payload" : payload
    };

    UrlFetchApp.fetch(postUrl, options);
}


//先月のイベントの内、渡された引数（keyword）が含まれているイベント数を返す
function CountMyCalendarEvent(keyword: string): number[] {
    let trgtCal = CalendarApp.getCalendarById(CAL_ID);

    let trgtDate: Date = new Date();
    trgtDate = new Date(trgtDate.getFullYear(), trgtDate.getMonth(), 1, 13); //日本時間0時を取得するため、13時間追加

    let thisYear: number = trgtDate.getFullYear();
    let thisMonth: number = trgtDate.getMonth();

    let strtDate: Date = new Date(thisYear, thisMonth - 1, 1);
    let endDate: Date = new Date(thisYear, thisMonth, 1); //1日の0時までを指定して月末の夜12時まで対象とする
    
    let trgtEvents = trgtCal.getEvents(strtDate, endDate);
    
    let cntAry: number[] = [0, 0];
    let eventTitle: string;
    trgtEvents.forEach(event => {
        eventTitle = event.getTitle();
        if (eventTitle.indexOf(keyword) != -1) {
            if (eventTitle.indexOf(NAME1) === 0) {
                cntAry[0] = cntAry[0] + 1;
            } else if (eventTitle.indexOf(NAME2) === 0) {
                cntAry[1] = cntAry[1] + 1;
            } else {
                cntAry[0] = cntAry[0] + 1; 
                cntAry[1] = cntAry[1] + 1; 
            }
        }
    });
    return cntAry;
}