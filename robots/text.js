const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const setenceBoundaryDetection = require('sbd')

// implementando o watson 
const watsonApiKey = require('../credentials/watson-nlu.json').apikey



//Implementacao Watson 
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

var nlu = new NaturalLanguageUnderstandingV1({
    iam_apikey: watsonApiKey,
    version: '2018-04-05',
    url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
  });
  


 


async function robot(content){
   
    await fetchContentFromWikipedia(content)
     sanitizeContent(content)
     breakContentIntoSentences(content)
     limitMaximumSentences(content)
     await fetchKeywordsOfAllSentences(content)



    //  funcao que utiliza a Api da Algorithmia para realizar o crawler do wikipedia utilizando o termos para buscar
    async function fetchContentFromWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
        const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponde.get()
        
        content.sourceContentOriginal = wikipediaContent.content
    }

    //  funcao para limpar o resultado e trabalhar 
    function sanitizeContent(content){
    //     //limpando as linhas brancas
    //     const withoutBlankLines = removeBlankLines(content.sourceContentOriginal)
    //     //Limpar os markdown do wikipedia
    //     const withoutMarksdown = removeMarkdown(withoutBlankLines)
    //     console.log(withoutMarksdown)

    //     //funcao para remover as linhas brancas
    //     function removeBlankLines(text){
    //         const allLines = text.split('\n')

    //         const withoutBlankLines = allLines.filter((line) => {
    //             if(line.trim().length === 0){
    //                 return false
    //             }
    //             return true
    //         })
    //         return withoutBlankLines
    //     }

    //     function removeMarkdown(lines){
    //         const withoutMarksdown = lines.filter((line) => {
    //             if(line.trim().startsWith('=')){
    //                 return false
    //             }
    //             return true 
    //         })
    //         return withoutMarksdown

    //     }

    // }

    //agregando as ultimas 2 funçoes em uma unica

    const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
    // retirar as data dos parenteses
    const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)
    
    content.sourceContentSanitized = withoutDatesInParentheses 

    
    function removeBlankLinesAndMarkdown(text){
        const allLines = text.split('\n')

        const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
            if(line.trim().length === 0 || line.trim().startsWith('=')){
                return false
            }
            return true
        })
        return withoutBlankLinesAndMarkdown.join(' ')
    }

    function removeDatesInParentheses(text){
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
    }
}
    function breakContentIntoSentences(content){
        content.sentences = []
        const sentences = setenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
        
    }
    function limitMaximumSentences(content){
        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }
    async function fetchKeywordsOfAllSentences(content){
        for(const sentence of content.sentences){
            sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text) 
        }
    }

async function fetchWatsonAndReturnKeywords(sentences){
    return new Promise((resolve, reject) => {
        nlu.analyze({
            text: sentences,
            features: {
                keywords: {}
            }
        },(error, response) => {
            if(error){
                throw error
            }
            const keywords = response.keywords.map((keyword) => {
                return keyword.text 
            })
            resolve(keywords)
        })
    } )
}

}

module.exports = robot