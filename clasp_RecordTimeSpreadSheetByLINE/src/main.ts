const LINE_CHANNEL_ACCESSTOKEN: string = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESSTOKEN');
const SPREADSHEET_ID: string = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const SPREADSHEET_URL: string = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_URL');
const SHEET1_NAME: string = PropertiesService.getScriptProperties().getProperty('SHEET1_NAME');
const SHEET2_NAME: string = PropertiesService.getScriptProperties().getProperty('SHEET2_NAME');
const SCHOOL1: string = PropertiesService.getScriptProperties().getProperty('SCHOOL1');
const SCHOOL1COLUMN: string = PropertiesService.getScriptProperties().getProperty('SCHOOL1COLUMN');
const SCHOOL2: string = PropertiesService.getScriptProperties().getProperty('SCHOOL2');
const SCHOOL2_YESTERDAY: string = PropertiesService.getScriptProperties().getProperty('SCHOOL2_YESTERDAY');
const SCHOOL2COLUMN: string = PropertiesService.getScriptProperties().getProperty('SCHOOL2COLUMN');
const DATECOLUMN: string = PropertiesService.getScriptProperties().getProperty('DATECOLUMN');
const UNITTIME1: string = PropertiesService.getScriptProperties().getProperty('UNITTIME1');
const UNITTIME2: string = PropertiesService.getScriptProperties().getProperty('UNITTIME2');
const TOTALMINUTEROW: string = PropertiesService.getScriptProperties().getProperty('TOTALMINUTEROW');
const TOTALMINUTECOLUMN: string = PropertiesService.getScriptProperties().getProperty('TOTALMINUTECOLUMN');
const TOTALHOURROW: string = PropertiesService.getScriptProperties().getProperty('TOTALHOURROW');
const TOTALHOURCOLUMN: string = PropertiesService.getScriptProperties().getProperty('TOTALHOURCOLUMN');

function doPost(e: string) {
    let event = JSON.parse(e.postData.contents).events[0];
    let replyToken: string = event.replyToken;

    if (typeof replyToken === 'undefined') {
        throw new Error('undefined Token');
    }

    if (event.type !== 'message') {
        return;
    }
    let userMessage: string = event.message.text.trim();
    if (userMessage.indexOf('URL') !== -1) {   
        sendToLINE(replyToken, SPREADSHEET_URL);
        return;
    }

    let targetSpreadSheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let totalSheet = targetSpreadSheet.getSheetByName(SHEET1_NAME);
    let dataSheet = targetSpreadSheet.getSheetByName(SHEET2_NAME);

    let recordColumn: number = getRecordColumn(userMessage);
    if (recordColumn === 0) {
        sendToLINE(replyToken, 'invalid Text');
        return;
    }

    let recordRow: number = getRecordRow(dataSheet, userMessage);
    
    let recordRange = dataSheet.getRange(recordRow, recordColumn);

    let unitTime: number = getUnitTime(userMessage)

    // 時間を書き込む
    let recordValue: number = recordRange.getValue() + unitTime;
    recordRange.setValue(recordValue);

    let replyMessageToLINE: string = getTotalRecord(totalSheet);
    sendToLINE(replyToken, replyMessageToLINE)
}

function getRecordColumn(userMessage: string){
    let columnArray: { school: string; column: number }[] = [
        { school: SCHOOL1, column: parseInt(SCHOOL1COLUMN) },
        { school: SCHOOL2, column: parseInt(SCHOOL2COLUMN) },
        { school: SCHOOL2_YESTERDAY, column: parseInt(SCHOOL2COLUMN) },
    ];

    let column: number = 0;
    let isColumnFound: boolean = columnArray.some((element) => {
        if (element.school === userMessage) {
            column = element.column;
            return true;
        }
    });

    if (!isColumnFound) {
        column = 0
    };

    return column;
}

function getRecordRow(dataSheet, userMessage: string) {
    let targetDate: Date = new Date();;
    if (userMessage.indexOf('-1') > -1) {
        targetDate.setDate(targetDate.getDate() - 1);
    };

    let targetDateString: string = Utilities.formatDate(targetDate, 'Asia/Tokyo', 'yyyy/MM/dd');

    let dateLastRow = dataSheet.getLastRow();
    let dateRange = dataSheet.getRange(1, DATECOLUMN, dateLastRow, 1);
    let dateArray: any[] = dateRange.getValues().reverse();
    
    let row: number;
    let isDateFound: boolean = dateArray.some(function(date, index){
        let sheetDate: Date = new Date(date);
        let sheetDateString: string = Utilities.formatDate(sheetDate, 'Asia/Tokyo', 'yyyy/MM/dd');
        if (sheetDateString === targetDateString) {
            row = dateArray.length - index;
            return true;
        }
    })

    // 対象の日付がなければ日付行追加
    if (!isDateFound) {
        row = dateLastRow + 1;
        dataSheet.getRange(row, DATECOLUMN).setValue(targetDateString);
    }

    return row;
}

function getUnitTime(userMessage: string){
    let unitTimeArray: { school: string; time: string }[] = [
        { school: SCHOOL1, time: UNITTIME1 },
        { school: SCHOOL2, time: UNITTIME2 },
        { school: SCHOOL2_YESTERDAY, time: UNITTIME2 },
    ];

    let unitTime: number = 0;
    unitTimeArray.some((element) => {
        if (element.school === userMessage) {
            unitTime = parseInt(element.time);
            return true;
        }
    });
    
    return unitTime;
}

function getTotalRecord(targetSheet){
    let totalMinuteRange = targetSheet.getRange(parseInt(TOTALMINUTEROW), parseInt(TOTALMINUTECOLUMN))
    let totalHourRange = targetSheet.getRange(parseInt(TOTALHOURROW), parseInt(TOTALHOURCOLUMN))
    let totalRecord: string = totalMinuteRange.getValue() + '分' + totalHourRange.getValue();
    return totalRecord;
}

function sendToLINE(replyToken: string, replyMessageToLINE: string){
    const LINE_HTTPREQUEST_REPLY: string = 'https://api.line.me/v2/bot/message/reply';
    UrlFetchApp.fetch(LINE_HTTPREQUEST_REPLY, {
        'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESSTOKEN,
        },
        'method': 'post',
        'payload': JSON.stringify({
        'replyToken': replyToken,
        'messages': [{
            'type': 'text',
            'text': replyMessageToLINE,
        }],
        }),
    });
}