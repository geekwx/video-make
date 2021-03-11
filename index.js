const readline = require('readline-sync')
function start() {
    const content = {}
    
    content.searchTerm = askAndReturnSearchTerm()
    content.prefix = askAndReturnPrefix()


    function askAndReturnSearchTerm(){
        return readline.question('Type a Wikipedia search term: ')
    }
    function askAndReturnPrefix(){
        const prefixes = ['Who is', 'What is', 'The history of']
        const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option: ')
        const selectedPredixText = prefixes[selectedPrefixIndex]

        console.log(selectedPrefixIndex)
    }
    console.log(content)
}

start()