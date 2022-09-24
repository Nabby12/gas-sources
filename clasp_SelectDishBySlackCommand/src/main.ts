const SLACK_VERIFICATIONTOKEN: string = PropertiesService.getScriptProperties().getProperty('SLACK_VERIFICATIONTOKEN');
const SLACK_WEBHOOK_URL: string = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
const SPREADSHEET_ID: string = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const SHEET1NAME: string = PropertiesService.getScriptProperties().getProperty('SHEET1NAME');
const SENDCOMMENTSTR1: string = PropertiesService.getScriptProperties().getProperty('SENDCOMMENTSTR1');
const SENDCOMMENTSTR2: string = PropertiesService.getScriptProperties().getProperty('SENDCOMMENTSTR2');
const SPREADSHEET_URL: string = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_URL');

function doPost(e: string) {
    let verificationToken: string = e.parameter.token;
    if (verificationToken != SLACK_VERIFICATIONTOKEN) {
        throw new Error('Invalid Token');
    }
    
    let arg: string = e.parameter.text.trim();
    arg = arg.replace(/　/g, ' ');

    if (arg.length > 0) {
        let tmpAry: string[] = arg.split(' ');
        if (tmpAry[0] === 'URL') {
            PostMessageToSlack(SPREADSHEET_URL);
            return ContentService.createTextOutput();
        }
    }

    let trgtSpreadSheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let trgtSh = trgtSpreadSheet.getSheetByName(SHEET1NAME);

    let dataLastRow = trgtSh.getLastRow();
    let trgtRng = trgtSh.getRange(1, 1, dataLastRow, 2);
    let trgtAry: any[] = trgtRng.getValues();
    let trgtRowIndex: number = Math.floor(Math.random() * dataLastRow);
    
    // 配列のインデックスは「0」から始まるため「-1」
    const dishColIndex: number = 1 - 1;
    const materialColIndex: number = 2 - 1;

    let noMatchFlg: boolean = false;

    if (arg.length > 0) {        
        let trgtMaterial: string[] = arg.split(' ');
        let trgtMaterialRowsIndexAry: number[] = new Array;
        
        trgtAry.forEach(function(el, index) {
            if (el[materialColIndex].indexOf(trgtMaterial[0]) != -1){
                trgtMaterialRowsIndexAry.push(index);
            }
        });
        
        // 材料が二つ以上指定されていたら、さらに結果を絞り込む
        if (trgtMaterial.length > 1) {
            for(let i = 1; i <= trgtMaterial.length - 1; i++) {
                let tmpRowIndexAry: number[] = new Array;
                trgtMaterialRowsIndexAry.forEach(function(el, index) {
                    if (trgtAry[el][materialColIndex].indexOf(trgtMaterial[i]) != -1){
                        tmpRowIndexAry.push(trgtMaterialRowsIndexAry[index]);
                    }
                }
                if (tmpRowIndexAry.length === 0){
                    trgtMaterialRowsIndexAry = new Array;
                    break;
                }
                
                trgtMaterialRowsIndexAry = new Array
                tmpRowIndexAry.forEach(function(el) {
                    trgtMaterialRowsIndexAry.push(el);
                });
            }
        }
        
        if (trgtMaterialRowsIndexAry.length === 0) {
            noMatchFlg = true;
        } else {
            let trgtIndex: number = Math.floor(Math.random() * trgtMaterialRowsIndexAry.length);
            trgtRowIndex = trgtMaterialRowsIndexAry[trgtIndex];
        }
    }

    let trgtDish: string = trgtAry[trgtRowIndex][dishColIndex];
    let materials: string = trgtAry[trgtRowIndex][materialColIndex];

    let sendComment: string;
    if (noMatchFlg === true) {
        sendComment = `${ trgtDish }

${ SENDCOMMENTSTR1}：${ materials }

${ SENDCOMMENTSTR2 }`
    } else {
        sendComment = `${ trgtDish }

${ SENDCOMMENTSTR1}：${ materials }`
    }
    
    PostMessageToSlack(sendComment);
    
    return ContentService.createTextOutput();
}

function PostMessageToSlack(sendBody: string) {
    let params: any = {
        method: 'post',
        contentType: 'application/json',
        payload: `{"text":'${ sendBody }'}`
    };
    
    UrlFetchApp.fetch(SLACK_WEBHOOK_URL, params);
}