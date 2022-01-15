import esc from 'sql-escape'


export default
(strings, ...values) => [...(function*() {
  for (let i = 0; i < strings.length; i++) {
    yield strings[i]
    if(values[i] != null)
      yield esc(values[i])
  }
})()].join('')
