import {
  Selection,
  TextEditor,
  TextLine,
  Range,
} from 'vscode'
import {InlineInput} from './inlineInput'
import {documentRippleScanner} from './documentRippleScanner'
import {AssociationManager} from './associationManager'

type Match = { start: number, end: number, excludedChars: string[] }
type MatchesArr = Match[]

export class FindThenJump {
  isActive = false
  inlineInput: InlineInput | any
  intervalHandler: any
  userInput: string = ''
  textEditor: TextEditor | any
  associationManager = new AssociationManager()
  activityIndicatorState = 0
  activatedWithSelection = false
  searchFunctionDebounceTracker: any

  initiate = (textEditor: TextEditor) => {
    if (this.isActive) {
      return
    }

    this.textEditor = textEditor

    this.isActive = true

    this.inlineInput = new InlineInput({
      textEditor,
      onInput: this.onInput,
      onBackspace: this.onBackspace,
      onCancel: this.reset,
    })

    this.updateStatusBarWithActivityIndicator()
  }

  initiateWithSelection = (textEditor: TextEditor) => {
    this.activatedWithSelection = true
    this.initiate(textEditor)
  }

  onInput = (input: string, char: string) => {
    if (this.associationManager.associations.has(char)) {
      this.jump(char)

      return
    }

    this.updateUserInputAndFindState(input)
  }

  onBackspace = (input: string) => {
    if (input === '') {
      this.userInput = input
      this.associationManager.dispose()
      this.updateStatusBarWithActivityIndicator()

      return
    }

    this.updateUserInputAndFindState(input)
  }
  
  updateUserInputAndFindState = (input: string) => {
    this.userInput = input
    this.updateStatusBarWithActivityIndicator()
    this.performSearch()
  }

  performSearch = () => {
    const {matches, availableJumpChars} = this.getMatchesAndAvailableJumpChars()

    if (matches.length > 0) {
      this.associationManager.dispose()
    }

    for (let i = 0; i < matches.length; i++) {
      if (availableJumpChars[i] === undefined) {
        break
      }

      const match = matches[i]
      const availableJumpChar = availableJumpChars[i]
      const {index, value} = match
      const range = new Range(index, value.start, index, value.end)

      this.associationManager.createAssociation(availableJumpChar, range, this.textEditor)
    }
  }

  jump = (jumpChar: string) => {
    const range = this.associationManager.associations.get(jumpChar)

    if (!range) {
      return
    }

    const {line, character} = range.start

    this.textEditor.selection = new Selection(
      this.activatedWithSelection ? this.textEditor.selection.start.line : line,
      this.activatedWithSelection ? this.textEditor.selection.start.character : character,
      line,
      character,
    )

    this.reset()
  }

  getMatchesAndAvailableJumpChars = () => {
    const {document, selection} = this.textEditor
    const documentIterator = documentRippleScanner(document, selection.end.line)
    const availableJumpChars = [...this.associationManager.jumpChars]
    const matches: { value: Match, index: number }[] = []

    outer: for (const {line, index} of documentIterator) {
      const lineMatches = this.getLineMatches(line)

      for(const lineMatch of lineMatches) {
        if (matches.length >= availableJumpChars.length) {
          break outer
        }

        matches.push({value: lineMatch, index})

        for(const excludedChar of lineMatch.excludedChars) {
          for (let i = 0; i < 2; i++) {
            const method = i === 0 ? 'toLowerCase' : 'toUpperCase'
            const indexOfExcludedChar = availableJumpChars.indexOf(excludedChar[method]())

            if (indexOfExcludedChar !== -1) {
              availableJumpChars.splice(indexOfExcludedChar, 1)
            }
          }
        }
      }
    }

    return {matches, availableJumpChars}
  }

  getLineMatches = (line: TextLine): MatchesArr => {
    const indexes = []
    const {text} = line
    const haystack = text.toLowerCase()
    const needle = this.userInput.toLowerCase()

    let index = 0
    let iterationNumber = 0
    while (
      (index = haystack.indexOf(needle, iterationNumber === 0 ? 0 : index + needle.length)) !== -1
    ) {
      const start = index
      const end = index + needle.length
      const excludedChars = haystack.slice(end, end + 8).replace(/[^a-z]/gi, '').split('')
      indexes.push({start, end, excludedChars})
      iterationNumber++
    }

    return indexes
  }

  reset = () => {
    this.isActive = false
    this.activatedWithSelection = false
    this.userInput = ''
    this.clearActivityIndicator()
    this.inlineInput.destroy()
    this.associationManager.dispose()
  }

  updateStatusBarWithActivityIndicator = () => {
    const callback = () => {
      if (this.activityIndicatorState === 1) {
        this.inlineInput.updateStatusBar(`Find-Jump: ${this.userInput} 🔴`)
        this.activityIndicatorState = 0
      } else {
        this.inlineInput.updateStatusBar(`Find-Jump: ${this.userInput} ⚪`)
        this.activityIndicatorState = 1
      }
    }

    this.inlineInput.updateStatusBar(
      `Find-Jump: ${this.userInput} ${this.activityIndicatorState === 0 ? '🔴' : '⚪'}`,
    )

    if (this.intervalHandler === undefined) {
      this.intervalHandler = setInterval(callback, 600)
    }
  }

  clearActivityIndicator = () => {
    clearInterval(this.intervalHandler)
    this.intervalHandler = undefined
  }
}
