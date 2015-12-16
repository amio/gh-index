# A directory index for your gh-pages

## Two steps how-to:

1. Put the [index.html](https://github.com/amio/gh-index/blob/gh-pages/index.html) into your repo.
2. Done!

## Demo

* [amio/gh-index](https://amio.github.io/gh-index)
```html
<html>
<head>
	<meta charset="utf-8">
	<title>gh-index</title>
	<link rel="stylesheet" href="http://amio.github.io/gh-index/index.css" />
	<script type="text/javascript" src="http://zeptojs.com/zepto.min.js"></script>
	<script type="text/javascript" src="http://amio.github.io/gh-index/index.js"></script>
</head>
<body>
	<div id="gh-index" data-repo="amio/gh-index" data-excludes="\.gitignore"></div>
</body>
</html>
```

## Configuration

Add these attributes to `<div id="gh-index" />` in your [index.html](https://github.com/amio/gh-index/blob/gh-pages/index.html):

* `data-excludes` *{RegExp}*  
  If there's something you want to hide.
* `data-repo` *{String}*  
  Specify another repo, such as 'yeoman/yeoman.io'.

for example:
```
<div id="gh-index" data-repo="amio/gh-index" data-excludes="\.gitignore"></div>
```
