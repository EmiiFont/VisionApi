const { Client } = require('pg');
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'quizup',
    password: 'password1',
    port: 5432,
  });

client.connect();

function getBlockText(block) {
    let result = '';
    block.paragraphs.forEach(paragraph => {
        paragraph.words.forEach(word => {
            let isThird = false;
            word.symbols.forEach(symbol => {
                result += symbol.text;

                if(symbol.text == "3") isThird = true;

                if (symbol.property && symbol.property.detectedBreak) {
                    const breakType = symbol.property.detectedBreak.type;
                    if (['EOL_SURE_SPACE' ,'SPACE'].includes(breakType)) {
                        result += " ";
                    }
                    if (['EOL_SURE_SPACE' ,'LINE_BREAK'].includes(breakType)) {
                        result += "\n"; // Perhaps use os.EOL for correctness.
                    }
                }
            })
        })
    })

    return result;
}

function getTextBlocks(visionResults) {
    let textBlocks = [];
    let blockIndex = 0;;
    visionResults.forEach(result => {
        if(result.fullTextAnnotation.text.indexOf("Falso") >= 0 && result.fullTextAnnotation.text.indexOf("Verdadero") >= 0){
            result.fullTextAnnotation.pages.forEach(page => {
                textBlocks = textBlocks.concat(page.blocks.map(block => { return { blockIndex: blockIndex++, text: getBlockText(block) }}));
            });
        }
        else{
            let t = result.fullTextAnnotation.text.split('\n');
            let question= "";
            let answer = "";
            let isLast = false;
            for(let i=0; i<= t.length - 1; i++){
                
                isLast = t[i].indexOf("3)") >= 0;
                
                if(t[i].indexOf("1)") >= 0 || t[i].indexOf("2)") >= 0 || isLast){
                  answer += " " + t[i];
                }else{
                   question += " " + t[i]; 
                }
                if(isLast){
                    textBlocks.push({question: question, answer: answer, type: 1});
                    question  = "";
                    answer = "";
                    isLast = false;
                }
            }
            console.log(result.fullTextAnnotation.text);
        }
    });
    return textBlocks;
}

function processMultipleSelectionQuestions(text){

}

function processTrueFalseQuestions(resultText){
   
    let questionAnswer = [];

    for(let i = 0; i<= resultText.length - 1; i++){
      
      let currentText = resultText[i];
      
      if(i + 1 <= resultText.length - 1){
        let nextText = resultText[i + 1];
        if(nextText.text.indexOf("Falso") >= 0 || nextText.text.indexOf("Verdadero") >= 0){
           questionAnswer.push({question: currentText.text, answer: nextText.text, type: 2});
        }
      }
   }

   return questionAnswer;
}


function insert(questionInfo){

  const queryText = 'INSERT INTO "questionsTemp"("Question", "Answer", "Options", "type")  Values($1, $2, $3, $4)';
  const values = [questionInfo.question, questionInfo.answer, '', questionInfo.type];

  client.query(queryText, values).then(res =>{
      console.log(res.rows[0]);
  }).catch(e => console.error(e.stack));

}

function quickstart() {

// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');

// Creates a client
const client = new vision.ImageAnnotatorClient();

// Performs label detection on the image file
let resultText = [];
client.textDetection('./croppedImages/croppedImage00.jpg').then(results => 
    { 
        resultText = getTextBlocks(results);
       
        if(results[0].textAnnotations[0].description.indexOf("Falso") >= 0)
        {
            let result = processTrueFalseQuestions(resultText);
            console.log(result);
            
            //result.forEach(questtion => insert(questtion))

        }else{
            resultText.forEach(questtion => insert(questtion))
            //resultText.forEach(label => console.log(label.text));
        }

    })
.catch(err => {
    console.error("An error occurred: ", err);
});

//labels.forEach(label => console.log(label.blocks));
}

quickstart();