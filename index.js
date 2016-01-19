/**
 * gh-index
 * An directory index for gh-pages.
 */

window.addEventListener('DOMContentLoaded', () => {

  String.prototype.replaceWith = function (obj) {
    return this.replace(/\{\$(\w+)\}/g, function (match, key) {
      return obj.hasOwnProperty(key) ? obj[key] : match
    })
  }

  const wrapper = document.getElementById('gh-index')

  const raf = (function () {
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function( callback ){
              window.setTimeout(callback, 1000 / 60)
            }
  })()

  function insertStylesheet (url) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.href = url
    document.head.appendChild(link)
  }

  function insertStylesheetAsync (url) {
    raf(function(){
      insertStylesheet(url)
    })
  }

  function getRepoInfo () {
    const repoconfig = (wrapper.getAttribute('data-repo') || wrapper.getAttribute('repo') || '').split('/')
    return {
      owner: repoconfig[0],
      name: repoconfig[1],
      branch: 'gh-pages'
    }
  }

  function loadTrees () {
    const repo = getRepoInfo()
    const cachedData = sessionStorage.getItem(repo.owner + '/' + repo.name);
    const treeData = cachedData && JSON.parse(cachedData);

    // Only fetch new data every 360 sec, to avoid github api restriction.
    if (treeData && (Date.now() - treeData.timestamp < 360000)) {
        index.refresh(treeData)
    } else {
      const uri = `https://api.github.com/repos/${repo.owner}/${repo.name}`
                + `/git/trees/${repo.branch}?recursive=1`
      window.fetch(uri)
        .then(resp => resp.json())
        .then(result => {
          // cache request data
          console.log(result.tree)
          result.tree.timestamp = Date.now()
          // sessionStorage.setItem(
          //   repo.owner + '/' + repo.name,
          //   JSON.stringify(result.tree)
          // )

          index.refresh(result.tree)
        })
    }
  }

  const index = {

      // RegExp for files to exclude
      excludes: new RegExp(document.body.getAttribute('data-excludes')),

      /**
       * Init gh-index
       */
      init: function () {
        window.addEventListener('hashchange', index.hashRoute)
        insertStylesheet('http://amio.github.io/gh-index/index.css')
        insertStylesheetAsync(
          'https://octicons.github.com/components/octicons/octicons/octicons.css'
        )

        loadTrees()
      },

      /**
       * Everything after data loaded.
       * @param resp
       */
      refresh: function (treeData) {
          // build tree
          index.tree = index.genTree(treeData)

          // build html
          index.hashRoute()
      },

      /**
       * Route task depends on current hash
       */
      hashRoute: function () {
          var path = window.location.hash.substr(1).split('/')
          var sub = index.tree

          while (sub && path.length && path[0]) {
              sub = sub[path.shift()]
          }

          index.updateIndexies(sub)
      },

      /**
       * Generate entire tree base on node list array return by Github API.
       * @param {Array} treeArr
       * @returns {Object}
       */
      genTree: function (treeArr) {
          var root = {};
          for (var i = treeArr.length; i--;) {
              if (!this.excludes.test(treeArr[i].path)) {
                  this.addItem(root, treeArr[i]);
              }
          }

          return root;
      },

      /**
       * Add an item into tree.
       * @param tree
       * @param item
       * @returns {*}
       */
      addItem: function (tree, item) {
          var target = 'blank', parent = tree;
          item.path.replace(/[^/]+/g, function (seg, idx) {
              parent[seg] || (parent[seg] = {});
              parent = parent[seg];
              target = seg;
              return idx;
          });

          parent['/NODE/'] = item;

          return item;
      },

      /**
       * Update list base on tree
       * @param tree
       */
      updateIndexies: function (tree) {
          // generate header html
          var path = window.location.hash.replace('#', ''),
              header = '<div class="header"><span>•_•</span></div>';
          if (path) {
              header = '<div class="header"><a class="uplink" href="{$uplink}">{$path}<span>←_←</span></a></div>'.replaceWith({
                  path: path,
                  uplink: '#' + path.replace(/[^/]+\/$/, '')
              });
          }

          // generate list html
          var repo = getRepoInfo()
          var tmpl = '<li class="{$type}">'
                      + '<a href="{$link}"><span class="{$icon}"></span> {$name}</a></li>',
              list = '<ul>',
              home = 'http://' + repo.owner + '.github.io/' + repo.name + '/',
              node;
          for (var item in tree) {
              if (item !== '/NODE/' && tree.hasOwnProperty(item)) {
                  node = tree[item]['/NODE/'];

                  list += tmpl.replaceWith({
                      type: node.type,
                      link: node.type === 'blob' ? (home + node.path) : '#' + node.path + '/',
                      name: node.path + (node.type === 'tree' ? '/' : ''),
                      icon: 'octicon octicon-file-' + (node.type === 'tree' ? 'directory' : 'text')
                  });
              }
          }
          list += '</ul>';

          // Generate footer html
          var footer = '<div class="footer"><a href="http://github.com/amio/gh-index" target="_blank">gh-index</a> ' +
              'by <a href="http://github.com/amio" target="_blank">amio</a></div>';

          // insert html
          wrapper.innerHTML = header + list + footer;
      }
  };

  index.init()

})
