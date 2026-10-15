import type { LanguageRegistration } from 'shiki'

/** Minimal TextMate grammar for Wireshark/tshark display filters. */
export const wiresharkGrammar: LanguageRegistration = {
  name: 'wireshark',
  scopeName: 'source.wireshark',
  aliases: ['wsfilter', 'dfilter'],
  repository: {},
  patterns: [
    { name: 'comment.line.number-sign', match: '#.*$' },
    { name: 'string.quoted.double', match: '"(?:[^"\\\\]|\\\\.)*"' },
    { name: 'keyword.operator.logical', match: '\\b(?:and|or|not|xor|in|contains|matches|eq|ne|gt|lt|ge|le|any|all)\\b|&&|\\|\\||!=|==|>=|<=|~|!|>|<' },
    { name: 'constant.numeric.mac', match: '\\b(?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}\\b' },
    { name: 'constant.numeric.ip', match: '\\b\\d{1,3}(?:\\.\\d{1,3}){3}(?:/\\d{1,2})?\\b' },
    { name: 'constant.numeric', match: '\\b0x[0-9a-fA-F]+\\b|\\b\\d+(?:\\.\\d+)?\\b' },
    { name: 'entity.name.function', match: '\\b(?:len|count|upper|lower|string|max|min|abs)(?=\\()' },
    { name: 'variable.other.field', match: '\\b[a-zA-Z_][a-zA-Z0-9_-]*(?:\\.[a-zA-Z0-9_-]+)*\\b' },
    { name: 'punctuation', match: '[{}()\\[\\],]' },
  ],
}
