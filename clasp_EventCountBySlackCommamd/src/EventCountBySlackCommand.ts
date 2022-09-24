const SLACK_VERIFICATIONTOKEN: string = PropertiesService.getScriptProperties().getProperty('SLACK_VERIFICATIONTOKEN');
const NAME1: string = PropertiesService.getScriptProperties().getProperty('NAME1');
const NAME2: string = PropertiesService.getScriptProperties().getProperty('NAME2');
const CAL_ID: string = PropertiesService.getScriptProperties().getProperty('CAL_ID');

function doPost(e: string) {
    let verificationToken: string = e.parameter.token;
    if (verificationToken != SLACK_VERIFICATIONTOKEN) {
        throw new Error('Invalid Token');
    }
    
    let arg: string = e.parameter.text.replace('　', ' ').trim();

    let sendComment: string;
    if (arg.length === 0) {

        sendComment = 
        `error: no keyword!
(slash command: /countevent)`
    
    } else {
    
        let commandAry: string[] = arg.split(' ');
        let keyword: string = commandAry[0];
        let trgtMonth: number = -1;
        let trgtYear: number = -1;
        let strtDate: Date;
        switch (commandAry.length) {
            case 2:
                trgtMonth = parseInt(commandAry[1],10) - 1;
                strtDate = new Date(new Date().getFullYear(), trgtMonth, 1);
                break;
            case 3:
                trgtMonth = parseInt(commandAry[1],10) - 1;
                trgtYear = parseInt(commandAry[2],10);
                strtDate = new Date(trgtYear, trgtMonth, 1);
                break;
            default:
                strtDate = new Date();
                strtDate = new Date(strtDate.getFullYear(), strtDate.getMonth(), 1);
        }

        let today: Date = new Date();
        if (strtDate > today) {
            strtDate.setFullYear(strtDate.getFullYear() - 1);
        }
        let cntAry: number[] = CountMyCalendarEvent(keyword, strtDate);
    
        sendComment = 
            `${ strtDate.getFullYear() }年${ strtDate.getMonth() + 1 }月 ${ keyword }
        ${ NAME1 } : ${ cntAry[0] }　${ NAME2 } : ${ cntAry[1] }`
        
        let thisMonth: number = today.getMonth();
        if (strtDate.getMonth() === thisMonth) {
            sendComment = 
                `${ sendComment }    （～${ today.getDate() }日）`
        }
    }

    let response = { text: sendComment};
    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

//任意の月（strtDate）のイベントの内、渡された引数（keyword）が含まれているイベント数を返す
function CountMyCalendarEvent(keyword: string, strtDate:Date): number[] {
    let thisYear: number = strtDate.getFullYear();
    let thisMonth: number = strtDate.getMonth();
    let endDate: Date = new Date(thisYear, thisMonth + 1, 1); //1日の0時までを指定して月末の夜12時まで対象とする
    
    let today: Date = new Date();
    if (endDate > today) {
        endDate.setDate(today.getDate() + 1);
    }
    
    let trgtCal = CalendarApp.getCalendarById(CAL_ID);
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