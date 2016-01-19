# A directory index for gh-pages

## Two steps how-to:

1. Include script: http://amio.github.io/gh-index/index.js
2. Add a wrapper div: `<div id="gh-index" repo="mozilla/Fira"></div>`

done: http://amio.github.io/gh-index/

![Screenshot](https://cloud.githubusercontent.com/assets/215282/12411930/788bc2b2-bebd-11e5-9825-307e558486aa.png)

## Configuration

Add these attributes to `<div id="gh-index" />` in your [index.html](https://github.com/amio/gh-index/blob/gh-pages/index.html):

* `repo` *{String}*  
Specify another repo, such as 'yeoman/yeoman.io'.

* `excludes` *{RegExp}* (optional)  
  If there's something you want to hide.

for example:
```
<div id="gh-index" repo="amio/gh-index" excludes="\.gitignore"></div>
```
